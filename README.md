
# Androshell

A lightweight **Android launcher** with a terminal-inspired interface.

Androshell brings a command-line experience to Android, combining a minimal terminal UI with native Android functionality.

## Features

- Minimal terminal interface
- Monospace font support
- Customizable terminal styles
- Custom foreground and background colors
- Adjustable UI size
- Built-in date, time, and calendar commands
- Browse Androshell's private storage
- Create directories
- List installed applications
- Launch applications
- Open application information
- Uninstall applications through Android's system interface
- Open Android system settings
- Native Android integration through Capacitor

## Commands

| Command | Description |
|---|---|
| `help` | Show available commands |
| `clear` | Clear terminal output |
| `clock` | Display the current time |
| `date` | Display the current date |
| `calendar` | Display a calendar |
| `echo` | Print text |
| `info` | Display device information |
| `settings` | Open terminal settings |
| `pwd` | Show current directory |
| `cd` | Change directory |
| `ls` | List directory contents |
| `dir` | List directory contents |
| `mkdir` | Create a directory |
| `app` | Manage installed applications |

### Examples

```text
help
echo Hello, Android!
clock
date
pwd
ls
mkdir projects
cd projects
```

### Application commands

```text
app
app Chrome
app -i Chrome
app -u Chrome
app settings
```

## Customization

Androshell currently supports:

- Classic, Matrix, and Custom styles
- Multiple monospace fonts
- Custom foreground and background colors
- UI scaling from 50% to 200%

Use `settings` to see the available options.

## Technology

- HTML
- CSS
- JavaScript
- Java
- Capacitor 8
- Gradle

## Requirements

- Android 7.0 or newer (API 24+)
- Node.js and npm
- Java Development Kit
- Android SDK
- Gradle wrapper included in the project

## Building

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/Androshell.git
cd Androshell
```

Install dependencies:

```bash
npm install
```

Generate the JavaScript bundle:

```bash
npm run build
```

Build the Android debug APK:

```bash
cd android
bash gradlew assembleDebug
```

The APK will be generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Storage

Androshell uses its own private application storage directory.

Its filesystem commands operate within this directory and do not provide general access to the device's shared storage.

## Project Status

**Current version:** 1.0.0

Androshell is an early release. Features and commands may change in future versions.

## License

See [LICENSE](LICENSE) for license information.

