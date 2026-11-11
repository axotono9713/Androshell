
package com.androshell.launcher;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@CapacitorPlugin(name = "Androshell")
public class AndroshellPlugin extends Plugin {
    private File getStorageRoot() throws Exception {
        File root = new File(getContext().getFilesDir(), "Androshell");

        if (!root.exists() && !root.mkdirs()) {
            throw new Exception("Could not create Androshell storage");
        }

        return root.getCanonicalFile();
    }

    private File resolveStoragePath(String relativePath) throws Exception {
        if (relativePath == null) relativePath = "";

        if (relativePath.startsWith("/") ||
            relativePath.indexOf('\0') >= 0) {
            throw new Exception("Invalid storage path");
        }

        File root = getStorageRoot();
        File target = new File(root, relativePath).getCanonicalFile();

        String rootPath = root.getCanonicalPath();
        String targetPath = target.getCanonicalPath();

        if (!targetPath.equals(rootPath) &&
            !targetPath.startsWith(rootPath + File.separator)) {
            throw new Exception("Access outside Androshell storage is not allowed");
        }

        return target;
    }

    @PluginMethod
    public void getStorageInfo(PluginCall call) {
        try {
            File root = getStorageRoot();

            JSObject result = new JSObject();
            result.put("name", "Androshell");
            result.put("path", root.getAbsolutePath());
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Could not access storage: " + e.getMessage());
        }
    }

    @PluginMethod
    public void listDirectory(PluginCall call) {
        try {
            String relativePath = call.getString("path");
            File directory = resolveStoragePath(relativePath);

            if (!directory.exists() || !directory.isDirectory()) {
                call.reject("Directory not found: " + relativePath);
                return;
            }

            File[] files = directory.listFiles();

            if (files == null) {
                call.reject("Could not read directory");
                return;
            }

            Arrays.sort(files, new Comparator<File>() {
                @Override
                public int compare(File a, File b) {
                    if (a.isDirectory() != b.isDirectory()) {
                        return a.isDirectory() ? -1 : 1;
                    }

                    return a.getName().compareToIgnoreCase(b.getName());
                }
            });

            JSArray entries = new JSArray();

            for (File file : files) {
                JSObject entry = new JSObject();
                entry.put("name", file.getName());
                entry.put("directory", file.isDirectory());
                entry.put("size", file.isFile() ? file.length() : 0);
                entry.put("modified", file.lastModified());
                entries.put(entry);
            }

            JSObject result = new JSObject();
            result.put("entries", entries);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Could not list directory: " + e.getMessage());
        }
    }

    @PluginMethod
    public void makeDirectory(PluginCall call) {
        try {
            String relativePath = call.getString("path");

            if (relativePath == null || relativePath.trim().isEmpty()) {
                call.reject("Directory path is required");
                return;
            }

            File root = getStorageRoot();
            File directory = resolveStoragePath(relativePath);

            if (directory.equals(root)) {
                call.reject("Cannot create the storage root");
                return;
            }

            if (directory.exists()) {
                if (directory.isDirectory()) {
                    call.resolve();
                } else {
                    call.reject("A file with that name already exists");
                }
                return;
            }

            if (!directory.mkdirs()) {
                call.reject("Could not create directory");
                return;
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("Could not create directory: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getApps(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);

        PackageManager pm = getActivity().getPackageManager();
        List<ResolveInfo> activities =
            pm.queryIntentActivities(intent, 0);

        Collections.sort(activities, new Comparator<ResolveInfo>() {
            @Override
            public int compare(ResolveInfo a, ResolveInfo b) {
                String first = a.loadLabel(pm).toString();
                String second = b.loadLabel(pm).toString();
                return first.compareToIgnoreCase(second);
            }
        });

        JSArray apps = new JSArray();

        for (ResolveInfo info : activities) {
            JSObject app = new JSObject();
            app.put("name", info.loadLabel(pm).toString());
            app.put("packageName", info.activityInfo.packageName);
            apps.put(app);
        }

        JSObject result = new JSObject();
        result.put("apps", apps);
        call.resolve(result);
    }

    @PluginMethod
    public void launchApp(PluginCall call) {
        String packageName = call.getString("packageName");

        if (packageName == null || packageName.trim().isEmpty()) {
            call.reject("Package name is required");
            return;
        }

        try {
            Intent intent = getActivity()
                .getPackageManager()
                .getLaunchIntentForPackage(packageName.trim());

            if (intent == null) {
                call.reject("App not found or cannot be launched");
                return;
            }

            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not launch app: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openAppInfo(PluginCall call) {
        String packageName = call.getString("packageName");

        if (packageName == null || packageName.trim().isEmpty()) {
            call.reject("Package name is required");
            return;
        }

        try {
            Intent intent = new Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:" + packageName.trim())
            );

            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open App Info: " + e.getMessage());
        }
    }

    @PluginMethod
    public void uninstallApp(PluginCall call) {
        String packageName = call.getString("packageName");

        if (packageName == null || packageName.trim().isEmpty()) {
            call.reject("Package name is required");
            return;
        }

        try {
            Intent intent = new Intent(
                Intent.ACTION_DELETE,
                Uri.parse("package:" + packageName.trim())
            );

            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not request uninstall: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openSystemSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_SETTINGS);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open system Settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getDeviceName(PluginCall call) {
        JSObject result = new JSObject();
        result.put("name", Build.MODEL);
        call.resolve(result);
    }
}
