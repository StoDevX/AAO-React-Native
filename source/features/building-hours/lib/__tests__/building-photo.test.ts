import {describe, expect, it} from '@jest/globals'
import {carleton} from '../../../../campuses/edu-carleton'
import {stolaf} from '../../../../campuses/edu-stolaf'
import {remoteImage} from '../../../../lib/remote-images'
import {buildingPhoto} from '../building-photo'

describe('buildingPhoto', () => {
	it("finds a venue's photo on a campus with photos", () => {
		expect(buildingPhoto(stolaf.hours, 'cage')).toStrictEqual(remoteImage('spaces', 'cage'))
	})

	it('finds none for a venue without an image', () => {
		expect(buildingPhoto(stolaf.hours, undefined)).toBeNull()
	})

	// Carleton's Writing Center keys to `disco`, which at St. Olaf is a
	// different room entirely: the campus gates the lookup, not the key.
	it('finds none on a campus without photos, whatever the key', () => {
		expect(buildingPhoto(carleton.hours, 'disco')).toBeNull()
	})

	it('finds none on a campus without hours', () => {
		expect(buildingPhoto(undefined, 'cage')).toBeNull()
	})
})
