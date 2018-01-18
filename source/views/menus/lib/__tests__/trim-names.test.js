/* eslint-env jest */
// @flow
import {trimStationName, trimItemLabel} from '../trim-names'

describe('trimStationName', () => {
	it('should remove the <strong> html tags and @ prefix', () => {
		expect(trimStationName('<strong>@Name</strong>')).toBe('Name')
	})
})

describe('trimItemLabel', () => {
	it('should remove extraneous whitespace from the input', () => {
		expect(trimItemLabel('Blah    Hi\t Bleep')).toBe('Blah Hi Bleep')
	})

	it('should title-case the input', () => {
		expect(trimItemLabel('blah hi bleep')).toBe('Blah Hi Bleep')
	})
})
