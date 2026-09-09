import {normalizeEntry} from '../lib/entry'
import {hasChanges, useDictionaryDraftStore} from '../store'

const entry = normalizeEntry({word: 'Caf', definition: 'The dining hall.'})

beforeEach(() => {
	useDictionaryDraftStore.getState().clearDraft()
})

describe('the dictionary draft store', () => {
	// `hasChanges` and the preview both diff against `original`, so it has to
	// hold the entry as opened rather than track the edits.
	it('holds the entry a reader started from', () => {
		useDictionaryDraftStore.getState().startDraft(entry)

		expect(useDictionaryDraftStore.getState().original).toEqual(entry)
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

	// `submitted` stands the unsaved-changes guard down, and a reader can go
	// back to the form after sending and keep editing. Left set, that second
	// round of edits would leave the sheet on a drag-down without so much as
	// an alert. Any edit is a suggestion the reader has not sent yet.
	it('re-arms the unsaved-changes guard as soon as a sent draft is edited again', () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().setSenseField('1', {definition: 'The caf.'})
		useDictionaryDraftStore.getState().markSubmitted()

		useDictionaryDraftStore.getState().setSenseField('1', {definition: 'The cage.'})

		expect(useDictionaryDraftStore.getState().submitted).toBe(false)
	})

	// Every action goes through `onDraft`, which is documented to do nothing
	// before a draft is started. `hasChanges` covers that indirectly by staying
	// false; this covers it directly, so an action that wrote a draft out of
	// nothing is caught where it happens.
	it('ignores an edit made before a draft was started', () => {
		useDictionaryDraftStore.getState().addSense()

		expect(useDictionaryDraftStore.getState().draft).toBeNull()
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
