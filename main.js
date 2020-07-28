if(require('electron-squirrel-startup')) return;  // handle install operations

const { app, BrowserWindow, shell, Tray, Menu, ipcMain } = require('electron');
const { getConfig, setConfig } = require('./config');
const os = require('os');
const ip = require('ip');
const express = require('express');
const server = express();
let config = getConfig();

// port is only set once; also shows up in UI
let port = process.env.PORT || config ? config.port : null || "19002";
server.set("port", port);  // port is only set once

const iconPath = __dirname + (os.platform() === 'darwin' ? '/icons/favicon-16x16.png' : '/icons/favicon.ico');
let tray = null;  // make sure tray is not garbage collected
let win = null;  // assign win to var so we can refer to it later
let isRunning = true;
let sendURL = "";  // empty on initialization

ipcMain.on("getIP", (event, arg) => {
  event.returnValue = ip.address("public", "ipv4");
});

ipcMain.on("getPort", (event, arg) => {
  event.returnValue = port;
});

ipcMain.on("setPort", (event, arg) => {
  setConfig({...config, port: arg});
  port = arg;
  event.returnValue = port;
})

ipcMain.on("getIsRunning", (event, arg) => {
  event.returnValue = isRunning;
});

ipcMain.on("toggleIsRunning", (event, arg) => {
  isRunning = !isRunning;
  console.log(`isRunning set to ${isRunning}.`)
  event.returnValue = isRunning;
});

ipcMain.on("getURL", (event, arg) => {
  event.returnValue = sendURL;
});

ipcMain.on("setURL", (event, arg) => {
  sendURL = arg;
  console.log(`Set URL to ${sendURL}`);

  event.returnValue = sendURL;
});

const createWindow = () => {
  win = new BrowserWindow({
    icon: iconPath,
    width: 350,
    height: 500,
    frame: false,
    resizable: false,  // set to true if devtools
    webPreferences: {
      nodeIntegration: true,
    }
  });

  win.loadFile('src/index.html');

  // win.webContents.openDevTools();
};

const setTray = () => {
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Open", type: "normal", click: () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        win.show();
      }
    } },
    { label: "Quit", type: "normal", click: () => {
      app.quit();
    }}
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("Linkdrop");
  if (os.platform() === "win32") {
    tray.on("click", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        win.show();  // show existing window instead of opening new one
      }
    });
  }
}

const runServer = () => {
  server.post('/receiveurl', (req, res) => {
    if (isRunning) {
      console.log(`URL received: ${req.headers.url}`);

      shell.openExternal(req.headers.url);

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  server.get("/geturl", (req, res) => {
    if (isRunning && sendURL !== "") {
      res.send({
        "url": sendURL
      });
    } else {
      res.sendStatus(404);
    }
  })

  server.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
};

app.whenReady().then(() => {
  // if no config returned, create new config file
  if (!getConfig()) {
    console.log("No config detected, creating new config...");
    setConfig({
      port: port,
    });
  };

  try {
    runServer();

    setTray();
  } catch (e) {
    console.log(e);
  }
});

app.on("window-all-closed", (event) => {
  try {
    app.hide();  // app is still running in system tray (Windows)
  } catch (e) {
    // console.log(e);
    return;  // temporary "fix" for app not hiding correctly on Alt + F4
  }
});