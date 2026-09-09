import type {NormalizedEntry, Sense, WordType} from '../types'

export type DraftExample = {id: string; text: string}

/** One sense as the form holds it: every optional field present, and an id. */
export type DraftSense = {
	id: string
	grammar: string
	definition: string
	examples: DraftExample[]
	subsenses: DraftSense[]
}

/**
 * An entry as the form holds it. Optional fields are `''` and `[]` rather than
 * absent — a TextField needs a string, and branching on undefined at every
 * field is where empty-versus-absent bugs start. `normalizeDraft` converts
 * back on the way out.
 */
export type DraftEntry = {
	word: string
	pronunciation: string
	partOfSpeech: string
	senses: DraftSense[]
}

/**
 * The draft of an entry as first opened, with an id on every sense and
 * example.
 *
 * Ids are assigned in reading order from a counter, so the same entry always
 * yields the same draft. The diff relies on that: it compares this pristine
 * draft against the edited one and matches by id, which is only sound because
 * both were numbered the same way.
 */
export function startDraft(entry: NormalizedEntry): DraftEntry {
	let next = 1
	let take = (): string => String(next++)

	let sense = (source: Sense): DraftSense => {
		// Order matters: the sense's own id, then its examples, then the senses
		// under it -- the order a reader meets them.
		let id = take()
		let examples = (source.examples ?? []).map((text) => ({id: take(), text}))
		return {
			id,
			grammar: source.grammar ?? '',
			definition: source.definition,
			examples,
			subsenses: (source.subsenses ?? []).map(sense),
		}
	}

	return {
		word: entry.word,
		pronunciation: entry.pronunciation ?? '',
		partOfSpeech: entry.partOfSpeech ?? '',
		senses: entry.senses.map(sense),
	}
}

/// A sense with nothing but a definition, which is how every shipped entry is
/// written and so the shape a suggestion should keep.
function isBare(sense: Sense): boolean {
	return (
		sense.grammar === undefined && sense.examples === undefined && sense.subsenses === undefined
	)
}

function toSense(draft: DraftSense): Sense | null {
	let definition = draft.definition.trim()
	if (!definition) {
		return null
	}

	let grammar = draft.grammar.trim()
	let examples = draft.examples.map((e) => e.text.trim()).filter(Boolean)
	let subsenses = draft.subsenses.map(toSense).filter((s): s is Sense => s !== null)

	return {
		...(grammar ? {grammar} : {}),
		definition,
		...(examples.length ? {examples} : {}),
		...(subsenses.length ? {subsenses} : {}),
	}
}

/**
 * The draft as the server's schema writes it: trimmed, with empty fields
 * dropped.
 *
 * A single sense carrying nothing but a definition collapses back to
 * `definition:`. Every entry in `data/dictionary` is written that way, and a
 * maintainer reading the emailed diff should not find a schema change sitting
 * on top of the edit they were actually sent.
 */
export function normalizeDraft(draft: DraftEntry): WordType {
	let senses = draft.senses.map(toSense).filter((s): s is Sense => s !== null)

	let head = {
		word: draft.word.trim(),
		...(draft.pronunciation.trim() ? {pronunciation: draft.pronunciation.trim()} : {}),
		...(draft.partOfSpeech.trim() ? {partOfSpeech: draft.partOfSpeech.trim()} : {}),
	}

	if (senses.length === 1 && isBare(senses[0])) {
		return {...head, definition: senses[0].definition}
	}

	return {...head, senses}
}

/// Every id the draft holds, senses and examples alike. One namespace, so an
/// id identifies a sense at any depth without a path.
function idsOf(draft: DraftEntry): string[] {
	let walk = (sense: DraftSense): string[] => [
		sense.id,
		...sense.examples.map((e) => e.id),
		...sense.subsenses.flatMap(walk),
	]
	return draft.senses.flatMap(walk)
}

