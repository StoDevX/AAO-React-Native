import {describe, expect, it} from '@jest/globals'
import {serverRoutesOptions} from '../api-test/query'

describe('serverRoutesOptions', () => {
	it("keeps each campus's routes apart", () => {
		expect(serverRoutesOptions('edu.carleton').queryKey).not.toEqual(
			serverRoutesOptions('edu.stolaf').queryKey,
		)
	})
})
