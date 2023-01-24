export type WordType = {
	word: string
	definition: string
}

export interface DictionaryGroup {
	title: string
	data: WordType[]
}
