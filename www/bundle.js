(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // www/app.js
  var require_app = __commonJS({
    "www/app.js"() {
      init_dist();
      var Androshell = registerPlugin("Androshell");
      var output = document.getElementById("output");
      var terminal = document.getElementById("terminal");
      var form = document.getElementById("command-form");
      var input = document.getElementById("command");
      var prompt = document.getElementById("prompt");
      var deviceName = "Android";
      var currentDirectory = [];
      var storageReady = false;
      var history = [];
      var historyIndex = 0;
      var fontOptions = {
        "default": "monospace",
        "blue screen": "Blue Screen",
        "departure mono": "Departure Mono",
        "monocraft": "Monocraft",
        "sometype mono": "Sometype Mono"
      };
      var styles = {
        classic: {
          background: "#000000",
          foreground: "#ffffff"
        },
        matrix: {
          background: "#000000",
          foreground: "#00ff41"
        }
      };
      var savedSettings = {};
      try {
        savedSettings = JSON.parse(
          localStorage.getItem("androshell.settings") || "{}"
        );
      } catch {
        savedSettings = {};
      }
      var settings = {
        style: ["classic", "matrix", "custom"].includes(savedSettings.style) ? savedSettings.style : "classic",
        font: Object.prototype.hasOwnProperty.call(
          fontOptions,
          savedSettings.font
        ) ? savedSettings.font : "default",
        size: Number.isInteger(savedSettings.size) && savedSettings.size >= 50 && savedSettings.size <= 200 ? savedSettings.size : 100,
        customBackground: /^#[0-9a-fA-F]{6}$/.test(savedSettings.customBackground) ? savedSettings.customBackground : "#000000",
        customForeground: /^#[0-9a-fA-F]{6}$/.test(savedSettings.customForeground) ? savedSettings.customForeground : "#ffffff"
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
        return /* @__PURE__ */ new Date();
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
          Object.keys(fontOptions).forEach((font) => print("  " + font));
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
        if (argument.startsWith('"') && argument.endsWith('"') || argument.startsWith("'") && argument.endsWith("'")) {
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
              print("[FILE] " + entry.name + "  (" + formatSize(entry.size) + ")");
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
        const app = apps.find(
          (item) => item.name.toLowerCase() === query || item.packageName.toLowerCase() === query
        );
        if (!app) print("App not found: " + target);
        return app || null;
      }
      async function handleApp(value) {
        if (!requireAndroid()) return;
        if (!value) {
          const apps = await getInstalledApps();
          if (!apps) return;
          const uniqueApps = /* @__PURE__ */ new Map();
          for (const app2 of apps) {
            uniqueApps.set(app2.packageName, app2);
          }
          print("Installed launchable apps:");
          print("");
          for (const app2 of uniqueApps.values()) {
            print(app2.name + " [" + app2.packageName + "]");
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
          const app2 = await findApp(target);
          if (!app2) return;
          try {
            if (infoMatch) {
              await Androshell.openAppInfo({
                packageName: app2.packageName
              });
            } else {
              await Androshell.uninstallApp({
                packageName: app2.packageName
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
        const name = (separator === -1 ? trimmed : trimmed.slice(0, separator)).toLowerCase();
        const rawValue = separator === -1 ? "" : trimmed.slice(separator).trim();
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
                Object.keys(fontOptions).forEach((font) => print("  " + font));
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
      form.addEventListener("submit", async (event) => {
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
      input.addEventListener("keydown", (event) => {
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
    }
  });
  require_app();
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
