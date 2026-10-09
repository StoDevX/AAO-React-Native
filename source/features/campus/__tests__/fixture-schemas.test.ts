import {describe, expect, test} from '@jest/globals'

import {validateFixture} from '../fixture-schema-check'
import type {CampusRecordingFile} from '../fixtures'
import carleton from '../__fixtures__/edu.carleton'
import stolaf from '../__fixtures__/edu.stolaf'

// oxlint-disable-next-line typescript/no-require-imports
const schemaFor = (name: string): object => require(`../__schemas__/${name}.json`) as object

const recordings: ReadonlyArray<CampusRecordingFile> = [...stolaf, ...carleton]

describe('the fixture schema check', () => {
	test('every recording fits the schema inferred from it', () => {
		expect(recordings.flatMap((file) => validateFixture(file, schemaFor))).toEqual([])
	})

	test('names the key and field of a fixture that departs from its schema', () => {
		let errors = validateFixture(
			{key: 'GET {server:example.college}/dictionary', status: 200, json: {data: 'nope'}},
			schemaFor,
		)
		expect(errors.join('\n')).toMatch('GET {server:example.college}/dictionary: /data')
	})

	test('refuses a fixture whose request no endpoint lists', () => {
		expect(
			validateFixture({key: 'GET {server:example.college}/nowhere', status: 200}, schemaFor),
		).toEqual([
			'no schema for GET {server:example.college}/nowhere; add its endpoint to fixture-endpoints.ts',
		])
	})
})
