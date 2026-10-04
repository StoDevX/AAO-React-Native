import {dataSources} from '../data-sources'

describe('dataSources', () => {
	it('names each source once', () => {
		let names = dataSources.map((entry) => entry.name)
		expect(new Set(names).size).toBe(names.length)
	})

	it('says what each source provides', () => {
		for (let entry of dataSources) {
			expect(entry.provides).not.toBe('')
		}
	})

	it('links each source to a secure page', () => {
		for (let entry of dataSources) {
			expect(new URL(entry.url).protocol).toBe('https:')
		}
	})
})
