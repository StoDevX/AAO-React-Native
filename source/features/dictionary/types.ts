/** One numbered sense of an entry, as the iOS dictionary lays them out. */
export type Sense = {
	/**
	 * How the word is used in this sense — "with object", "no object". Set in
	 * brackets and italic ahead of the definition, the way a dictionary marks
	 * grammar.
	 */
	grammar?: string
	definition: string
	/**
	 * Citations. A dictionary runs them on after the definition and divides
	 * them with a vertical bar rather than giving each its own line.
	 */
	examples?: string[]
	/** Senses under this one, drawn against a bullet rather than a number. */
	subsenses?: Sense[]
}

/**
 * An entry exactly as the server sends it. `definition` is the original
 * single-block form; `senses` is the structured form. The schema requires
 * exactly one of them, so consumers should read a `NormalizedEntry` instead.
 */
export type WordType = {
	word: string
	pronunciation?: string
	partOfSpeech?: string
	definition?: string
	senses?: Sense[]
}

/** An entry with one shape, whichever form the YAML used. */
export type NormalizedEntry = {
	word: string
	pronunciation?: string
	partOfSpeech?: string
	senses: Sense[]
}

export interface DictionaryGroup {
	title: string
	data: NormalizedEntry[]
}
