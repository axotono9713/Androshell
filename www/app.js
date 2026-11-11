
import { Capacitor, registerPlugin } from "@capacitor/core";

const Androshell = registerPlugin("Androshell");

const output = document.getElementById("output");
const terminal = document.getElementById("terminal");
const form = document.getElementById("command-form");
const input = document.getElementById("command");
const prompt = document.getElementById("prompt");

let deviceName = "Android";
let currentDirectory = [];
let storageReady = false;

const history = [];
let historyIndex = 0;

const fontOptions = {
  "default": "monospace",
  "blue screen": "Blue Screen",
  "departure mono": "Departure Mono",
  "monocraft": "Monocraft",
  "sometype mono": "Sometype Mono"
};

const styles = {
  classic: {
    background: "#000000",
    foreground: "#ffffff"
  },
  matrix: {
    background: "#000000",
    foreground: "#00ff41"
  }
};

let savedSettings = {};

try {
  savedSettings = JSON.parse(
    localStorage.getItem("androshell.settings") || "{}"
  );
} catch {
  savedSettings = {};
}

const settings = {
  style: ["classic", "matrix", "custom"].includes(savedSettings.style)
    ? savedSettings.style
    : "classic",
  font: Object.prototype.hasOwnProperty.call(
    fontOptions,
    savedSettings.font
  )
    ? savedSettings.font
    : "default",
  size: Number.isInteger(savedSettings.size) &&
    savedSettings.size >= 50 &&
    savedSettings.size <= 200
      ? savedSettings.size
      : 100,
  customBackground: /^#[0-9a-fA-F]{6}$/.test(savedSettings.customBackground)
    ? savedSettings.customBackground
    : "#000000",
  customForeground: /^#[0-9a-fA-F]{6}$/.test(savedSettings.customForeground)
    ? savedSettings.customForeground
    : "#ffffff"
};

function saveSettings() {
  localStorage.setItem(
    "androshell.settings",
    JSON.stringify(settings)
  );
}

function print(text = "") {
  const line = document.createElement("div");
  line.className = "output-line";
  line.textContent = String(text);
  output.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function clear() {
  output.replaceChildren();
}

function getDate() {
  return new Date();
}

function applyStyle() {
  const style = styles[settings.style];

  document.documentElement.style.setProperty(
    "--background",
    style ? style.background : settings.customBackground
  );

  document.documentElement.style.setProperty(
    "--foreground",
    style ? style.foreground : settings.customForeground
  );
}

function applyFont() {
  document.documentElement.style.setProperty(
    "--font",
    fontOptions[settings.font]
  );
}

function applySize() {
  document.documentElement.style.setProperty(
    "--ui-scale",
    String(settings.size / 100)
  );
}

function showCalendar() {
  const now = getDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  print(now.toLocaleDateString("en", {
    month: "long",
    year: "numeric"
  }));

  print("Su Mo Tu We Th Fr Sa");

  let row = "   ".repeat(firstDay);

  for (let day = 1; day <= totalDays; day++) {
    row += String(day).padStart(2, " ") + " ";

    if ((firstDay + day) % 7 === 0) {
      print(row.trimEnd());
      row = "";
    }
  }

  if (row.trim()) print(row.trimEnd());
}

function showSettings() {
  print("Androshell Settings");
  print("");
  print("style  " + settings.style);
  print("font   " + settings.font);
  print("size   " + settings.size + "%");

  if (settings.style === "custom") {
    print("background  " + settings.customBackground);
    print("foreground  " + settings.customForeground);
  }

  print("");
  print("Style:");
  print("settings style classic");
  print("settings style matrix");
  print("settings style custom");
  print("settings style background #101010");
  print("settings style foreground #ffffff");
  print("");
  print("Font:");
  print("settings font default");
  print("settings font blue screen");
  print("settings font departure mono");
  print("settings font monocraft");
  print("settings font sometype mono");
  print("");
  print("Size:");
  print("settings size 100");
  print("Range: 50-200%");
}

function setStyle(value) {
  if (!["classic", "matrix", "custom"].includes(value)) {
    print("Unknown style: " + value);
    print("Available: classic, matrix, custom");
    return;
  }

  settings.style = value;
  saveSettings();
  applyStyle();

  print("Style changed to " + value + ".");
}

function setFont(value) {
  if (!Object.prototype.hasOwnProperty.call(fontOptions, value)) {
    print("Unknown font: " + value);
    print("Available fonts:");

    Object.keys(fontOptions).forEach(font => print("  " + font));
    return;
  }

  settings.font = value;
  saveSettings();
  applyFont();

  print("Font changed to " + value + ".");
}

function setSize(value) {
  const size = Number(value);

  if (!Number.isInteger(size) || size < 50 || size > 200) {
    print("Invalid size. Use a whole number from 50 to 200.");
    return;
  }

  settings.size = size;
  saveSettings();
  applySize();

  print("Terminal size changed to " + size + "%.");
}

function setCustomColor(type, value) {
  if (settings.style !== "custom") {
    print("Switch to custom style first.");
    return;
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    print("Invalid color. Use #RRGGBB.");
    return;
  }

  if (type === "background") {
    settings.customBackground = value;
  } else {
    settings.customForeground = value;
  }

  saveSettings();
  applyStyle();

  print(type + " color changed to " + value + ".");
}

function requireAndroid() {
  if (Capacitor.getPlatform() !== "android") {
    print("This command requires the installed Android app.");
    return false;
  }

  return true;
}

async function ensureStorage() {
  if (!requireAndroid()) return false;
  if (storageReady) return true;

  try {
    await Androshell.getStorageInfo();
    storageReady = true;
    return true;
  } catch (error) {
    print("Could not access storage: " + error.message);
    return false;
  }
}

function cleanArgument(value) {
  const argument = value.trim();

  if (
    (argument.startsWith('"') && argument.endsWith('"')) ||
    (argument.startsWith("'") && argument.endsWith("'"))
  ) {
    return argument.slice(1, -1);
  }

  return argument;
}

function resolvePath(path = "") {
  const cleaned = cleanArgument(path).replace(/\\/g, "/");
  const absolute = cleaned.startsWith("/");
  const result = absolute ? [] : [...currentDirectory];

  for (const part of cleaned.split("/")) {
    if (!part || part === ".") continue;

    if (part === "..") {
      if (result.length) result.pop();
      continue;
    }

    result.push(part);
  }

  return result;
}

function getPathString(parts = currentDirectory) {
  return "/" + parts.join("/");
}

function formatSize(size) {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + " KB";
  }

  return (size / (1024 * 1024)).toFixed(1) + " MB";
}

