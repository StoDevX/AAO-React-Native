/** One numbered sense of an entry, as the iOS dictionary lays them out. */
export type Sense = {
	definition: string
	example?: string
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
