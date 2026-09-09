import type {DraftEntry, DraftSense} from './draft'

export type Mark = 'same' | 'added' | 'removed'

/** A stretch of text sharing one mark, as the diff view draws it. */
export type Run = {text: string; mark: Mark}

export type DiffStatus = 'same' | 'changed' | 'added' | 'removed'

/// Words, each carrying the whitespace that follows it, so joining the runs
/// back together reproduces the string except for whitespace before the
/// first word -- dictionary text never leads with a space, so that gap never
/// comes up in practice.
function tokenize(text: string): string[] {
	return text.match(/\S+\s*/gu) ?? []
}

/// The length of the longest common subsequence of every prefix pair. A
/// definition runs to a few dozen words, so the quadratic table costs nothing
/// and reads far more plainly than Myers.
function lcsTable(before: string[], after: string[]): number[][] {
	let table = Array.from({length: before.length + 1}, () =>
		Array.from({length: after.length + 1}, () => 0),
	)

	for (let i = before.length - 1; i >= 0; i--) {
		for (let j = after.length - 1; j >= 0; j--) {
			table[i][j] =
				before[i] === after[j]
					? table[i + 1][j + 1] + 1
					: Math.max(table[i + 1][j], table[i][j + 1])
		}
	}

	return table
}

/// Appends to the last run when the mark matches, so a stretch of changed
/// words draws as one span rather than one per word.
function push(runs: Run[], text: string, mark: Mark): void {
	let last = runs[runs.length - 1]
	if (last && last.mark === mark) {
		last.text += text
		return
	}
	runs.push({text, mark})
}

/**
 * `before` and `after` as one sequence of marked runs, split at word
 * boundaries. A replaced word reads as its deletion followed by its
 * insertion — SwiftUI has no way to draw one span as both.
 */
export function diffWords(before: string, after: string): Run[] {
	let a = tokenize(before)
	let b = tokenize(after)
	let table = lcsTable(a, b)

	let runs: Run[] = []
	let i = 0
	let j = 0

	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			push(runs, a[i], 'same')
			i++
			j++
		} else if (table[i + 1][j] >= table[i][j + 1]) {
			push(runs, a[i], 'removed')
			i++
		} else {
			push(runs, b[j], 'added')
			j++
		}
	}

	while (i < a.length) {
		push(runs, a[i++], 'removed')
	}
	while (j < b.length) {
		push(runs, b[j++], 'added')
	}

	return runs
}

/** One citation, and what became of it. */
export type DiffedExample = {status: DiffStatus; movedFrom?: number; runs: Run[]}

/**
 * One sense, and what became of it.
 *
 * `number` is the position a reader will see it at, and is absent for a sense
 * that was removed — a removed sense keeping its old number would put two of
 * the same number on screen a line apart.
 *
 * `status` never reflects motion by itself: a sense (or an example, or a
 * subsense) that only moved keeps `status: 'same'` and carries the move in
 * `movedFrom` instead. That means a sense whose subsenses were only
 * reordered is itself still `'same'` too, even though something under it
 * changed position — do not read `'same'` as "nothing happened here or
 * below."
 */
export type DiffedSense = {
	status: DiffStatus
	movedFrom?: number
	number?: number
	grammar: Run[]
	definition: Run[]
	examples: DiffedExample[]
	subsenses: DiffedSense[]
}

export type DiffedEntry = {
	word: Run[]
	pronunciation: Run[]
	partOfSpeech: Run[]
	senses: DiffedSense[]
}

const allSame = (runs: Run[]): boolean => runs.every((run) => run.mark === 'same')

/// Every run marked one way, for a field that arrived or left with content.
/// Empty text stays `[]` under any mark: that is the "never had one" case. A
/// field that held text and was cleared goes through diffWords instead, so
/// clearing shows up as non-empty `removed` runs, not as this empty array —
/// that distinction is what a reader needs to tell "no grammar" from
/// "grammar was removed."
const wholly = (text: string, mark: Mark): Run[] => (text ? [{text, mark}] : [])

/// Ranks, within each list, of only the ids the two lists share. Comparing
/// these ranks — rather than raw index — tells whether an item actually
/// moved relative to its still-present neighbours, as opposed to merely
/// shifting because something else was added or removed above it.
function survivorRanks<T extends {id: string}>(
	before: T[],
	after: T[],
): {rankBefore: Map<string, number>; rankAfter: Map<string, number>} {
	let beforeIds = new Set(before.map((item) => item.id))
	let afterIds = new Set(after.map((item) => item.id))

	let rank = (list: T[], keep: (id: string) => boolean): Map<string, number> => {
		let ranks = new Map<string, number>()
		let next = 0
		for (let item of list) {
			if (keep(item.id)) {
				ranks.set(item.id, next++)
			}
		}
		return ranks
	}

	return {
		rankBefore: rank(before, (id) => afterIds.has(id)),
		rankAfter: rank(after, (id) => beforeIds.has(id)),
	}
}

