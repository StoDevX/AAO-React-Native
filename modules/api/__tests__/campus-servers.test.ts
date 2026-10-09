import {expect, test} from '@jest/globals'

import {
	campusRoot,
	campusRoots,
	clientFor,
	registerCampusServer,
	setApiRoot,
	stolafClient,
} from '../index'

/** Each registered root's address, by campus id. */
function hrefs(): Record<string, string> {
	return Object.fromEntries(Object.entries(campusRoots()).map(([id, root]) => [id, root.href]))
}

test('refuses a campus nothing registered, naming it', () => {
	expect(() => clientFor('edu.nowhere')).toThrow('No server is registered for campus edu.nowhere')
})

test("keeps each campus's server under its id, with a client of its own", () => {
	registerCampusServer('edu.stolaf', new URL('https://stolaf.example.test/v1/'))
	registerCampusServer('edu.carleton', new URL('https://carleton.example.test/v1/'))

	expect(campusRoot('edu.carleton')?.href).toBe('https://carleton.example.test/v1/')
	expect(hrefs()).toEqual({
		'edu.stolaf': 'https://stolaf.example.test/v1/',
		'edu.carleton': 'https://carleton.example.test/v1/',
	})
	expect(clientFor('edu.carleton')).not.toBe(clientFor('edu.stolaf'))
})

test("a later registration replaces the campus's server", () => {
	registerCampusServer('edu.carleton', new URL('https://carleton.example.test/v1/'))
	let before = clientFor('edu.carleton')
	registerCampusServer('edu.carleton', new URL('https://dev.example.test/v1/'))

	expect(campusRoot('edu.carleton')?.href).toBe('https://dev.example.test/v1/')
	expect(clientFor('edu.carleton')).not.toBe(before)
})

test('the deprecated St. Olaf names follow its campus', () => {
	setApiRoot(new URL('https://alias.example.test/v1/'))

	expect(campusRoot('edu.stolaf')?.href).toBe('https://alias.example.test/v1/')
	expect(stolafClient).toBe(clientFor('edu.stolaf'))
})
