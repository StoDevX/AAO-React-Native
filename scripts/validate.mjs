#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import AJV from 'ajv'
import addFormats from 'ajv-formats'
import addKeywords from 'ajv-keywords'
import {load} from 'js-yaml'
import {SCHEMA_BASE} from './paths.mjs'

/** The value at an Ajv error's JSON pointer, such as `/hours/0/days`. */
function valueAt(data, pointer) {
	return pointer
		.split('/')
		.filter(Boolean)
		.reduce((value, key) => value?.[key.replaceAll('~1', '/').replaceAll('~0', '~')], data)
}

function formatError(err, data) {
	// format some of the errors from ajv
	let contents = ''
	let dataPath = err.instancePath || ''
	switch (err.keyword) {
		case 'enum': {
			let value = valueAt(data, dataPath)
			let params = err.params
			let allowed = (params.allowedValues || []).map((v) => JSON.stringify(v)).join(', ')
			contents = `Given value "${JSON.stringify(value)}" ${
				err.message || 'is not valid'
			} [${allowed}]`
			break
		}
		case 'type': {
			contents = `${valueAt(data, dataPath)} ${err.message || 'has incorrect type'}`
			break
		}
		default: {
			return JSON.stringify(err, null, 2)
		}
	}
	return `Error at ${err.dataPath || err.instancePath || '(unknown)'}:\n${contents}`
}

let validator = null

function init() {
	if (validator) return validator

	// load the common definitions
	let defsPath = path.join(SCHEMA_BASE, '_defs.yaml')
	let defs = load(fs.readFileSync(defsPath, 'utf-8'))

	// set up the validator
	validator = new AJV()
	addFormats(validator)
	addKeywords(validator)
	validator.addSchema(defs)
	validator.addSchema(load(fs.readFileSync(path.join(SCHEMA_BASE, '_schedules.yaml'), 'utf8')))

	return validator
}

export function validate(schema, data) {
	let validate = init().compile(schema)
	let isValid = validate(data)

	if (!isValid) {
		return [false, validate.errors.map((e) => formatError(e, data))]
	}

	return [true, []]
}
