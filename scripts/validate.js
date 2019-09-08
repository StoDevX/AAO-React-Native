#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const AJV = require('ajv')
const yaml = require('js-yaml')
const get = require('lodash/get')
const memoize = require('lodash/memoize')
const {SCHEMA_BASE} = require('./paths')

function formatError(err, data) {
	// format some of the errors from ajv
	let contents = ''
	let dataPath = err.dataPath.replace(/^\./u, '')
	switch (err.keyword) {
		case 'enum': {
			let value = get(data, dataPath)
			let allowed = err.params.allowedValues
				.map(v => JSON.stringify(v))
				.join(', ')
			contents = `Given value "${JSON.stringify(value)}" ${
				err.message
			} [${allowed}]`
			break
		}
		case 'type': {
			contents = `${get(data, dataPath)} ${err.message}`
			break
		}
		default: {
			return JSON.stringify(err, null, 2)
		}
	}
	return `Error at ${err.dataPath}:\n${contents}`
}

const init = memoize(() => {
	// load the common definitions
	let defsPath = path.join(SCHEMA_BASE, '_defs.yaml')
	let defs = yaml.safeLoad(fs.readFileSync(defsPath, 'utf-8'))

	// set up the validator
	let validator = new AJV()
	validator.addSchema(defs)

	return validator
})

module.exports = function validate(schema, data) {
	let validator = init()

	let validate = validator.compile(schema)
	let isValid = validate(data)

	if (!isValid) {
		return [false, validate.errors.map(e => formatError(e, data))]
	}

	return [true, []]
}
