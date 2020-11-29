if(require('electron-squirrel-startup')) return;  // handle install operations because I'm a lazy piece of shit

const { app, BrowserWindow, shell, Tray, Menu, ipcMain, dialog, Notification, clipboard } = require('electron');
const { setConfig, checkConfig, configPath } = require('./config');
const os = require('os');
const ip = require('ip');
const portscanner = require('portscanner');
const express = require('express');
const server = express();
server.use(express.json());

const config = checkConfig();
setConfig(config);

// port is only set once; also shows up in UI
let port = process.env.PORT || config ? config.port : null || "19002";
server.set("port", port);  // port is only set once

// icon path is dependent on platform (macOS doesn't like .ico)
const iconPath = __dirname + (os.platform() === 'darwin' ? '/icons/favicon-16x16.png' : '/icons/favicon.ico');
let tray = null;  // make sure tray is not garbage collected
let win = null;  // assign win to var so we can refer to it later

// determines what url is sent to phone/whether url is sent to phone
let sendURL = "";

// determines whether requests open URLs or not
// user must manually turn on
let isRunning = config.allowReceiveInBackground;

const openURL = (link) => {
  if (config.copyLinkToClipboard) {
    // show a notification when link gets copied to clipboard
    const clipboardNotification = new Notification({
      "title": "Link copied to clipboard",
      "body": link,
      "silent": true,
    });

    clipboardNotification.show();

    clipboard.writeText(link);
  } else {
    shell.openExternal(link);  // open URL in default browser
  };
}

// this sets the IPC listeners, which handles interactions between main process and renderer
// run on startup
const setIpc = () => {
  // opens config.json in the user's default text editor
  // triggered by pressing Ctrl + , in the app window
  ipcMain.on("openConfig", (event, arg) => {
    shell.openPath(configPath);
    event.returnValue = undefined;
  });
  
  // returns the local IP address of the PC
  ipcMain.on("getIP", (event, arg) => {
    event.returnValue = ip.address("public", "ipv4");
  });
  
  // returns the port that the server is running on
  ipcMain.on("getPort", (event, arg) => {
    event.returnValue = port;
  });
  
  // sets the port of the server; changes apply on restart
  // port variable is changed so that it is returned and shows up in the UI
  ipcMain.on("setPort", (event, arg) => {
    setConfig({...config, port: arg});
    port = arg;
    event.returnValue = port;
  });

  // return whether server is allowed to receive URLs
  ipcMain.on("getIsRunning", (event, arg) => {
    event.returnValue = isRunning;
  });
  
  // toggle/set (if arg provided) whether server is allowed to receive URLs
  ipcMain.on("toggleIsRunning", (event, arg) => {
    isRunning = arg !== undefined ? arg : !isRunning;
    console.log(`isRunning set to ${isRunning}.`)
    event.returnValue = isRunning;
  });
  
  // return the current sendURL
  ipcMain.on("getURL", (event, arg) => {
    event.returnValue = sendURL;
  });
  
  // set the sendURL
  ipcMain.on("setURL", (event, arg) => {
    sendURL = arg;
    console.log(`Set URL to ${sendURL}`);
  
    event.returnValue = sendURL;
  });
}

// opens and loads the app window
// run on startup
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

// create the tray icon; run once on startup
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
  
  // set what comes up on mouse hover
  tray.setToolTip("Linkdrop");

  // click will only work consistently on windows
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
    if (isRunning && req.body.deviceName !== undefined) {
      console.log(`URL received from ${req.body.deviceName}: ${req.body.url}`);

      if (config.openWithNotification) {
        const notification = new Notification({
          title: `New URL from ${req.body.deviceName}`,
          body: req.body.url,
          // icon: iconPath,
        });

        notification.addListener("click", () => {
          openURL(req.body.url);
        });

        notification.show();
      } else {
        openURL(req.body.url);
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  // send URL to phone
  server.get("/geturl", (req, res) => {
    if (sendURL !== "") {
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
  setIpc();  // set interactions between main process and renderer
  
  runServer();  // run express server to get/send URLs

  setTray();  // set the tray icon

  if (config.openWindowOnStartup) {
    createWindow();
  }
});

app.on("window-all-closed", (event) => {
  try {
    if (config.quitOnClose) {
      app.quit();
    } else {
      isRunning = !isRunning ? isRunning : config.allowReceiveInBackground;
      sendURL = "";
      app.hide();  // app is still running in system tray (Windows)
    }
  } catch (e) {
    // console.log(e);
    return;  // temporary "fix" for app not hiding correctly on Alt + F4
  }
});