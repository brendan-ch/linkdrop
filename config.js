const fs = require('fs');
const configFolderDir = require('os').homedir() + "\\Documents\\Linkdrop";
const configPath = configFolderDir + "\\config.json";
const configFolderExists = fs.existsSync(configFolderDir);

// this function will check if saved config is up-to-date and return an updated config if needed
const checkConfig = () => {
  const defaultConfig = {
    "port": 19002,
    "allowReceiveInBackground": false,
    "openWithNotification": true,
    "openWindowOnStartup": true,
    "quitOnClose": true,
    "copyLinkToClipboard": false,
  }

  let config = getConfig() ? getConfig() : defaultConfig;

  const keys = Object.keys(config);
  const defaultKeys = Object.keys(defaultConfig);
  // let keysNotFound = [];

  // find key not in keys
  // for every default key, check if in keys; if not in keys, set property in config to default
  defaultKeys.forEach((value) => {
    if (!keys.includes(value)) {
      config[value] = defaultConfig[value];  // update config value
    }
  });

  return config;
}

const setConfig = async (config = {}) => {
  if (!configFolderExists) {
    fs.mkdirSync(configFolderDir);
  }

  const data = JSON.stringify(config, null, 2);

  const promise = new Promise((resolve, reject) => {
    fs.writeFile(configPath, data, (error) => {
      if (error) {
        console.log(`Error saving config: ${error}`);
        reject();
      } else {
        console.log("Config saved successfully.");
        resolve();
      }
    });
  });

  return promise;
};

const getConfig = () => {
  let data = undefined;

  try {
    data = fs.readFileSync(configPath);
  } catch (e) {  // no config file found, or something else
    console.log(`Error reading config: ${e}`);
    return;
  }

  if (data) {
    try {
      const config = JSON.parse(data);
      return config;
    } catch (e) {
      console.log(`Error parsing config: ${e}`);
      return;
    }
  }
};

module.exports.getConfig = getConfig;
module.exports.setConfig = setConfig;
module.exports.checkConfig = checkConfig;
module.exports.configPath = configPath;