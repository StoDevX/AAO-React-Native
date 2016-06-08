const qs = require('querystring')
const {status, text} = require('./fetch')
const uniqBy = require('lodash/uniqBy')
const xml2js = require('xml2js')
const toPairs = require('lodash/toPairs')
const fromPairs = require('lodash/fromPairs')
const camelCase = require('lodash/camelCase')
const toUpper = require('lodash/toUpper')
const flatten = require('lodash/flatten')

xml2js.parseStringAsync = function(...args) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(...args, (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

const STALKERNET_URL = 'https://www.stolaf.edu/personal/directory/index.cfm'

module.exports.cache = cacheStalkernet
function cacheStalkernet() {
  let {AsyncStorage} = require('react-native')
  let promises = ['a', 'e', 'i', 'o', 'u'].map(l => queryStalkernet({lastName: l}))
  return Promise.all(promises).then(data => {
    data = flatten(data)
    data = uniqBy(data, item => `${item.lastName}-${item.firstName}-${item.email}`)
    return AsyncStorage.setItem('@AllAboutOlaf:Stalkernet', data)
  })
}

// cacheStalkernet().then(console.log)

function buildStalkernetQueryString(query) {
  let q = {
    fuseaction: 'SearchResults',
    format: 'xml',
  }

  if (query['lastName']) {
    q['lastname'] = query.lastName
  }
  if (query['firstName']) {
    q['firstname'] = query.firstName
  }
  if (query['email']) {
    q['email'] = query.email
  }

  return qs.stringify(q)
}

function simplifySingleStalkernetResult(person) {
  let pairs = toPairs(person)
    // camel-case the keys (the come in uppercased)
    // and return the first element of the arrays
    // (xml2js returns tag contents as arrays)
    .map(([key, val]) => [camelCase(key), val[0]])
    // and remove the keys with no value
    .filter(pair => pair[1].trim())
  return fromPairs(pairs)
}

function removeSillyStalkernetResults(person) {
  return toUpper(person.lastName) !== person.lastName
}

function parseStalkernetResults(data) {
  return xml2js.parseStringAsync(data)
    .then(results => results['Results']['Person'])
    .then(people => people.map(simplifySingleStalkernetResult))
    .then(people => people.filter(removeSillyStalkernetResults))
}

module.exports.query = queryStalkernet
function queryStalkernet(query) {
  let queryString = buildStalkernetQueryString(query)
  return fetch(`${STALKERNET_URL}?${queryString}`)
    .then(status)
    .then(text)
    .then(parseStalkernetResults)
    .catch(err => {
      console.error(err)
    })
}
