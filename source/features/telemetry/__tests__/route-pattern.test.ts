import {routePattern} from '../route-pattern'

describe('routePattern', () => {
	it('joins segments into the route file path', () => {
		expect(routePattern(['(home)', 'Menus'])).toBe('/(home)/Menus')
	})

	it("keeps a dynamic segment's brackets, never a value", () => {
		expect(routePattern(['(home)', 'Dictionary', '[word]'])).toBe('/(home)/Dictionary/[word]')
	})

	it('keeps a catch-all segment as written', () => {
		expect(routePattern(['[...rest]'])).toBe('/[...rest]')
	})

	it('names the root route', () => {
		expect(routePattern([])).toBe('/')
	})
})
