import {normalizeEntry} from '../lib/entry'
import {hasChanges, useDictionaryDraftStore} from '../store'

const entry = normalizeEntry({word: 'Caf', definition: 'The dining hall.'})

beforeEach(() => {
	useDictionaryDraftStore.getState().clearDraft()
})

describe('the dictionary draft store', () => {
	it('holds the entry a reader started from alongside their draft', () => {
		useDictionaryDraftStore.getState().startDraft(entry)

		let {original, draft} = useDictionaryDraftStore.getState()
		expect(original).toEqual(entry)
		expect(draft?.word).toBe('Caf')
	})

	it('reports no changes for an untouched draft', () => {
		useDictionaryDraftStore.getState().startDraft(entry)

		expect(hasChanges(useDictionaryDraftStore.getState())).toBe(false)
	})

	it('reports no changes for an edit that only adds whitespace', () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().setSenseField('1', {definition: '  The dining hall.  '})

		expect(hasChanges(useDictionaryDraftStore.getState())).toBe(false)
	})

	it('reports a change once the text actually differs', () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().setSenseField('1', {definition: 'The caf.'})

		expect(hasChanges(useDictionaryDraftStore.getState())).toBe(true)
	})

	it('reports no changes with nothing started', () => {
		expect(hasChanges(useDictionaryDraftStore.getState())).toBe(false)
	})

	it('forgets everything on clear', () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().markSubmitted()
		useDictionaryDraftStore.getState().clearDraft()

		let state = useDictionaryDraftStore.getState()
		expect(state.original).toBeNull()
		expect(state.draft).toBeNull()
		expect(state.submitted).toBe(false)
	})
})
