const WBK = require('wikibase-sdk');
const functions = require("../bin/utils.js");
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

  const sparqlQuery = await functions.getDataFromWikidata()

  wdk.simplify.sparqlResults(sparqlQuery).forEach(element => queries.push(element.item.value))

  let entities = await functions.getEntities(queries)
  try {
    for (let query of queries) {
      let claims = entities[query].claims
      let labels = entities[query].labels
  
      let lat = functions.getWikidataLatitude(claims)
      let lon = functions.getWikidataLongitude(claims)
  
      lat = lat === "Not Found" ? lat : lat.toFixed(3)
      lon = lon === "Not Found" ? lon : lon.toFixed(3)
  
      let worldCity = await functions.getWorldCity(lat, lon)

      let mainName = functions.getMainName(labels)
      let otherNames = functions.getAnotherNames(labels)
  
      let timezone = functions.getTimezone(worldCity)
      let shortCountryName = functions.getShortCountryName(worldCity)
      let population = functions.getPopulation(worldCity)
      let isCapital = functions.isCapital(worldCity)
      let continent = functions.getContinent(worldCity)
  
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

async function makeCsv() {
  try {
    let data = await makeData()
    let csv = "";
    data.forEach((item, index) => {
      csv += `${index + 1};${functions.joinNames(item.mainName, item.otherNames)};{"name":"${item.mainName}","lat":${item.lat},"lon":${item.lon},"country":"${item.country}","timezone":"${item.timezone}","population":${item.population},"capital":"${item.capital}","continent":"${item.continent}"}\n`
    })
    fs.writeFile('output.csv', csv, function(err) {
      if(err) console.log("error", err)
    });
    logger.info("CSV file created successfully")
  } catch(e) {
    logger.warn("Failed to create csv file")
    logger.error(e.stack)
  }
}

makeCsv()



