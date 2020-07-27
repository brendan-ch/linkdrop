const { app, BrowserWindow, shell, Tray, Menu } = require('electron');
const express = require('express');
const server = express();
const port = process.env.PORT || "19001";
server.set("port", port);

let tray = null;  // make sure var is not garbage collected
let isRunning = false;

const toggleRunning = () => {
  isRunning = !isRunning;
  console.log(isRunning);
  global.sharedObject.isRunning = isRunning;
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 350,
    height: 500,
    frame: false,
    // resizable: false,
    webPreferences: {
      nodeIntegration: true,
    }
  });

  win.loadFile('src/index.html');

  win.webContents.openDevTools();

  return win;
};

const setTray = () => {
  tray = new Tray("icons/favicon.ico");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Send URL", type: "normal", click: () => {
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
    }
  })
}

const runServer = () => {
  server.post('/receiveurl', (req, res) => {
    console.log(`URL received: ${req.headers.url}`);

    shell.openExternal(req.headers.url);

    res.sendStatus(200);
  });

  server.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
};

module.exports.runServer = runServer;
module.exports.port = port;
module.exports.setTray = setTray;
module.exports.createWindow = createWindow;
module.exports.toggleRunning = toggleRunning;
module.exports.isRunning = isRunning;