async function listDirectory(path = "") {
  if (!await ensureStorage()) return;

  const target = path ? resolvePath(path) : [...currentDirectory];

  try {
    const result = await Androshell.listDirectory({
      path: target.join("/")
    });

    print("Directory: " + getPathString(target));
    print("");

    if (!result.entries || result.entries.length === 0) {
      print("Empty directory.");
      return;
    }

    for (const entry of result.entries) {
      if (entry.directory) {
        print("[DIR]  " + entry.name + "/");
      } else {
        print("[FILE] " + entry.name + "  (" +
          formatSize(entry.size) + ")");
      }
    }

    print("");
    print(result.entries.length + " item(s).");
  } catch (error) {
    print("Could not list directory: " + error.message);
  }
}

async function changeDirectory(path) {
  if (!await ensureStorage()) return;

  const target = path ? resolvePath(path) : [];

  try {
    await Androshell.listDirectory({
      path: target.join("/")
    });

    currentDirectory = target;
    print("Current directory: " + getPathString());
  } catch (error) {
    print("Could not change directory: " + error.message);
  }
}

async function makeDirectory(path) {
  if (!await ensureStorage()) return;

  if (!path.trim()) {
    print("Usage: mkdir folder-name");
    return;
  }

  const target = resolvePath(path);

  if (!target.length) {
    print("Cannot create the storage root.");
    return;
  }

  try {
    await Androshell.makeDirectory({
      path: target.join("/")
    });

    print("Directory created: " + getPathString(target));
  } catch (error) {
    print("Could not create directory: " + error.message);
  }
}

async function getInstalledApps() {
  if (!requireAndroid()) return null;

  try {
    const result = await Androshell.getApps();
    return result.apps || [];
  } catch (error) {
    print("Could not get apps: " + error.message);
    return null;
  }
}

async function findApp(target) {
  const apps = await getInstalledApps();
  if (!apps) return null;

  const query = target.toLowerCase();

  const app = apps.find(item =>
    item.name.toLowerCase() === query ||
    item.packageName.toLowerCase() === query
  );

  if (!app) print("App not found: " + target);
  return app || null;
}

async function handleApp(value) {
  if (!requireAndroid()) return;

  if (!value) {
    const apps = await getInstalledApps();
    if (!apps) return;

    const uniqueApps = new Map();

    for (const app of apps) {
      uniqueApps.set(app.packageName, app);
    }

    print("Installed launchable apps:");
    print("");

    for (const app of uniqueApps.values()) {
      print(app.name + " [" + app.packageName + "]");
    }

    print("");
    print(uniqueApps.size + " apps found.");
    return;
  }

  if (value.toLowerCase() === "settings") {
    try {
      await Androshell.openSystemSettings();
    } catch (error) {
      print("Could not open Settings: " + error.message);
    }
    return;
  }

  const infoMatch = value.match(/^-i\s+(.+)$/i);
  const uninstallMatch = value.match(/^-u\s+(.+)$/i);

  if (infoMatch || uninstallMatch) {
    const target = (infoMatch || uninstallMatch)[1].trim();
    const app = await findApp(target);
    if (!app) return;

    try {
      if (infoMatch) {
        await Androshell.openAppInfo({
          packageName: app.packageName
        });
      } else {
        await Androshell.uninstallApp({
          packageName: app.packageName
        });
      }
    } catch (error) {
      print(error.message);
    }

    return;
  }

  const app = await findApp(value);
  if (!app) return;

  try {
    await Androshell.launchApp({
      packageName: app.packageName
    });
  } catch (error) {
    print("Could not launch app: " + error.message);
  }
}

