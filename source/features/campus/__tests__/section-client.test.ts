import {describe, expect, jest, test} from '@jest/globals'
import {clientFor} from '@frogpond/api'

import {useCampusStore} from '../store'
import {clientForSection} from '../section-client'

jest.mock('@frogpond/api', () => {
	let clients = new Map<string, object>()
	return {
		clientFor: (id: string) => {
			if (!clients.has(id)) clients.set(id, {id})
			return clients.get(id)
		},
	}
})

describe('a St. Olaf-only feature', () => {
	test("fetches from St. Olaf's server on St. Olaf", () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		expect(clientForSection('studentOrgs')).toBe(clientFor('edu.stolaf'))
	})

	test("still fetches from St. Olaf's server when opened by URL on Carleton", () => {
		useCampusStore.setState({campus: 'edu.carleton'})
		expect(clientForSection('studentOrgs')).toBe(clientFor('edu.stolaf'))
	})
})
