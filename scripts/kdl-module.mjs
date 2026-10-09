// JSON-in-KDL fixtures (https://github.com/kdl-org/kdl/blob/main/JSON-IN-KDL.md),
// turned into the JSON they describe when a module imports one. Shared by the
// Jest transform and the Metro transformer, so both read a file the same way.

import {parse} from '@bgotink/kdl/json'

/** The JSON value `source` describes; a parse error names `filename`. */
export function kdlToJson(source, filename) {
	try {
		return parse(source)
	} catch (error) {
		throw new Error(`${filename}: ${error.message}`, {cause: error})
	}
}

/** A CommonJS module whose export is that value. */
export function kdlModuleSource(source, filename) {
	return `module.exports = ${JSON.stringify(kdlToJson(source, filename))};\n`
}
