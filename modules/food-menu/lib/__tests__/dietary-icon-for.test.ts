import {describe, expect, test} from '@jest/globals'
import {dietaryIconFor} from '../dietary-icon-for'
import type {MasterCorIconMapType} from '../../types'

const corIcons: MasterCorIconMapType = {
	vegan: {sort: '1', label: 'Vegan', description: '', image: 'https://x/vegan.png'},
	// `&amp;` decodes to `&` -- the option `title` a filter option carries is
	// always the decoded label, never the raw one, so the bridge has to decode
	// too or it never matches.
	halal: {sort: '2', label: 'Halal &amp; Kosher', description: '', image: 'https://x/halal.png'},
	// No `image` -- `useLocalCorIcons` never downloads this one, so it never
	// appears in `localIcons` either.
	kosher: {sort: '3', label: 'Kosher', description: '', image: ''},
}

describe('dietaryIconFor', () => {
	test('returns a local-file icon for an option whose title matches a downloaded icon', () => {
		let localIcons = {vegan: 'file:///cache/vegan.png'}
		let iconFor = dietaryIconFor(corIcons, localIcons)

		expect(iconFor({title: 'Vegan'})).toEqual({kind: 'localFile', uri: 'file:///cache/vegan.png'})
	})

	test('matches against the decoded label, not the raw one', () => {
		let localIcons = {halal: 'file:///cache/halal.png'}
		let iconFor = dietaryIconFor(corIcons, localIcons)

		expect(iconFor({title: 'Halal & Kosher'})).toEqual({
			kind: 'localFile',
			uri: 'file:///cache/halal.png',
		})
	})

	test('returns null for an option whose icon has not downloaded yet', () => {
		let iconFor = dietaryIconFor(corIcons, {})

		expect(iconFor({title: 'Vegan'})).toBeNull()
	})

	test('returns null for an option with no matching cor-icon', () => {
		let iconFor = dietaryIconFor(corIcons, {vegan: 'file:///cache/vegan.png'})

		expect(iconFor({title: 'Nut-Free'})).toBeNull()
	})
})
