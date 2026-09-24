import {newPostingIds} from '../new-postings'

describe('newPostingIds', () => {
	test('marks nothing new on the first visit', () => {
		expect(newPostingIds(['a', 'b'], null)).toEqual(new Set())
	})

	test('marks postings the last visit did not see', () => {
		expect(newPostingIds(['a', 'b', 'c'], ['a'])).toEqual(new Set(['b', 'c']))
	})

	test('ignores seen postings that have since closed', () => {
		expect(newPostingIds(['b'], ['a', 'b'])).toEqual(new Set())
	})
})
