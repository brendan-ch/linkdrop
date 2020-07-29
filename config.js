const fs = require('fs');
const configFolderDir = require('os').homedir() + "\\Documents\\Linkdrop";
const configPath = configFolderDir + "\\config.json";
const configFolderExists = fs.existsSync(configFolderDir);

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
module.exports.configPath = configPath;