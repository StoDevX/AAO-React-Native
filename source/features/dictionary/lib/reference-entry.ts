import type {WordType} from '../types'

/**
 * A copy of the iOS dictionary's own entry for "change", used to compare our
 * sheet against a screenshot of Apple's side by side.
 *
 * Campus entries are a headword and a paragraph, so none of them exercises
 * phonetics, a part of speech, grammar labels, several citations and nested
 * sub-senses at once — the arrangement the sheet is designed around. This one
 * does, which is what makes the two screenshots comparable.
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
			grammar: 'with object',
			definition: 'make (someone or something) different; alter or modify',
			examples: [
				'both parties voted against proposals to change the law',
				'technology and the internet have dramatically changed the way we communicate',
				"fame hasn't changed her one bit.",
			],
			subsenses: [
				{
					grammar: 'no object',
					definition: 'become different; be altered or modified',
					examples: [
						"I've had time to think and my opinion hasn't changed",
						'the Virginia creeper was just beginning to change from green to gold.',
					],
				},
				{
					grammar: 'with object',
					definition: 'turn or convert (something) from one state, form or condition into another',
					examples: ['the fairy changed the frog into a prince'],
				},
			],
		},
	],
}