/**
 * Splices removed items back into the kept/added list: each removed item
 * renders right after whichever item preceded it in the original list (or
 * first, if nothing did), so a run of several removals keeps its original
 * order.
 *
 * This is a heuristic, not the one true ordering. When a removal combines
 * with a reorder, the item that preceded it can itself have moved, so a
 * removed item follows its predecessor to its new spot rather than staying
 * between its two original neighbours. That reads right when the successor
 * also stayed put, but can wedge a removed *last* item between a moved
 * predecessor and whatever now follows it, instead of leaving it at the end
 * — see the "wedges a deleted last sense" test in diff.test.ts. No ordering
 * this produces is incoherent to a reader; this is simply the trade-off this
 * implementation picked.
 */
function spliceRemovals<Before extends {id: string}, Kept>(
	before: Before[],
	after: Before[],
	kept: Kept[],
	toRemoved: (item: Before) => Kept,
): Kept[] {
	let merged = [...kept]
	let mergedIds = after.map((item) => item.id)
	let insertAfter = -1

	for (let item of before) {
		let survivorIndex = mergedIds.indexOf(item.id)
		if (survivorIndex !== -1) {
			insertAfter = survivorIndex
			continue
		}

		let at = insertAfter + 1
		merged.splice(at, 0, toRemoved(item))
		mergedIds.splice(at, 0, item.id)
		insertAfter = at
	}

	return merged
}

function diffExamples(
	before: DraftSense['examples'],
	after: DraftSense['examples'],
): DiffedExample[] {
	let byId = new Map(before.map((example, index) => [example.id, {example, index}]))
	let {rankBefore, rankAfter} = survivorRanks(before, after)

	let kept = after.map((example): DiffedExample => {
		let previous = byId.get(example.id)
		if (!previous) {
			return {status: 'added', runs: wholly(example.text, 'added')}
		}

		let runs = diffWords(previous.example.text, example.text)
		let changed = !allSame(runs)
		let moved = rankBefore.get(example.id) !== rankAfter.get(example.id)

		return {
			status: changed ? 'changed' : 'same',
			// Only when the text held still. If it changed too, the word-level
			// marks already say so and a caption is noise.
			...(!changed && moved ? {movedFrom: previous.index + 1} : {}),
			runs,
		}
	})

	return spliceRemovals(before, after, kept, (example) => ({
		status: 'removed',
		runs: wholly(example.text, 'removed'),
	}))
}

/// A sense the reader never touched, drawn as it stands. An added sense is
/// numbered at every depth, the same as any other added sense would be —
/// Task 6 renders a numbered outline regardless of depth. A removed sense
/// stays unnumbered at every depth: see `DiffedSense`'s docstring for why.
function unchangedSense(sense: DraftSense, mark: Mark): DiffedSense {
	return {
		status: mark === 'added' ? 'added' : 'removed',
		grammar: wholly(sense.grammar, mark),
		definition: wholly(sense.definition, mark),
		examples: sense.examples.map((example) => ({
			status: mark === 'added' ? 'added' : 'removed',
			runs: wholly(example.text, mark),
		})),
		subsenses: sense.subsenses.map((subsense, index) => ({
			...unchangedSense(subsense, mark),
			...(mark === 'added' ? {number: index + 1} : {}),
		})),
	}
}

function diffSenses(before: DraftSense[], after: DraftSense[]): DiffedSense[] {
	let byId = new Map(before.map((sense, index) => [sense.id, {sense, index}]))
	let {rankBefore, rankAfter} = survivorRanks(before, after)

	let kept = after.map((sense, position): DiffedSense => {
		let previous = byId.get(sense.id)
		if (!previous) {
			return {...unchangedSense(sense, 'added'), number: position + 1}
		}

		let grammar = diffWords(previous.sense.grammar, sense.grammar)
		let definition = diffWords(previous.sense.definition, sense.definition)
		let examples = diffExamples(previous.sense.examples, sense.examples)
		let subsenses = diffSenses(previous.sense.subsenses, sense.subsenses)

		let changed =
			!allSame(grammar) ||
			!allSame(definition) ||
			examples.some((e) => e.status !== 'same') ||
			subsenses.some((s) => s.status !== 'same')

		let moved = rankBefore.get(sense.id) !== rankAfter.get(sense.id)

		return {
			status: changed ? 'changed' : 'same',
			number: position + 1,
			...(moved ? {movedFrom: previous.index + 1} : {}),
			grammar,
			definition,
			examples,
			subsenses,
		}
	})

	return spliceRemovals(before, after, kept, (sense) => unchangedSense(sense, 'removed'))
}

/**
 * What a suggestion would change, annotated for the preview screen.
 *
 * Both sides are drafts so that senses and examples can be matched by id
 * rather than by content — a heavily-edited sense would otherwise read as a
 * deletion plus an addition. Pass `startDraft(original)` as `before`: it
 * numbers a given entry the same way every time, so the ids line up.
 */
export function diffEntry(before: DraftEntry, after: DraftEntry): DiffedEntry {
	return {
		word: diffWords(before.word, after.word),
		pronunciation: diffWords(before.pronunciation, after.pronunciation),
		partOfSpeech: diffWords(before.partOfSpeech, after.partOfSpeech),
		senses: diffSenses(before.senses, after.senses),
	}
}
