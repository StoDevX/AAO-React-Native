import type {WordType} from '../types'

/**
 * A copy of the iOS dictionary's own entry for "change", used to compare our
 * sheet against a screenshot of Apple's side by side.
 *
 * Campus entries are a headword and a paragraph, so none of them exercises
 * phonetics, a part of speech and several numbered senses with citations at
 * once — the arrangement the sheet is designed around. This one does, which is
 * what makes the two screenshots comparable.
 *
 * Reachable only under `--uitesting`. It is not campus vocabulary and must
 * never reach the shipping list.
 */
export const REFERENCE_ENTRY: WordType = {
	word: 'change',
	pronunciation: 'CHānj',
	partOfSpeech: 'verb',
	senses: [
		{
			definition: 'make (someone or something) different; alter or modify',
			example: 'both parties voted against proposals to change the law.',
		},
		{
			definition: 'become different; be altered or modified',
			example: "I've had time to think and my opinion hasn't changed.",
		},
	],
}
