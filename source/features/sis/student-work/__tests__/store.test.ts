import {act} from '@testing-library/react-native'

import {useSeenPostingsStore} from '../store'

describe('useSeenPostingsStore', () => {
	beforeEach(() => {
		useSeenPostingsStore.setState({seenIds: null})
	})

	test('starts having seen nothing, as on a first visit', () => {
		expect(useSeenPostingsStore.getState().seenIds).toBeNull()
	})

	test('remembers the postings on the board when the student leaves', async () => {
		await act(() => {
			useSeenPostingsStore.getState().markSeen(['a', 'b'])
		})
		expect(useSeenPostingsStore.getState().seenIds).toEqual(['a', 'b'])
	})

	test('replaces the last visit’s postings, so closed ones drop out', async () => {
		await act(() => {
			useSeenPostingsStore.getState().markSeen(['a', 'b'])
			useSeenPostingsStore.getState().markSeen(['b', 'c'])
		})
		expect(useSeenPostingsStore.getState().seenIds).toEqual(['b', 'c'])
	})

	/// An empty board is a failed or unfinished load far more often than a
	/// real one; remembering it would make every posting "new" next time.
	test('ignores an empty board', async () => {
		await act(() => {
			useSeenPostingsStore.getState().markSeen(['a'])
			useSeenPostingsStore.getState().markSeen([])
		})
		expect(useSeenPostingsStore.getState().seenIds).toEqual(['a'])
	})
})