async function execute(command) {
  const trimmed = command.trim();
  const separator = trimmed.search(/\s/);
  const name = (separator === -1
    ? trimmed
    : trimmed.slice(0, separator)
  ).toLowerCase();

  const rawValue = separator === -1
    ? ""
    : trimmed.slice(separator).trim();

  switch (name) {
    case "help":
      print("Androshell v1 commands:");
      print("");
      print("help       Show commands");
      print("clear      Clear terminal");
      print("clock      Show current time");
      print("date       Show current date");
      print("calendar   Show calendar");
      print("echo       Print text");
      print("info       Device information");
      print("settings   Androshell settings");
      print("app        Android applications");
      print("");
      print("pwd        Show current directory");
      print("cd         Change directory");
      print("ls         List directory contents");
      print("dir        List directory contents");
      print("mkdir      Create a directory");
      print("");
      print("app Chrome       Launch an app");
      print("app -i Chrome    Open App Info");
      print("app -u Chrome    Request uninstall");
      print("app settings     Open Android Settings");
      break;

    case "clear":
      clear();
      break;

    case "clock":
      print(getDate().toLocaleTimeString());
      break;

    case "date":
      print(getDate().toDateString());
      break;

    case "calendar":
      showCalendar();
      break;

    case "echo":
      print(command.slice(4).trimStart());
      break;

    case "info":
      print("Androshell v1.0.0");
      print("Shell: CmdShell");
      print("Device: " + deviceName);
      print("Runtime: Capacitor WebView");
      break;

    case "settings": {
      const parts = rawValue.match(/^(\S+)(?:\s+([\s\S]*))?$/);
      const setting = parts?.[1]?.toLowerCase() || "";
      const argument = parts?.[2]?.trim() || "";

      if (!setting) {
        showSettings();
      } else if (setting === "style") {
        if (!argument) {
          print("Styles: classic, matrix, custom");
        } else {
          const colorMatch = argument.match(
            /^(background|foreground)\s+(\S+)$/i
          );

          if (colorMatch) {
            setCustomColor(
              colorMatch[1].toLowerCase(),
              colorMatch[2]
            );
          } else {
            setStyle(argument.toLowerCase());
          }
        }
      } else if (setting === "font") {
        if (!argument) {
          print("Available fonts:");
          Object.keys(fontOptions).forEach(font => print("  " + font));
        } else {
          setFont(argument.toLowerCase());
        }
      } else if (setting === "size") {
        if (!argument) {
          print("Current size: " + settings.size + "%");
        } else {
          setSize(argument);
        }
      } else {
        print("Unknown setting: " + setting);
        print("Available: style, font, size");
      }
      break;
    }

    case "pwd":
      print(getPathString());
      break;

    case "cd":
      await changeDirectory(rawValue);
      break;

    case "ls":
    case "dir":
      await listDirectory(rawValue);
      break;

    case "mkdir":
      await makeDirectory(rawValue);
      break;

    case "app":
      await handleApp(rawValue);
      break;

    default:
      print("Unknown command: " + command);
      print("Type 'help' for available commands.");
  }
}

async function initializeDeviceName() {
  if (Capacitor.getPlatform() !== "android") return;

  try {
    const result = await Androshell.getDeviceName();

    if (result.name) {
      deviceName = result.name;
      prompt.textContent = deviceName + ":";
    }
  } catch {
    print("Device name unavailable.");
  }
}

prompt.textContent = deviceName + ":";

applyStyle();
applyFont();
applySize();

print("Androshell v1.0.0");
print("CmdShell initialized.");
print("Type 'help' to see available commands.");
print("");

initializeDeviceName();

form.addEventListener("submit", async event => {
  event.preventDefault();

  const command = input.value.trim();
  if (!command) return;

  print(deviceName + ": " + command);

  history.push(command);
  historyIndex = history.length;

  input.value = "";

  try {
    await execute(command);
  } catch (error) {
    print("Command failed: " + error.message);
  }
});

input.addEventListener("keydown", event => {
  if (event.key === "ArrowUp") {
    event.preventDefault();

    if (historyIndex > 0) {
      historyIndex--;
      input.value = history[historyIndex];
    }
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();

    if (historyIndex < history.length - 1) {
      historyIndex++;
      input.value = history[historyIndex];
    } else {
      historyIndex = history.length;
      input.value = "";
    }
  }
});

document.addEventListener("click", () => input.focus());
