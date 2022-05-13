export type WordType = {
	word: string
	definition: string
}

export interface DiciontaryGroup {
	title: string
	data: WordType[]
}
