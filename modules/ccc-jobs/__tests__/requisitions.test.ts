import {parseCategories, parseRequisitions} from '../parsers/requisitions'
import categories from './fixtures/categories.json'
import requisitions from './fixtures/requisitions.json'

describe('parseCategories', () => {
	test('returns every category with its count', () => {
		const parsed = parseCategories(categories)

		expect(parsed.length).toBeGreaterThan(0)
		expect(parsed).toContainEqual(
			expect.objectContaining({name: 'Student Work', count: expect.any(Number)}),
		)
		for (const category of parsed) {
			expect(typeof category.id).toBe('number')
			expect(category.name).not.toBe('')
		}
	})

	test('a response with no facet yields no categories', () => {
		expect(parseCategories({items: [{TotalJobsCount: 0}]})).toEqual([])
	})

	test('a malformed response throws', () => {
		expect(() => parseCategories({nope: true})).toThrow()
	})
})

describe('parseRequisitions', () => {
	test('returns every requisition in the list', () => {
		const parsed = parseRequisitions(requisitions)

		expect(parsed.length).toBeGreaterThan(0)
		for (const job of parsed) {
			expect(job.id).toMatch(/^\d+$/u)
			expect(job.title).not.toBe('')
			expect(job.postedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/u)
		}
	})

	test('an empty list yields no jobs', () => {
		expect(parseRequisitions({items: [{TotalJobsCount: 0, requisitionList: []}]})).toEqual([])
	})

	test('a missing list yields no jobs', () => {
		expect(parseRequisitions({items: [{TotalJobsCount: 0}]})).toEqual([])
	})

	// A partial row means Oracle changed shape; better to fail loudly and show
	// the retry notice than to render half a listing.
	test('a requisition missing its title throws rather than yielding a partial row', () => {
		expect(() =>
			parseRequisitions({items: [{TotalJobsCount: 1, requisitionList: [{Id: '1'}]}]}),
		).toThrow()
	})
})
