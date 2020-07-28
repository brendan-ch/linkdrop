if(require('electron-squirrel-startup')) return;  // handle install operations because I'm a lazy piece of shit

const { app, BrowserWindow, shell, Tray, Menu, ipcMain, dialog } = require('electron');
const { getConfig, setConfig } = require('./config');
const os = require('os');
const ip = require('ip');
const portscanner = require('portscanner');
const express = require('express');
const server = express();
let config = getConfig();

// port is only set once; also shows up in UI
let port = process.env.PORT || config ? config.port : null || "19002";
server.set("port", port);  // port is only set once

// icon path is dependent on platform (macOS doesn't like .ico)
const iconPath = __dirname + (os.platform() === 'darwin' ? '/icons/favicon-16x16.png' : '/icons/favicon.ico');
let tray = null;  // make sure tray is not garbage collected
let win = null;  // assign win to var so we can refer to it later
let isRunning = true;  // determines whether requests open URLs or not
let sendURL = "";  // empty on initialization

const setIpc = () => {
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
}

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

const runServer = async () => {
  // receive URL from phone
  server.post('/receiveurl', (req, res) => {
    if (isRunning) {
      console.log(`URL received: ${req.headers.url}`);

      shell.openExternal(req.headers.url);  // open URL in default browser

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  // send URL to phone
  server.get("/geturl", (req, res) => {
    if (isRunning && sendURL !== "") {
      res.send({
        "url": sendURL
      });
    } else {
      res.sendStatus(404);  // URL not found
    }
  })

  const status = await checkPort(port);

  if (status === 'open') {
    dialog.showMessageBoxSync(null, {
      type: "info",
      message: `There is already something running on port ${port}. The app will now close.`
    })
    app.quit();  // something is already running on port; gracefully close application
  } else {
    server.listen(port, () => {  // this will cause error if port is unavailable
      console.log(`Listening on port ${port}`);
    });
  };
};

// gets the status of configured port
// returns promise because checkPortStatus is asynchronous (?)
const checkPort = async (port) => {
  const status = new Promise((resolve, reject) => {
    portscanner.checkPortStatus(port, '127.0.0.1', (error, status) => {
      if (error) {
        reject(error);
      } else {
        resolve(status);
      }
    })
  });

  return status;
}

app.whenReady().then(() => {
  // if config is undefined, create new config file
  if (!getConfig()) {
    console.log("No config detected, creating new config...");
    setConfig({
      port: port,
    });
  };

  setIpc();  // set interactions between main process and renderer
  
  runServer();  // run express server to get/send URLs

  setTray();  // set the tray icon
});

app.on("window-all-closed", (event) => {
  try {
    app.hide();  // app is still running in system tray (Windows)
  } catch (e) {
    // console.log(e);
    return;  // temporary "fix" for app not hiding correctly on Alt + F4
  }
});