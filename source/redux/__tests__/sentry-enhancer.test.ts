import * as Sentry from '@sentry/react-native'

import '../sentry-enhancer'

jest.mock('@sentry/react-native', () => ({createReduxEnhancer: jest.fn(() => 'enhancer')}))

type EnhancerOptions = {
	stateTransformer: (state: unknown) => unknown
	actionTransformer: (action: {type: string; payload?: unknown}) => unknown
}

/** The options `sentry-enhancer.ts` handed Sentry when it loaded. */
function enhancerOptions(): EnhancerOptions {
	let [options] = jest.mocked(Sentry.createReduxEnhancer).mock.calls[0] as [EnhancerOptions]
	return options
}

describe('the Sentry Redux enhancer', () => {
	// State holds favorite buildings, recent course filters and the like; tied
	// to a device ID, that is a profile.
	it('attaches no app state to errors', () => {
		let state = {
			buildings: {favorites: ['Buntrock Commons']},
			courses: {recentFilters: [{filters: ['GE: WRI']}], recentSearches: ['bio 150']},
		}

		expect(enhancerOptions().stateTransformer(state)).toBeNull()
	})

	// A payload can carry a favorite building, a search, a filter; the type
	// alone says what happened.
	it.each([
		{type: 'buildings/toggleFavorite', payload: 'Buntrock Commons'},
		{type: 'courses/updateRecentSearches', payload: 'bio 150'},
	])('keeps only the type of $type', (action) => {
		expect(enhancerOptions().actionTransformer(action)).toStrictEqual({type: action.type})
	})
})
