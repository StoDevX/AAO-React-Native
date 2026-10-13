// Wiki Monkeys' YAML fixtures, turned into the JSON they describe when a module
// imports one. Shared by the Jest transform and the Metro transformer, so both
// read a file the same way.

import {CORE_SCHEMA, dump, load} from 'js-yaml'

/**
 * The JSON value `source` describes; a parse error names `filename`. Read with
 * YAML's core schema, so an unquoted date stays the string a JSON answer
 * carries rather than becoming a Date.
 */
export function yamlToJson(source, filename) {
	try {
		return load(source, {schema: CORE_SCHEMA, filename})
	} catch (error) {
		throw new Error(`${filename}: ${error.message}`, {cause: error})
	}
}

/**
 * `value` as a fixture file: keys in their recorded order, multi-line text as
 * block strings, and any string YAML could read as something else quoted.
 */
export function dumpFixture(value) {
	return dump(value, {lineWidth: -1, noRefs: true})
}

/** A CommonJS module whose export is that value. */
export function yamlModuleSource(source, filename) {
	return `module.exports = ${JSON.stringify(yamlToJson(source, filename))};\n`
}
