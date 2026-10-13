import {afterEach, describe, expect, test} from '@jest/globals'

import {campusFromParam} from '../campus-param'
import {useCampusStore} from '../store'

afterEach(() => {
	useCampusStore.setState({campus: 'edu.stolaf'})
})

describe('the campus a route param names', () => {
	test('is the campus a reverse-DNS id names', () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		expect(campusFromParam('edu.carleton')).toBe('edu.carleton')
		useCampusStore.setState({campus: 'edu.carleton'})
		expect(campusFromParam('edu.stolaf')).toBe('edu.stolaf')
	})

	// An old Home Screen quick action or deep link from a 2.9 build.
	test('is the active campus for a legacy id, without throwing', () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		expect(campusFromParam('carleton')).toBe('edu.stolaf')
		useCampusStore.setState({campus: 'edu.carleton'})
		expect(campusFromParam('stolaf')).toBe('edu.carleton')
	})

	test('is the active campus when the param is missing, empty or unknown', () => {
		useCampusStore.setState({campus: 'edu.carleton'})
		expect(campusFromParam(undefined)).toBe('edu.carleton')
		expect(campusFromParam('')).toBe('edu.carleton')
		expect(campusFromParam('edu.nowhere')).toBe('edu.carleton')
		expect(campusFromParam('carleton.edu')).toBe('edu.carleton')
	})

	test('never reads the store for a param that names a campus', () => {
		useCampusStore.setState({campus: null})
		expect(campusFromParam('edu.stolaf')).toBe('edu.stolaf')
	})
})
