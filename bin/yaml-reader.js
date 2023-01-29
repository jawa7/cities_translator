const fs = require('fs');
const yaml = require('js-yaml');

let settings;
try {
    settings = yaml.load(fs.readFileSync('config/settings.yaml', 'utf8'));
  } catch(e) {
    settings = {};
    console.log(e);
  }

module.exports = Object.freeze({
    SETTINGS: settings
})