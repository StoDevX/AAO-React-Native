import {normalizeEntry} from '../lib/entry'
import {
	addSense,
	addSubsense,
	deleteExample,
	deleteSense,
	moveSense,
	setSenseField,
	startDraft,
} from '../lib/draft'
import {diffEntry, diffWords} from '../lib/diff'

describe('diffWords', () => {
	it('marks identical text as unchanged', () => {
		expect(diffWords('the dining hall', 'the dining hall')).toEqual([
			{text: 'the dining hall', mark: 'same'},
		])
	})

	it('marks an inserted word', () => {
		expect(diffWords('the hall', 'the dining hall')).toEqual([
			{text: 'the ', mark: 'same'},
			{text: 'dining ', mark: 'added'},
			{text: 'hall', mark: 'same'},
		])
	})

	it('marks a deleted word', () => {
		expect(diffWords('the dining hall', 'the hall')).toEqual([
			{text: 'the ', mark: 'same'},
			{text: 'dining ', mark: 'removed'},
			{text: 'hall', mark: 'same'},
		])
	})

	it('marks a replacement as a deletion then an insertion', () => {
		expect(diffWords('the dining hall', 'the caf hall')).toEqual([
			{text: 'the ', mark: 'same'},
			{text: 'dining ', mark: 'removed'},
			{text: 'caf ', mark: 'added'},
			{text: 'hall', mark: 'same'},
		])
	})

	it('marks text arriving where there was none', () => {
		expect(diffWords('', 'noun')).toEqual([{text: 'noun', mark: 'added'}])
	})

	it('returns nothing for two empty strings', () => {
		expect(diffWords('', '')).toEqual([])
	})

	it('coalesces several consecutive removed or added words into one run', () => {
		expect(diffWords('the quick brown fox', 'the fox')).toEqual([
			{text: 'the ', mark: 'same'},
			{text: 'quick brown ', mark: 'removed'},
			{text: 'fox', mark: 'same'},
		])
		expect(diffWords('the fox', 'the quick brown fox')).toEqual([
			{text: 'the ', mark: 'same'},
			{text: 'quick brown ', mark: 'added'},
			{text: 'fox', mark: 'same'},
		])
	})
})

const twoSenses = () =>
	startDraft(normalizeEntry({word: 'ACM', senses: [{definition: 'One.'}, {definition: 'Two.'}]}))

const threeSenses = () =>
	startDraft(
		normalizeEntry({
			word: 'w',
			senses: [{definition: 'One.'}, {definition: 'Two.'}, {definition: 'Three.'}],
		}),
	)

