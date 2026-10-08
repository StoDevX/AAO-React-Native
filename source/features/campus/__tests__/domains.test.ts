import {describe, expect, test} from '@jest/globals'

import {CAMPUS_DOMAINS, campusForDomain, campusFromDomain, UnknownCampusError} from '../domains'

describe('campus domains', () => {
	test.each([
		['stolaf.edu', 'stolaf'],
		['carleton.edu', 'carleton'],
	])('reads %s as %s', (domain, campus) => {
		expect(campusFromDomain(domain)).toBe(campus)
	})

	test('names each campus by its own domain', () => {
		for (let [campus, domain] of Object.entries(CAMPUS_DOMAINS)) {
			expect(campusFromDomain(domain)).toBe(campus)
		}
	})

	test('finds no campus for a domain it does not know', () => {
		expect(campusForDomain('luther.edu')).toBeUndefined()
	})

	test('refuses a campus it does not know, naming the ones it does', () => {
		expect(() => campusFromDomain('luther.edu')).toThrow(UnknownCampusError)
		expect(() => campusFromDomain('luther.edu')).toThrow(/luther\.edu.*stolaf\.edu, carleton\.edu/u)
	})
})
