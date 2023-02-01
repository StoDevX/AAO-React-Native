export type WordType = {
	word: string
	definition: string
	key: string
}

export interface DictionaryGroup {
	title: string
	data: WordType[]
}
