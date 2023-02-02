export type RawWordType = {
	word: string
	definition: string
}

export type WordType = {
	word: string
	definition: string
	key: string
	firstLetter: string
}

export interface DictionaryGroup {
	title: string
	data: WordType[]
}
