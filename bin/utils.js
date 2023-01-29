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

module.exports = {
  getDataFromWikidata: async function getDataFromWikidata() {
    try {
      const query =  await wdk.sparqlQuery(yaml.SETTINGS.sparql)
      const res = await fetch(query)
      const js = await res.json()
      logger.info("Data from Wikidata received successfully")
      return js
    } catch(e) {
      logger.warn("Failed to get data from Wikidata")
      logger.error(e.stack)
      procces.exit()
    }
  },
  getEntities: async function getEntities(query) {
    try {
      var obj;
      let urls = await wdk.getManyEntities(query)
      for (url of urls) {
        let res = await fetch(url)
        let js = await res.json()
        obj = obj ? Object.assign(obj, js.entities) : js.entities
      }
      logger.info("Object with Entities received successfully")
      return obj
    } catch(e) {
      logger.warn("Get Many Entities Failed")
      logger.error(e.stack)
      process.exit()
    }
  },
  getMainName: function getMainName(labels) {
    return labels[yaml.SETTINGS.mainLanguage] ? labels[yaml.SETTINGS.mainLanguage].value : 
      labels[yaml.SETTINGS.secondLanguage] ? labels[yaml.SETTINGS.secondLanguage].value :
      labels[yaml.SETTINGS.thirdLanguage] ? labels[yaml.SETTINGS.thirdLanguage].value : "Not Found"
  },
  getAnotherNames: function getAnotherNames(labels) {
    let names = [];
    if (yaml.SETTINGS.otherLanguages)
      yaml.SETTINGS.otherLanguages.forEach(lang => labels[lang] ? names.push(labels[lang].value) : "")
    return names
  },
  getTimezone: function getTimezone(worldCity) {
    return worldCity.timezone ? worldCity.timezone : "Not Found"
  },
  getWorldCity: async function getWorldCity(latitude, longitude) {
    const city = await WorldCities.getNearestCity(latitude, longitude)
    return city ? city : "Not Found"
  },
  getWikidataLatitude: function getWikidataLatitude(claims) {
    return claims[yaml.SETTINGS.coordinateLocationProperty] ? wdk.simplify.propertyClaims(claims[yaml.SETTINGS.coordinateLocationProperty])[0][0] : "Not Found"
  },
  getWikidataLongitude: function getWikidataLongitude(claims) {
    return claims.P625 ? wdk.simplify.propertyClaims(claims.P625)[0][1] : "Not Found"
  },
  getPopulation: function getPopulation(worldCity) {
    return worldCity.population ? worldCity.population.toString() : "Not Found"
  },
  getShortCountryName: function getShortCountryName(worldCity) {
    return worldCity.country ? worldCity.country.countryCode : "Not Found"
  },
  getContinent: function getContinent(worldCity) {
    if (worldCity.country) {
      if (worldCity.country.continent === "AS")
        return "Asia"
      if (worldCity.country.continent === "EU")
        return "Europe"
      if (worldCity.country.continent === "AF")
        return "Africa"
      if (worldCity.country.continent === "AN")
        return "Antarctica"
      if (worldCity.country.continent === "NA")
        return "North America"
      if (worldCity.country.continent === "SA")
        return "South America"
      if (worldCity.country.continent === "OC")
        return "Oceania"
    }    
  },
  isCapital: function isCapital(worldCity) {
    if (worldCity.name && worldCity.country) {
      return worldCity.name === worldCity.country.capital
    } else {
      return "Not Found"
    }
  },
  joinNames: function joinNames(mainName, otherNames) {
    let names;
    if (otherNames.length > 0) {
      names = mainName + "," + otherNames.toString()
    } else {
      names = mainName
    }
    return names
  }
}