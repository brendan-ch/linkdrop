const { app, BrowserWindow, shell, Tray, Menu, ipcMain } = require('electron');
// const { runServer, setTray, createWindow } = require('./server.js');
const express = require('express');
const server = express();
const port = process.env.PORT || "19001";
server.set("port", port);

let tray = null;  // make sure tray is not garbage collected
let win = null;  // assign win to var so we can refer to it later
let isRunning = true;
let sendURL = "";  // empty on initialization

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
})

ipcMain.on("setURL", (event, arg) => {
  sendURL = arg;
  console.log(`Set URL to ${sendURL}`);

  event.returnValue = sendURL;
})

const createWindow = () => {
  win = new BrowserWindow({
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
  tray = new Tray("icons/favicon.ico");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Open", type: "normal", click: () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    } },
    { label: "Quit", type: "normal", click: () => {
      app.quit();
    }}
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      win.show();  // show existing window instead of opening new one
    }
  })
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
  runServer();

  createWindow();

  setTray();
});

app.on("window-all-closed", (event) => {
  app.hide();  // app is still running in system tray (Windows)
})