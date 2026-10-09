import Ajv2020 from 'ajv/dist/2020'

import {endpointFor} from './fixture-endpoints'
import type {CampusRecordingFile} from './fixtures'

const ajv = new Ajv2020({allErrors: true, strict: false})

/**
 * What is wrong with a fixture, as lines naming its key and field: "no schema"
 * when its request matches no endpoint, else each place its JSON departs from
 * the endpoint's schema. Empty when it is fine.
 */
export function validateFixture(
	file: CampusRecordingFile,
	schemaFor: (name: string) => object,
): string[] {
	let key = file.key ?? '(no key)'
	let endpoint = endpointFor(key)
	if (!endpoint) {
		return [`no schema for ${key}; add its endpoint to fixture-endpoints.ts`]
	}
	if (file.json === undefined) {
		return []
	}
	let validate = ajv.getSchema(endpoint.schema) ?? compile(endpoint.schema, schemaFor)
	if (validate(file.json)) {
		return []
	}
	return (validate.errors ?? []).map(
		(error) => `${key}: ${error.instancePath || '(root)'} ${error.message ?? ''}`,
	)
}

/** Compiles `name`'s schema once, under its name, so each later fixture reuses it. */
function compile(name: string, schemaFor: (name: string) => object) {
	ajv.addSchema(schemaFor(name), name)
	let validate = ajv.getSchema(name)
	if (!validate) {
		throw new Error(`the ${name} schema did not compile`)
	}
	return validate
}
