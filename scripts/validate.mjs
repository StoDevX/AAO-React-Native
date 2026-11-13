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

/**
 * A validator over the schemas in `schemaDir`: its shared definitions, and the
 * `editor` keyword, which tells the data editor which control draws a field
 * and changes nothing about what is valid.
 */
export function createValidator(schemaDir) {
	let validator = new AJV()
	addFormats(validator)
	addKeywords(validator)
	validator.addKeyword({keyword: 'editor', schemaType: 'string'})
	validator.addSchema(load(fs.readFileSync(path.join(schemaDir, '_defs.yaml'), 'utf8')))
	validator.addSchema(load(fs.readFileSync(path.join(schemaDir, '_schedules.yaml'), 'utf8')))
	return validator
}

let validator = null

function init() {
	validator ??= createValidator(SCHEMA_BASE)
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