describe('diffEntry', () => {
	it('marks an unchanged entry as unchanged throughout', () => {
		let draft = twoSenses()
		let diff = diffEntry(draft, draft)

		expect(diff.senses.map((s) => s.status)).toEqual(['same', 'same'])
		expect(diff.word).toEqual([{text: 'ACM', mark: 'same'}])
	})

	it('numbers the senses a reader will see, and skips the ones they will not', () => {
		let diff = diffEntry(twoSenses(), deleteSense(twoSenses(), '1'))

		expect(diff.senses.map((s) => [s.status, s.number])).toEqual([
			['removed', undefined],
			['same', 1],
		])
	})

	it('leaves a deletion where it used to be rather than collecting it at the end', () => {
		let after = deleteSense(addSense(twoSenses()), '1')
		let diff = diffEntry(twoSenses(), after)

		expect(diff.senses.map((s) => s.status)).toEqual(['removed', 'same', 'added'])
	})

	it('marks the words that changed inside a sense that stayed', () => {
		let diff = diffEntry(twoSenses(), setSenseField(twoSenses(), '2', {definition: 'Three.'}))

		expect(diff.senses[1].status).toBe('changed')
		expect(diff.senses[1].definition).toEqual([
			{text: 'Two.', mark: 'removed'},
			{text: 'Three.', mark: 'added'},
		])
	})

	it('says where a moved sense came from', () => {
		let diff = diffEntry(twoSenses(), moveSense(twoSenses(), null, 1, 0))

		expect(diff.senses.map((s) => [s.number, s.movedFrom])).toEqual([
			[1, 2],
			[2, 1],
		])
	})

	it('marks an example that moved but did not change', () => {
		let before = startDraft(
			normalizeEntry({word: 'x', senses: [{definition: 'd', examples: ['a', 'b']}]}),
		)
		let after = {
			...before,
			senses: [{...before.senses[0], examples: [...before.senses[0].examples].reverse()}],
		}
		let diff = diffEntry(before, after)

		expect(diff.senses[0].examples.map((e) => [e.status, e.movedFrom])).toEqual([
			['same', 2],
			['same', 1],
		])
	})

	it('leaves no move caption on an example whose text also changed', () => {
		let before = startDraft(
			normalizeEntry({word: 'x', senses: [{definition: 'd', examples: ['a', 'b']}]}),
		)
		let reversed = [...before.senses[0].examples].reverse()
		let after = {
			...before,
			senses: [{...before.senses[0], examples: [{...reversed[0], text: 'edited'}, reversed[1]]}],
		}
		let diff = diffEntry(before, after)

		// toMatchObject with an explicit `movedFrom: undefined` would demand the
		// key be present, but every optional field here is built by omitting
		// the key rather than setting it to undefined -- so assert the two
		// facts that matter separately instead.
		expect(diff.senses[0].examples[0].status).toBe('changed')
		expect(diff.senses[0].examples[0].movedFrom).toBeUndefined()
	})

	it('diffs the senses nested under a sense', () => {
		let before = startDraft(
			normalizeEntry({
				word: 'change',
				senses: [{definition: 'alter', subsenses: [{definition: 'become'}]}],
			}),
		)
		let after = setSenseField(before, '2', {definition: 'becomes'})
		let diff = diffEntry(before, after)

		expect(diff.senses[0].subsenses[0].status).toBe('changed')
	})

	it('splices several deletions back into their original relative order', () => {
		// before: One, Two, Three, Four — Two and Three both removed, nothing
		// reordered. Naively re-indexing into the shrinking survivor list still
		// has to land Two immediately after One and Three immediately after
		// Two, not collapsed together at the wrong spot.
		let before = startDraft(
			normalizeEntry({
				word: 'w',
				senses: [
					{definition: 'One.'},
					{definition: 'Two.'},
					{definition: 'Three.'},
					{definition: 'Four.'},
				],
			}),
		)
		let after = deleteSense(deleteSense(before, '2'), '3')
		let diff = diffEntry(before, after)

		expect(diff.senses.map((s) => s.definition[0]?.text)).toEqual([
			'One.',
			'Two.',
			'Three.',
			'Four.',
		])
		expect(diff.senses.map((s) => s.status)).toEqual(['same', 'removed', 'removed', 'same'])
	})

	it('renders a deleted sense right after wherever its original predecessor ended up, even once that predecessor has moved', () => {
		// before: One, Two, Three. Three moves to the front, then Two is
		// deleted. Two's predecessor in the original list was One, so Two
		// renders right after wherever One ends up — not wedged between Three
		// and One, which is where a deletion re-indexed against the pre-move
		// list would land it.
		let moved = moveSense(threeSenses(), null, 2, 0)
		let after = deleteSense(moved, '2')
		let diff = diffEntry(threeSenses(), after)

		expect(diff.senses.map((s) => [s.status, s.movedFrom])).toEqual([
			['same', 3],
			['same', 1],
			['removed', undefined],
		])
		expect(diff.senses.map((s) => s.definition[0]?.text)).toEqual(['Three.', 'One.', 'Two.'])
	})

	it('wedges a deleted last sense between a moved predecessor and its new successor, instead of leaving it at the end — a known trade-off, not a bug', () => {
		// before: One, Two, Three. One is dragged below Two so the two swap,
		// then Three (the last sense, with no successor of its own) is
		// deleted. Three's predecessor was Two, and Two has moved to the
		// front, so Three follows it there — landing between Two and One
		// rather than staying at the very end.
		let swapped = moveSense(threeSenses(), null, 0, 2)
		let after = deleteSense(swapped, '3')
		let diff = diffEntry(threeSenses(), after)

		expect(diff.senses.map((s) => [s.status, s.definition[0]?.text])).toEqual([
			['same', 'Two.'],
			['removed', 'Three.'],
			['same', 'One.'],
		])
	})

	it('removes every sense in original order when the draft is emptied out', () => {
		let after = deleteSense(deleteSense(deleteSense(threeSenses(), '1'), '2'), '3')
		let diff = diffEntry(threeSenses(), after)

		expect(diff.senses.map((s) => s.definition[0]?.text)).toEqual(['One.', 'Two.', 'Three.'])
		expect(diff.senses.every((s) => s.status === 'removed')).toBe(true)
	})

	it('leaves no grammar runs on a sense that never had any grammar, whether kept, added or removed', () => {
		let before = twoSenses()
		let after = deleteSense(addSense(before), '1')
		let diff = diffEntry(before, after)

		// kept: same. removed: sense 1. added: the new blank sense.
		expect(diff.senses.map((s) => s.grammar)).toEqual([[], [], []])
	})

	it('marks cleared grammar as removed runs, not as a sense that never had any', () => {
		let before = startDraft(
			normalizeEntry({word: 'w', senses: [{definition: 'd', grammar: 'transitive'}]}),
		)
		let after = setSenseField(before, '1', {grammar: ''})
		let diff = diffEntry(before, after)

		expect(diff.senses[0].grammar).toEqual([{text: 'transitive', mark: 'removed'}])
	})

	it('does not report a sense as moved when its position only shifted because a sibling above it was deleted', () => {
		let after = deleteSense(threeSenses(), '1')
		let diff = diffEntry(threeSenses(), after)

		// Two and Three each slide up one slot once One is gone, but neither
		// reader-visible sense actually moved relative to the other.
		expect(diff.senses.map((s) => s.movedFrom)).toEqual([undefined, undefined])
	})

	it('does not report an example as moved when its position only shifted because a citation above it was deleted', () => {
		let before = startDraft(
			normalizeEntry({word: 'x', senses: [{definition: 'd', examples: ['a', 'b']}]}),
		)
		let after = deleteExample(before, before.senses[0].id, before.senses[0].examples[0].id)
		let diff = diffEntry(before, after)

		// 'a' is spliced back in as removed; the point of this test is that
		// the surviving 'b' carries no movedFrom even though 'a' going away
		// shifted its raw index.
		expect(diff.senses[0].examples).toEqual([
			{status: 'removed', runs: [{text: 'a', mark: 'removed'}]},
			{status: 'same', runs: [{text: 'b', mark: 'same'}]},
		])
	})

	it('numbers every depth of a sense that arrived as a whole subtree', () => {
		let before = twoSenses()
		let after = addSubsense(addSense(before), '3')
		let diff = diffEntry(before, after)

		let added = diff.senses[2]
		expect(added.status).toBe('added')
		expect(added.number).toBe(3)
		expect(added.subsenses[0].status).toBe('added')
		expect(added.subsenses[0].number).toBe(1)
	})

	it('splices a removed example back where it was, rather than collecting it at the end', () => {
		let before = startDraft(
			normalizeEntry({word: 'x', senses: [{definition: 'd', examples: ['a', 'b', 'c']}]}),
		)
		let after = deleteExample(before, before.senses[0].id, before.senses[0].examples[0].id)
		let diff = diffEntry(before, after)

		expect(diff.senses[0].examples.map((e) => e.status)).toEqual(['removed', 'same', 'same'])
		expect(diff.senses[0].examples.map((e) => e.runs[0]?.text)).toEqual(['a', 'b', 'c'])
	})

	it('diffs headword, pronunciation and part of speech independently, not swapped', () => {
		let before = startDraft(
			normalizeEntry({word: 'w', pronunciation: 'WORD', partOfSpeech: 'noun', definition: 'd'}),
		)
		let after = {...before, word: 'ward', pronunciation: 'WERD', partOfSpeech: 'verb'}
		let diff = diffEntry(before, after)

		expect(diff.word).toEqual(diffWords('w', 'ward'))
		expect(diff.pronunciation).toEqual(diffWords('WORD', 'WERD'))
		expect(diff.partOfSpeech).toEqual(diffWords('noun', 'verb'))
	})
})
