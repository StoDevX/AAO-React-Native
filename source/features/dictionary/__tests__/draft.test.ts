import {normalizeEntry} from '../lib/entry'
import {
	addExample,
	addSense,
	addSubsense,
	deleteExample,
	deleteSense,
	findSense,
	moveExample,
	moveSense,
	normalizeDraft,
	setExampleText,
	setSenseField,
	startDraft,
} from '../lib/draft'

describe('startDraft', () => {
	it('replaces absent optional fields with empty strings', () => {
		let draft = startDraft(normalizeEntry({word: 'Caf', definition: 'The dining hall.'}))

		expect(draft.pronunciation).toBe('')
		expect(draft.partOfSpeech).toBe('')
		expect(draft.senses[0]).toMatchObject({grammar: '', examples: [], subsenses: []})
	})

	it('numbers every sense and example in reading order', () => {
		let draft = startDraft(
			normalizeEntry({
				word: 'change',
				senses: [
					{definition: 'alter', examples: ['a', 'b'], subsenses: [{definition: 'become'}]},
					{definition: 'coins'},
				],
			}),
		)

		expect(draft.senses.map((s) => s.id)).toEqual(['1', '5'])
		expect(draft.senses[0].examples.map((e) => e.id)).toEqual(['2', '3'])
		expect(draft.senses[0].subsenses[0].id).toBe('4')
	})

	it('assigns the same ids every time, so a diff can match by them', () => {
		let entry = normalizeEntry({word: 'Caf', definition: 'The dining hall.'})

		expect(startDraft(entry)).toEqual(startDraft(entry))
	})
})

describe('normalizeDraft', () => {
	it('collapses a lone structureless sense back to a definition', () => {
		let draft = startDraft(normalizeEntry({word: 'Caf', definition: 'The dining hall.'}))

		expect(normalizeDraft(draft)).toEqual({word: 'Caf', definition: 'The dining hall.'})
	})

	it('keeps senses once there is more than one', () => {
		let draft = startDraft(
			normalizeEntry({word: 'ACM', senses: [{definition: 'One.'}, {definition: 'Two.'}]}),
		)

		expect(normalizeDraft(draft)).toEqual({
			word: 'ACM',
			senses: [{definition: 'One.'}, {definition: 'Two.'}],
		})
	})

	it('keeps senses when a lone sense carries structure', () => {
		let draft = startDraft(
			normalizeEntry({word: 'Caf', senses: [{definition: 'The hall.', grammar: 'no object'}]}),
		)

		expect(normalizeDraft(draft)).toEqual({
			word: 'Caf',
			senses: [{grammar: 'no object', definition: 'The hall.'}],
		})
	})

	// The form holds every optional field, so a field the reader never opened
	// still passes through here on its way to the email. A sense's citations and
	// its sub-senses are the ones with nowhere else to be checked: `diffEntry`
	// covers them, so a dropped one would preview as sent and arrive missing.
	it('carries a rich sense whole, structure and all', () => {
		let entry = normalizeEntry({
			word: 'change',
			pronunciation: 'tʃeɪndʒ',
			partOfSpeech: 'verb',
			senses: [
				{
					grammar: 'with object',
					definition: 'alter or modify.',
					examples: ['change gears', 'change your mind'],
					subsenses: [{definition: 'become different.', examples: ['the light changed']}],
				},
			],
		})

		expect(normalizeDraft(startDraft(entry))).toEqual({
			word: 'change',
			pronunciation: 'tʃeɪndʒ',
			partOfSpeech: 'verb',
			senses: [
				{
					grammar: 'with object',
					definition: 'alter or modify.',
					examples: ['change gears', 'change your mind'],
					subsenses: [{definition: 'become different.', examples: ['the light changed']}],
				},
			],
		})
	})

	it('carries a citation added through the sense screen', () => {
		let draft = startDraft(normalizeEntry({word: 'Caf', definition: 'The dining hall.'}))
		let added = addExample(draft, '1')
		draft = setExampleText(added, '1', added.senses[0].examples[0].id, ' meet me at the caf ')

		// A citation is structure, so the lone sense no longer collapses back to
		// a bare `definition:`.
		expect(normalizeDraft(draft)).toEqual({
			word: 'Caf',
			senses: [{definition: 'The dining hall.', examples: ['meet me at the caf']}],
		})
	})

	it('carries a sub-sense added through the sense screen', () => {
		let draft = startDraft(normalizeEntry({word: 'Caf', definition: 'The dining hall.'}))
		let added = addSubsense(draft, '1')
		draft = setSenseField(added, added.senses[0].subsenses[0].id, {definition: ' The Cage. '})

		expect(normalizeDraft(draft)).toEqual({
			word: 'Caf',
			senses: [{definition: 'The dining hall.', subsenses: [{definition: 'The Cage.'}]}],
		})
	})

	it('trims every field and drops the ones left empty', () => {
		let draft = startDraft(normalizeEntry({word: ' Caf ', definition: ' The hall. '}))
		draft = {...draft, pronunciation: '   ', partOfSpeech: ' noun '}

		expect(normalizeDraft(draft)).toEqual({
			word: 'Caf',
			partOfSpeech: 'noun',
			definition: 'The hall.',
		})
		expect(normalizeDraft({...draft, pronunciation: ' kaf '})).toMatchObject({pronunciation: 'kaf'})
	})

	it('drops a sense whose definition is blank', () => {
		let draft = startDraft(
			normalizeEntry({word: 'ACM', senses: [{definition: 'One.'}, {definition: 'Two.'}]}),
		)
		draft = {...draft, senses: [draft.senses[0], {...draft.senses[1], definition: '  '}]}

		expect(normalizeDraft(draft)).toEqual({word: 'ACM', definition: 'One.'})
	})
})

