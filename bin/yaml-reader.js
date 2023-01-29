const fs = require('fs');
const yaml = require('js-yaml');
const pino = require('pino');
const pretty = require('pino-pretty');
const logger = pino(pretty());

const getSettings = () => {
  let settings;
  try {
    settings = yaml.load(fs.readFileSync('config/settings.yaml', 'utf8'));
  } catch(e) {
    settings = {};
    logger.warn("Failed to load yaml file")
    logger.error(e.stack)
    process.exit(1)
  }
  return Object.freeze(settings)
}

module.exports = Object.freeze({
    SETTINGS: getSettings()
})