import {describe, expect, test} from '@jest/globals'

import {releases} from '../index'

describe.each(releases.map((release) => [release.tag, release] as const))('%s', (_tag, release) => {
	test('names each contract once', () => {
		let names = release.contracts.map((contract) => contract.name)
		expect(new Set(names).size).toBe(names.length)
	})

	test('lists values only for placeholders its URLs have', () => {
		for (let contract of release.contracts) {
			for (let key of Object.keys(contract.params ?? {})) {
				expect(`${contract.name}: ${contract.url}`).toContain(`{${key}}`)
			}
		}
	})
})