/// One past the largest id in use. Derived from the draft rather than held in
/// module state, so the functions here stay pure and their tests stay
/// deterministic.
function nextId(draft: DraftEntry): string {
	let highest = idsOf(draft).reduce((max, id) => Math.max(max, Number(id) || 0), 0)
	return String(highest + 1)
}

/// Rebuilds the sense tree, replacing whichever sense `id` names.
function mapSense(
	senses: DraftSense[],
	id: string,
	change: (sense: DraftSense) => DraftSense,
): DraftSense[] {
	return senses.map((sense) =>
		sense.id === id ? change(sense) : {...sense, subsenses: mapSense(sense.subsenses, id, change)},
	)
}

function moved<T>(items: T[], from: number, to: number): T[] {
	let next = [...items]
	let [item] = next.splice(from, 1)
	next.splice(to, 0, item)
	return next
}

export function findSense(draft: DraftEntry, id: string): DraftSense | undefined {
	let walk = (senses: DraftSense[]): DraftSense | undefined => {
		for (let sense of senses) {
			if (sense.id === id) {
				return sense
			}
			let found = walk(sense.subsenses)
			if (found) {
				return found
			}
		}
		return undefined
	}
	return walk(draft.senses)
}

export function setSenseField(
	draft: DraftEntry,
	id: string,
	patch: {grammar?: string; definition?: string},
): DraftEntry {
	return {...draft, senses: mapSense(draft.senses, id, (sense) => ({...sense, ...patch}))}
}

const blankSense = (id: string): DraftSense => ({
	id,
	grammar: '',
	definition: '',
	examples: [],
	subsenses: [],
})

export function addSense(draft: DraftEntry): DraftEntry {
	return {...draft, senses: [...draft.senses, blankSense(nextId(draft))]}
}

export function addSubsense(draft: DraftEntry, parentId: string): DraftEntry {
	let id = nextId(draft)
	return {
		...draft,
		senses: mapSense(draft.senses, parentId, (sense) => ({
			...sense,
			subsenses: [...sense.subsenses, blankSense(id)],
		})),
	}
}

export function deleteSense(draft: DraftEntry, id: string): DraftEntry {
	let prune = (senses: DraftSense[]): DraftSense[] =>
		senses
			.filter((sense) => sense.id !== id)
			.map((sense) => ({...sense, subsenses: prune(sense.subsenses)}))

	return {...draft, senses: prune(draft.senses)}
}

export function moveSense(
	draft: DraftEntry,
	parentId: string | null,
	from: number,
	to: number,
): DraftEntry {
	if (parentId === null) {
		return {...draft, senses: moved(draft.senses, from, to)}
	}

	return {
		...draft,
		senses: mapSense(draft.senses, parentId, (sense) => ({
			...sense,
			subsenses: moved(sense.subsenses, from, to),
		})),
	}
}

export function addExample(draft: DraftEntry, senseId: string): DraftEntry {
	let id = nextId(draft)
	return {
		...draft,
		senses: mapSense(draft.senses, senseId, (sense) => ({
			...sense,
			examples: [...sense.examples, {id, text: ''}],
		})),
	}
}

export function setExampleText(
	draft: DraftEntry,
	senseId: string,
	exampleId: string,
	text: string,
): DraftEntry {
	return {
		...draft,
		senses: mapSense(draft.senses, senseId, (sense) => ({
			...sense,
			examples: sense.examples.map((e) => (e.id === exampleId ? {...e, text} : e)),
		})),
	}
}

export function deleteExample(draft: DraftEntry, senseId: string, exampleId: string): DraftEntry {
	return {
		...draft,
		senses: mapSense(draft.senses, senseId, (sense) => ({
			...sense,
			examples: sense.examples.filter((e) => e.id !== exampleId),
		})),
	}
}

export function moveExample(
	draft: DraftEntry,
	senseId: string,
	from: number,
	to: number,
): DraftEntry {
	return {
		...draft,
		senses: mapSense(draft.senses, senseId, (sense) => ({
			...sense,
			examples: moved(sense.examples, from, to),
		})),
	}
}