const twoSenses = () =>
	startDraft(normalizeEntry({word: 'ACM', senses: [{definition: 'One.'}, {definition: 'Two.'}]}))

const threeSenses = () =>
	startDraft(
		normalizeEntry({
			word: 'ACM',
			senses: [{definition: 'One.'}, {definition: 'Two.'}, {definition: 'Three.'}],
		}),
	)

describe('editing a draft', () => {
	it('finds a sense at any depth', () => {
		let draft = startDraft(
			normalizeEntry({
				word: 'change',
				senses: [{definition: 'alter', subsenses: [{definition: 'become'}]}],
			}),
		)

		expect(findSense(draft, '2')?.definition).toBe('become')
	})

	it('sets a field on one sense and leaves the rest alone', () => {
		let draft = setSenseField(twoSenses(), '2', {definition: 'Edited.'})

		expect(draft.senses.map((s) => s.definition)).toEqual(['One.', 'Edited.'])
	})

	it('gives a new sense an id no other sense or example holds', () => {
		let draft = addSense(twoSenses())

		expect(draft.senses.map((s) => s.id)).toEqual(['1', '2', '3'])
		expect(draft.senses[2].definition).toBe('')
	})

	it('nests a new sense under its parent', () => {
		let draft = addSubsense(twoSenses(), '1')

		expect(draft.senses[0].subsenses.map((s) => s.id)).toEqual(['3'])
	})

	it('deletes a sense at any depth', () => {
		let draft = deleteSense(addSubsense(twoSenses(), '1'), '3')

		expect(draft.senses[0].subsenses).toEqual([])
	})

	it('reorders the top-level senses', () => {
		let draft = moveSense(twoSenses(), null, 1, 0)

		expect(draft.senses.map((s) => s.definition)).toEqual(['Two.', 'One.'])
	})

	// A downward drag is where SwiftUI's destination and a plain splice index
	// part company, and a two-item list cannot tell them apart: dragging the
	// first row to the end is the same move either way. Three rows is the
	// shortest list where landing second and landing last differ.
	it('lands a sense dragged below its neighbour second, not last', () => {
		let draft = moveSense(threeSenses(), null, 0, 2)

		expect(draft.senses.map((s) => s.definition)).toEqual(['Two.', 'One.', 'Three.'])
	})

	it('reorders the senses under a parent', () => {
		let draft = addSubsense(addSubsense(twoSenses(), '1'), '1')
		draft = setSenseField(draft, '4', {definition: 'second'})
		draft = moveSense(draft, '1', 1, 0)

		expect(draft.senses[0].subsenses.map((s) => s.id)).toEqual(['4', '3'])
	})

	it('lands a sub-sense dragged below its neighbour second, not last', () => {
		let draft = addSubsense(addSubsense(addSubsense(twoSenses(), '1'), '1'), '1')
		draft = moveSense(draft, '1', 0, 2)

		expect(draft.senses[0].subsenses.map((s) => s.id)).toEqual(['4', '3', '5'])
	})

	it('adds, edits, reorders and deletes an example', () => {
		let draft = addExample(addExample(twoSenses(), '1'), '1')
		draft = setExampleText(draft, '1', '3', 'first')
		draft = setExampleText(draft, '1', '4', 'second')
		expect(draft.senses[0].examples.map((e) => e.text)).toEqual(['first', 'second'])

		draft = moveExample(draft, '1', 1, 0)
		expect(draft.senses[0].examples.map((e) => e.text)).toEqual(['second', 'first'])

		draft = deleteExample(draft, '1', '3')
		expect(draft.senses[0].examples.map((e) => e.id)).toEqual(['4'])
	})

	it('lands an example dragged below its neighbour second, not last', () => {
		let draft = addExample(addExample(addExample(twoSenses(), '1'), '1'), '1')
		draft = setExampleText(draft, '1', '3', 'first')
		draft = setExampleText(draft, '1', '4', 'second')
		draft = setExampleText(draft, '1', '5', 'third')

		draft = moveExample(draft, '1', 0, 2)

		expect(draft.senses[0].examples.map((e) => e.text)).toEqual(['second', 'first', 'third'])
	})

	it('leaves the draft it was given untouched', () => {
		let before = twoSenses()
		setSenseField(before, '1', {definition: 'Edited.'})

		expect(before.senses[0].definition).toBe('One.')
	})
})
