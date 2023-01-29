const WBK = require('wikibase-sdk')
const fetch = require('node-fetch')
const yaml = require('./yaml-reader.js')
const pino = require('pino')
const pretty = require('pino-pretty')
const logger = pino(pretty())


const wdk = WBK({
    instance: 'https://www.wikidata.org',
    sparqlEndpoint: 'https://query.wikidata.org/sparql'
  })

const WorldCities = require('worldcities');

const getDataFromWikidata = async () => {
  try {
    const query =  await wdk.sparqlQuery(yaml.SETTINGS.sparql)
    const res = await fetch(query)
    const js = await res.json()
    logger.info("Data from Wikidata received successfully")
    return js
  } catch(e) {
    logger.warn("Failed to get data from Wikidata")
    logger.error(e.stack)
    process.exit()
  }
}

const getEntities = async(query) => {
  try {
    let obj = {}
    const urls = await wdk.getManyEntities(query)
    for (const url of urls) {
      const res = await fetch(url)
      const js = await res.json()
      obj = {...obj, ...js.entities}
    }
    logger.info("Object with Entities received successfully")
    return obj
  } catch(e) {
    logger.warn("Get Many Entities Failed")
    logger.error(e.stack)
    process.exit()
  }
}

const getMainName = (labels) => {
  if (labels[yaml.SETTINGS.mainLanguage]) return labels[yaml.SETTINGS.mainLanguage].value
  if (labels[yaml.SETTINGS.secondLanguage]) return labels[yaml.SETTINGS.secondLanguage].value
  if (labels[yaml.SETTINGS.thirdLanguage]) return labels[yaml.SETTINGS.thirdLanguage].value
  return ""
}

const getAnotherNames = (labels) => {
  if (!yaml.SETTINGS.otherLanguages) return []
  return yaml.SETTINGS.otherLanguages.map(lang => labels[lang] ? labels[lang].value : "").filter(name => name)
}

const getTimezone = (worldCity) => worldCity.timezone || "Not Found"

const getWorldCity = async (latitude, longitude) => {
  const city = await WorldCities.getNearestCity(latitude, longitude)
  return city || "NotFound"
}

const getWikidataLatitude = claims => claims.P625 ? wdk.simplify.propertyClaims(claims.P625)[0][0] : "Not Found"

const getWikidataLongitude = claims => claims.P625 ? wdk.simplify.propertyClaims(claims.P625)[0][1] : "Not Found"

const getPopulation = worldCity => worldCity.population ? worldCity.population.toString() : "Not Found"

const getShortCountryName = worldCity => worldCity.country ? worldCity.country.countryCode : "Not Found"

const getContinent = worldCity => {
  if (!worldCity.country) return;

  switch (worldCity.country.continent) {
    case 'AS': return 'Asia';
    case 'EU': return 'Europe';
    case 'AF': return 'Africa';
    case 'AN': return 'Antarctica';
    case 'NA': return 'North America';
    case 'SA': return 'South America';
    case 'OC': return 'Oceania';
    default: return;
  }
}

const isCapital = worldCity => worldCity.name && worldCity.country ? 
  worldCity.name === worldCity.country.capital : "Not Found";

const joinNames = (mainName, otherNames) => otherNames.length > 0 ? `${mainName}${mainName ? "," : ""}${otherNames.toString()}` : mainName;

module.exports = {
  joinNames,
  isCapital,
  getContinent,
  getShortCountryName,
  getPopulation,
  getWikidataLongitude,
  getWikidataLatitude,
  getWorldCity,
  getTimezone,
  getAnotherNames,
  getMainName,
  getEntities,
  getDataFromWikidata
}