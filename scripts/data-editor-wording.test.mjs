import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {wordProblem, wordProblems} from './data-editor-wording.mjs'

const contact = {
	title: 'Contact',
	type: 'object',
	additionalProperties: false,
	required: ['title'],
	oneOf: [{required: ['phoneNumber']}, {required: ['buttonLink']}],
	properties: {
		title: {type: 'string', title: 'Title'},
		phoneNumber: {type: 'string', title: 'Phone', editor: 'phone', pattern: '^\\d{10,11}$'},
		buttonLink: {type: 'string', title: 'Button Link'},
		severity: {title: 'Severity', enum: ['notice', 'alert']},
		links: {
			type: 'array',
			title: 'Links',
			items: {type: 'object', properties: {url: {type: 'string', title: 'Address'}}},
		},
	},
}

describe('wordProblem', () => {
	it('names a missing field by its title', () => {
		let error = {instancePath: '', keyword: 'required', params: {missingProperty: 'title'}}
		assert.equal(wordProblem(error, contact), 'Title is missing')
	})

	it('says what a phone number should look like', () => {
		let error = {instancePath: '/phoneNumber', keyword: 'pattern', params: {}, message: 'x'}
		assert.equal(wordProblem(error, contact), 'Phone should be a 10-digit phone number')
	})

	it('lists the choices a field allows', () => {
		let error = {
			instancePath: '/severity',
			keyword: 'enum',
			params: {allowedValues: ['notice', 'alert']},
		}
		assert.equal(wordProblem(error, contact), 'Severity must be one of notice, alert')
	})

	it('names a field the app does not use', () => {
		let error = {
			instancePath: '',
			keyword: 'additionalProperties',
			params: {additionalProperty: 'colour'},
		}
		assert.equal(wordProblem(error, contact), "Contact has a field the app doesn't use: colour")
	})

	it('finds a title inside a list item', () => {
		let error = {
			instancePath: '/links/0/url',
			keyword: 'type',
			params: {},
			message: 'must be string',
		}
		assert.equal(wordProblem(error, contact), 'Address: must be string')
	})
})

describe('wordProblems', () => {
	it('says once that one of two fields is needed', () => {
		let errors = [
			{
				instancePath: '',
				schemaPath: '#/oneOf/0/required',
				keyword: 'required',
				params: {missingProperty: 'phoneNumber'},
			},
			{
				instancePath: '',
				schemaPath: '#/oneOf/1/required',
				keyword: 'required',
				params: {missingProperty: 'buttonLink'},
			},
			{instancePath: '', schemaPath: '#/oneOf', keyword: 'oneOf', params: {passingSchemas: null}},
		]
		assert.deepEqual(wordProblems(errors, contact), [
			{message: 'Phone or Button Link is missing', instancePath: ''},
		])
	})
})
