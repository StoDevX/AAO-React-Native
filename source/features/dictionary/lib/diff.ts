import type {DraftEntry, DraftSense} from './draft'

export type Mark = 'same' | 'added' | 'removed'

/** A stretch of text sharing one mark, as the diff view draws it. */
export type Run = {text: string; mark: Mark}

export type DiffStatus = 'same' | 'changed' | 'added' | 'removed'

/// Words, each carrying the whitespace that follows it, so joining the runs
/// back together reproduces the original string.
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

/// Every run marked one way, for a sense that arrived whole or left whole. An
/// empty field stays an empty array under every mark, so "never had one" and
/// "arrived/left empty" both read the same way a filled field would if it had
/// been cleared out entirely by the edit.
const wholly = (text: string, mark: Mark): Run[] => (text ? [{text, mark}] : [])

function diffExamples(
	before: DraftSense['examples'],
	after: DraftSense['examples'],
): DiffedExample[] {
	let byId = new Map(before.map((example, index) => [example.id, {example, index}]))

	let kept = after.map((example, position): DiffedExample => {
		let previous = byId.get(example.id)
		if (!previous) {
			return {status: 'added', runs: wholly(example.text, 'added')}
		}

		let runs = diffWords(previous.example.text, example.text)
		let changed = !allSame(runs)

		return {
			status: changed ? 'changed' : 'same',
			// Only when the text held still. If it changed too, the word-level
			// marks already say so and a caption is noise.
			...(!changed && previous.index !== position ? {movedFrom: previous.index + 1} : {}),
			runs,
		}
	})

	let removed = before
		.filter((example) => !after.some((e) => e.id === example.id))
		.map((example): DiffedExample => ({status: 'removed', runs: wholly(example.text, 'removed')}))

	return [...kept, ...removed]
}

/// A sense the reader never touched, drawn as it stands.
function unchangedSense(sense: DraftSense, mark: Mark): DiffedSense {
	return {
		status: mark === 'added' ? 'added' : 'removed',
		grammar: wholly(sense.grammar, mark),
		definition: wholly(sense.definition, mark),
		examples: sense.examples.map((example) => ({
			status: mark === 'added' ? 'added' : 'removed',
			runs: wholly(example.text, mark),
		})),
		subsenses: sense.subsenses.map((subsense) => unchangedSense(subsense, mark)),
	}
}

/**
 * Merges two sense lists into the order a diff reads in: the new order, with
 * each removed sense spliced back beside the neighbour it actually had.
 *
 * Walking `before` left to right and tracking where the last-seen sense (kept
 * or already-spliced-back) ended up in `merged` handles a run of several
 * deletions in their original relative order, and — unlike re-indexing a
 * removed sense against its raw original position — still lands it next to
 * its true neighbour once that neighbour has itself moved.
 */
function diffSenses(before: DraftSense[], after: DraftSense[]): DiffedSense[] {
	let byId = new Map(before.map((sense, index) => [sense.id, {sense, index}]))

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

		return {
			status: changed ? 'changed' : 'same',
			number: position + 1,
			...(previous.index !== position ? {movedFrom: previous.index + 1} : {}),
			grammar,
			definition,
			examples,
			subsenses,
		}
	})

	let merged = [...kept]
	let mergedIds = after.map((sense) => sense.id)
	let insertAfter = -1

	for (let sense of before) {
		let survivorIndex = mergedIds.indexOf(sense.id)
		if (survivorIndex !== -1) {
			insertAfter = survivorIndex
			continue
		}

		let at = insertAfter + 1
		merged.splice(at, 0, unchangedSense(sense, 'removed'))
		mergedIds.splice(at, 0, sense.id)
		insertAfter = at
	}

	return merged
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
