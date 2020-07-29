# Linkdrop

Easily send and receive URLs between your PC and iPhone.

## Download

**Download the shortcuts:**

[Open URL on PC](https://www.icloud.com/shortcuts/9c3b247ccdbe480dbbde718ff96f89b0)

[Open URL from PC](https://www.icloud.com/shortcuts/ffe6dbf7830b4524b9b8283a8928ff0c)

**Download on PC (required for shortcuts to work):**

[Download here](https://github.com/unnameduser95/linkdrop/releases)

Run Setup.exe to install Linkdrop.

## Usage

**Important: network requests sent between your iPhone and PC are currently unsecured. Only use Linkdrop if you are on a trusted network (like a home network).**

Linkdrop works by creating a local server on your PC which your iPhone can send requests to. 
1. Make sure your iPhone and PC are connected to the same network.
2. On your PC, allow incoming URLs by clicking "Get URL", or paste a URL to send to your iPhone.
3. Run either shortcut from your iPhone. You may be asked to fill out the IP address or port of your PC; if so, refer to the Server IP shown in the app.

## Config

Linkdrop generates a `config.json` file on first start, which can be opened by pressing `Ctrl + ,` in the app window. Restart Linkdrop to apply changes made to the file.

- `port` (string): The port the server runs on. Defaults to `19002`. Can also be changed in the app window.
- `allowReceiveInBackground` (boolean): If set to `true`, allows the receiving of URLs when the app window is closed. Defaults to `false`.
- `openWithNotification` (boolean): If set to `true`, displays a system notification when a URL is received, instead of opening the URL automatically. Defaults to `true`.
- `openWindowOnStartup` (boolean): If set to `true`, opens the app window when Linkdrop is launched. Defaults to `true`.
- `quitOnClose` (boolean): If set to `true`, quits Linkdrop and shuts down the server on window close, instead of hiding the app to the tray. Defaults to `true`.

Icon is [Link icon by Icons8](https://icons8.com/icons/set/link).
