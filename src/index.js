// This file handles events in the application window.

const { ipcRenderer } = require('electron');

window.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === ",") {
    openConfig();
  }

  return;
});

const closeButton = document.getElementById("close-button")
closeButton.addEventListener("click", (event) => {
  closeWindow();
});

const serverIP = document.getElementById("server-ip");
serverIP.innerHTML = ipcRenderer.sendSync("getIP");

const toggleButtonStatus = document.getElementById('toggle-button-status');
toggleButtonStatus.addEventListener("click", (event) => {
  toggleServer();
});

const serverStatus = document.getElementById("server-status");

const inputStatus = document.getElementById("input-status");
const urlInput = document.getElementById("url-input");
urlInput.value = ipcRenderer.sendSync("getURL");
urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendURL();
  }
})

const sendButton = document.getElementById("send-button");
sendButton.addEventListener("click", (event) => {
  sendURL();
})

const portInputStatus = document.getElementById("port-input-status");
const portInput = document.getElementById("port-input");
portInput.value = ipcRenderer.sendSync("getPort");
portInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendPort();
  }
})

const sendPortButton = document.getElementById("send-port-button");
sendPortButton.addEventListener("click", (event) => {
  sendPort();
})

const openConfig = () => {
  ipcRenderer.sendSync("openConfig");
  return;
}

const updateStatus = () => {
  toggleButtonStatus.innerHTML = ipcRenderer.sendSync("getIsRunning") ? 
    "Cancel" 
  : 
    "Get URL";
  
  serverStatus.innerHTML = ipcRenderer.sendSync("getIsRunning") ? 
    "Waiting for URLs... "
  :
    ""
}

const sendURL = () => {
  if (urlInput.value !== "") {
    // set URL to be requested AND set URL in index.html
    ipcRenderer.sendSync("setURL", urlInput.value);
    inputStatus.innerHTML = "URL set! Run the shortcut on your device to open the URL."
    updateStatus();
  } else {
    inputStatus.innerHTML = "Please enter a URL.";
  };
};

const sendPort = () => {
  if (portInput.value !== "") {
    ipcRenderer.sendSync("setPort", portInput.value);
    portInputStatus.innerHTML = "Port set! Restart the app to see changes."
    // console.log(`Port set to ${portInput.value}. Will apply on next restart.`)
  } else {
    portInputStatus.innerHTML = "Please enter a port.";
  }
}

const closeWindow = () => {
  window.close();  // closes the window
};

const toggleServer = (arg = undefined) => {
  ipcRenderer.sendSync("toggleIsRunning", arg);
  updateStatus();
};

updateStatus();