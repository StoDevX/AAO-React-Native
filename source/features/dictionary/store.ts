import isEqual from 'lodash/isEqual'
import {create} from 'zustand'

import * as draftLib from './lib/draft'
import type {DraftEntry} from './lib/draft'
import type {NormalizedEntry} from './types'

type DictionaryDraftStore = {
	/**
	 * The entry as it stood when the reader opened the form. Held rather than
	 * re-read from the query, because the dictionary can refetch mid-edit and a
	 * report should say what the reader was looking at — diffing against data
	 * that moved underneath them would attribute the server's edits to them.
	 */
	original: NormalizedEntry | null
	draft: DraftEntry | null
	/**
	 * Set once the report is away, so the unsaved-changes guard stands down.
	 * Any further edit clears it again — see `onDraft`.
	 */
	submitted: boolean

	startDraft: (entry: NormalizedEntry) => void
	clearDraft: () => void
	markSubmitted: () => void

	setWord: (word: string) => void
	setPronunciation: (pronunciation: string) => void
	setPartOfSpeech: (partOfSpeech: string) => void

	setSenseField: (id: string, patch: {grammar?: string; definition?: string}) => void
	addSense: () => void
	addSubsense: (parentId: string) => void
	deleteSense: (id: string) => void
	moveSense: (parentId: string | null, from: number, to: number) => void

	addExample: (senseId: string) => void
	setExampleText: (senseId: string, exampleId: string, text: string) => void
	deleteExample: (senseId: string, exampleId: string) => void
	moveExample: (senseId: string, from: number, to: number) => void
}

/**
 * Applies a pure transform to whatever draft is in hand, and does nothing if
 * there is none — every action below is a no-op before `startDraft`.
 *
 * Clears `submitted` as it goes. A reader can walk back from the preview into
 * the form and keep editing, and what they type there has not been sent; left
 * set, the unsaved-changes guard would stay down and the next sheet drag-down
 * would take that second round of edits with it, silently.
 */
const onDraft =
	(change: (draft: DraftEntry) => DraftEntry) =>
	(state: DictionaryDraftStore): Partial<DictionaryDraftStore> =>
		state.draft ? {draft: change(state.draft), submitted: false} : {}

/**
 * The suggestion a reader is composing. Unpersisted: a half-finished
 * suggestion restored days later, against a definition that has since changed,
 * is worse than no draft at all.
 */
export const useDictionaryDraftStore = create<DictionaryDraftStore>()((set) => ({
	original: null,
	draft: null,
	submitted: false,

	startDraft: (entry) =>
		set({original: entry, draft: draftLib.startDraft(entry), submitted: false}),
	clearDraft: () => set({original: null, draft: null, submitted: false}),
	markSubmitted: () => set({submitted: true}),

	setWord: (word) => set(onDraft((draft) => ({...draft, word}))),
	setPronunciation: (pronunciation) => set(onDraft((draft) => ({...draft, pronunciation}))),
	setPartOfSpeech: (partOfSpeech) => set(onDraft((draft) => ({...draft, partOfSpeech}))),

	setSenseField: (id, patch) => set(onDraft((draft) => draftLib.setSenseField(draft, id, patch))),
	addSense: () => set(onDraft(draftLib.addSense)),
	addSubsense: (parentId) => set(onDraft((draft) => draftLib.addSubsense(draft, parentId))),
	deleteSense: (id) => set(onDraft((draft) => draftLib.deleteSense(draft, id))),
	moveSense: (parentId, from, to) =>
		set(onDraft((draft) => draftLib.moveSense(draft, parentId, from, to))),

	addExample: (senseId) => set(onDraft((draft) => draftLib.addExample(draft, senseId))),
	setExampleText: (senseId, exampleId, text) =>
		set(onDraft((draft) => draftLib.setExampleText(draft, senseId, exampleId, text))),
	deleteExample: (senseId, exampleId) =>
		set(onDraft((draft) => draftLib.deleteExample(draft, senseId, exampleId))),
	moveExample: (senseId, from, to) =>
		set(onDraft((draft) => draftLib.moveExample(draft, senseId, from, to))),
}))

/**
 * Whether the draft would send anything.
 *
 * Compares the *normalised* draft against the entry as opened, so retyping the
 * same text with a stray space is not an edit.
 */
export function hasChanges(state: Pick<DictionaryDraftStore, 'original' | 'draft'>): boolean {
	if (!state.original || !state.draft) {
		return false
	}

	return !isEqual(
		draftLib.normalizeDraft(state.draft),
		draftLib.normalizeDraft(draftLib.startDraft(state.original)),
	)
}
