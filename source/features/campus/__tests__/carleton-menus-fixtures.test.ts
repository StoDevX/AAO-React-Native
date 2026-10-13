import {expect, test} from '@jest/globals'

import carletonFixtures from '../__fixtures__/edu.carleton'

// Carleton's halls are asked of Carleton's server, so its recordings are keyed by it.
test("Carleton's Burton recordings answer requests to Carleton's server", () => {
	let keys = carletonFixtures.map((file) => file.key)
	expect(keys).toContain('GET {server:edu.carleton}/food/named/menu/burton')
	expect(keys).toContain('GET {server:edu.carleton}/food/named/cafe/burton')
})
