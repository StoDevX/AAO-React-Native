import qs from 'querystring'
import uniqBy from 'lodash/uniqBy'
import xml2js from 'xml2js'
import toPairs from 'lodash/toPairs'
import fromPairs from 'lodash/fromPairs'
import camelCase from 'lodash/camelCase'
import toUpper from 'lodash/toUpper'
import flatten from 'lodash/flatten'

xml2js.parseStringAsync = function(...args) {
	return new Promise((resolve, reject) => {
		xml2js.parseString(...args, (err, data) => {
			if (err) reject(err)
			resolve(data)
		})
	})
}

const STALKERNET_URL = 'https://www.stolaf.edu/personal/directory/index.cfm'

export function cache() {
	let {AsyncStorage} = require('react-native')
	let promises = ['a', 'e', 'i', 'o', 'u'].map(l => query({lastName: l}))
	return Promise.all(promises).then(data => {
		data = flatten(data)
		data = uniqBy(
			data,
			item => `${item.lastName}-${item.firstName}-${item.email}`,
		)
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
	return xml2js
		.parseStringAsync(data)
		.then(results => results['Results']['Person'])
		.then(people => people.map(simplifySingleStalkernetResult))
		.then(people => people.filter(removeSillyStalkernetResults))
}

export function query(query) {
	let queryString = buildStalkernetQueryString(query)
	return fetch(`${STALKERNET_URL}?${queryString}`)
		.then(r => r.text())
		.then(parseStalkernetResults)
		.catch(err => {
			console.error(err)
		})
}
