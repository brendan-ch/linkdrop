// This file handles events in the application window.

const { ipcRenderer } = require('electron');

const toggleButtonStatus = document.getElementById('toggle-button-status');
toggleButtonStatus.innerHTML = ipcRenderer.sendSync("getIsRunning") ? "off" : "on"

const inputStatus = document.getElementById("input-status");

const urlInput = document.getElementById("url-input");
urlInput.value = ipcRenderer.sendSync("getURL");

const sendButton = document.getElementById("send-button");
sendButton.addEventListener("click", (event) => {
  if (urlInput.value !== "") {
    // set URL to be requested AND set URL in index.html
    ipcRenderer.sendSync("setURL", urlInput.value);
    inputStatus.innerHTML = "URL set! Run the shortcut on your device to open the URL."
  } else {
    inputStatus.innerHTML = "Please enter a URL."
  }
})

const closeWindow = () => {
  window.close();  // closes the window
};

const toggleServer = () => {
  toggleButtonStatus.innerHTML = ipcRenderer.sendSync("toggleIsRunning") ? "off" : "on"
};