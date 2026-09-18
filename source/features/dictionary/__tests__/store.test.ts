import {normalizeEntry} from '../lib/entry'
import {hasChanges, hasDefinition, useDictionaryDraftStore} from '../store'

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

	// The edit form pushes to the sense it just added, so the action has to
	// say which one that is. Asserting the id finds a real sense rather than
	// asserting a literal "2": the ids come from a counter over the whole
	// draft, and a test pinned to the number would fail the next time
	// anything else took an id first.
	it('returns the id of the sense it added', () => {
		useDictionaryDraftStore.getState().startDraft(entry)

		let id = useDictionaryDraftStore.getState().addSense()

		let draft = useDictionaryDraftStore.getState().draft
		expect(id).not.toBeNull()
		expect(draft?.senses.at(-1)?.id).toBe(id)
	})

	it('returns a different id for each sense added', () => {
		useDictionaryDraftStore.getState().startDraft(entry)

		let first = useDictionaryDraftStore.getState().addSense()
		let second = useDictionaryDraftStore.getState().addSense()

		expect(first).not.toBe(second)
	})

	it('returns the id of the sub-sense it added, under the parent named', () => {
		useDictionaryDraftStore.getState().startDraft(entry)

		let id = useDictionaryDraftStore.getState().addSubsense('1')

		let draft = useDictionaryDraftStore.getState().draft
		expect(id).not.toBeNull()
		expect(draft?.senses[0].subsenses.at(-1)?.id).toBe(id)
	})

	// Every action is a no-op before `startDraft`, so there is no id to give
	// back and the caller has nowhere to push to.
	it('adds no sense, and names none, with nothing started', () => {
		expect(useDictionaryDraftStore.getState().addSense()).toBeNull()
		expect(useDictionaryDraftStore.getState().addSubsense('1')).toBeNull()
	})
})

// An entry with every definition cleared normalises to `word: Caf, senses: []`
// -- a suggestion that names the word and says nothing about it. That is a
// change, so `hasChanges` alone would let it be previewed and sent.
describe('whether a draft says anything', () => {
	it('has nothing to send once its only definition is cleared', () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().setSenseField('1', {definition: '   '})

		expect(hasDefinition(useDictionaryDraftStore.getState())).toBe(false)
		expect(hasChanges(useDictionaryDraftStore.getState())).toBe(true)
	})

	it('still has something to send while another sense keeps its definition', () => {
		useDictionaryDraftStore
			.getState()
			.startDraft(
				normalizeEntry({word: 'ACM', senses: [{definition: 'One.'}, {definition: 'Two.'}]}),
			)
		useDictionaryDraftStore.getState().setSenseField('1', {definition: ''})

		expect(hasDefinition(useDictionaryDraftStore.getState())).toBe(true)
	})

	it('has something to send for an entry as it was opened', () => {
		useDictionaryDraftStore.getState().startDraft(entry)

		expect(hasDefinition(useDictionaryDraftStore.getState())).toBe(true)
	})

	it('has nothing to send with no draft started', () => {
		expect(hasDefinition(useDictionaryDraftStore.getState())).toBe(false)
	})
})
