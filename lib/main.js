const WBK = require('wikibase-sdk');
const utils = require("../bin/utils.js");
const fs = require('fs');
const pino = require('pino');
const pretty = require('pino-pretty');
const logger = pino(pretty());

const wdk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql'
});

async function makeData() {
  let citiesInfo = []
  let queries = []

  const sparqlQuery = await utils.getDataFromWikidata()

  wdk.simplify.sparqlResults(sparqlQuery).forEach(element => queries.push(element.item.value))

  let entities = await utils.getEntities(queries)
  try {
    for (let query of queries) {
      let claims = entities[query].claims
      let labels = entities[query].labels
  
      let lat = utils.getWikidataLatitude(claims)
      let lon = utils.getWikidataLongitude(claims)
  
      lat = lat === "Not Found" ? lat : lat.toFixed(3)
      lon = lon === "Not Found" ? lon : lon.toFixed(3)
  
      let worldCity = await utils.getWorldCity(lat, lon)

      let mainName = utils.getMainName(labels)
      let otherNames = utils.getAnotherNames(labels)
  
      let timezone = utils.getTimezone(worldCity)
      let shortCountryName = utils.getShortCountryName(worldCity)
      let population = utils.getPopulation(worldCity)
      let isCapital = utils.isCapital(worldCity)
      let continent = utils.getContinent(worldCity)
  
      citiesInfo.push(
          {
              "mainName": mainName,
              "otherNames": otherNames,
              "lat": lat,
              "lon": lon,
              "population": population,
              "timezone": timezone,
              "country": shortCountryName,
              "capital": isCapital,
              "continent": continent,
          }
      )
    }
    logger.info("Cities Info created successfully")
    return citiesInfo
  } catch(e) {
    logger.warn("Failed to create Cities Info")
    logger.error(e.stack)
    process.exit()
  }
}

const makeCsv = async () => {
  try {
    let data = await makeData()
    let csv = "";
    data.forEach((item, index) => {
      csv += `${index + 1};${utils.joinNames(item.mainName, item.otherNames)};{"name":"${item.mainName}","lat":${item.lat},"lon":${item.lon},"country":"${item.country}","timezone":"${item.timezone}","population":${item.population},"capital":"${item.capital}","continent":"${item.continent}"}\n`
    })
    fs.writeFile('output.csv', csv, (e) => {
      if (e) logger.error(e)
    });
    logger.info("CSV file created successfully")
  } catch(e) {
    logger.warn("Failed to create csv file")
    logger.error(e.stack)
  }
}

makeCsv()