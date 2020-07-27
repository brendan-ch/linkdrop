// run this as a standalone file to create the installer
// node createInstaller.js

const electronInstaller = require('electron-winstaller');

const createInstaller = async () => {
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: __dirname + '/linkdrop-win32-x64',
      outputDirectory: __dirname + '/installer',
      authors: 'Linkdrop',
      exe: 'linkdrop.exe'
    });
    console.log("It worked!");
  } catch(e) {
    console.log(`shit... (${e.message})`);
  }
}

createInstaller();