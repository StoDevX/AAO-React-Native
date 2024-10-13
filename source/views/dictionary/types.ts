export interface WordType {
	word: string
	definition: string
}

export interface DictionaryGroup {
	title: string
	data: WordType[]
}
