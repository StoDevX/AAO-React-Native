import {describe, expect, it} from '@jest/globals'
import {bodyParts} from '../prose'
import type {Block} from '../../types'

const FIGURE: Block = {
	type: 'figure',
	url: 'https://x.test/a.jpg',
	width: 3,
	height: 2,
	caption: 'A',
}
const EMBED: Block = {type: 'embed', url: 'https://x.test/player'}

function paragraph(text: string): Block {
	return {type: 'paragraph', runs: [{text}]}
}

describe('bodyParts', () => {
	it('draws consecutive paragraphs as one stretch of prose', () => {
		expect(bodyParts([paragraph('One.'), paragraph('Two.')], {opens: false})).toEqual([
			{kind: 'prose', paragraphs: [{runs: [{text: 'One.'}]}, {runs: [{text: 'Two.'}]}]},
		])
	})

	it('ends a stretch at a figure, and starts another after it', () => {
		let parts = bodyParts([paragraph('One.'), FIGURE, paragraph('Two.')], {opens: false})
		expect(parts).toEqual([
			{kind: 'prose', paragraphs: [{runs: [{text: 'One.'}]}]},
			{kind: 'block', block: FIGURE},
			{kind: 'prose', paragraphs: [{runs: [{text: 'Two.'}]}]},
		])
	})

	it('ends a stretch at an embed', () => {
		let parts = bodyParts([paragraph('One.'), EMBED, paragraph('Two.')], {opens: false})
		expect(parts.map((part) => part.kind)).toEqual(['prose', 'block', 'prose'])
	})

	it('keeps neighbouring figures apart, with no empty stretch between them', () => {
		expect(bodyParts([FIGURE, FIGURE], {opens: false})).toEqual([
			{kind: 'block', block: FIGURE},
			{kind: 'block', block: FIGURE},
		])
	})

	it('draws nothing for an empty body', () => {
		expect(bodyParts([], {opens: true})).toEqual([])
	})

	it('keeps a quote in the stretch, italic and indented', () => {
		let parts = bodyParts(
			[paragraph('Said:'), {type: 'quote', runs: [{text: 'Words.'}]}, paragraph('After.')],
			{opens: false},
		)
		expect(parts).toEqual([
			{
				kind: 'prose',
				paragraphs: [
					{runs: [{text: 'Said:'}]},
					{runs: [{text: 'Words.'}], italic: true, indent: 16},
					{runs: [{text: 'After.'}]},
				],
			},
		])
	})

	it('keeps a list in the stretch, an item to a paragraph, each hung after its marker', () => {
		let parts = bodyParts(
			[
				{type: 'list', ordered: false, items: [[{text: 'Eggs'}], [{text: 'Milk'}]]},
				{type: 'list', ordered: true, items: [[{text: 'Stir'}], [{text: 'Bake'}]]},
			],
			{opens: false},
		)
		expect(parts).toEqual([
			{
				kind: 'prose',
				paragraphs: [
					{runs: [{text: 'Eggs'}], marker: '•', spacingAfter: 6},
					{runs: [{text: 'Milk'}], marker: '•'},
					{runs: [{text: 'Stir'}], marker: '1.', spacingAfter: 6},
					{runs: [{text: 'Bake'}], marker: '2.'},
				],
			},
		])
	})

	it("sets the story's first paragraph's opening words in small caps", () => {
		let parts = bodyParts([paragraph('The petition was delivered on Tuesday.')], {opens: true})
		expect(parts).toEqual([
			{
				kind: 'prose',
				paragraphs: [
					{runs: [{text: 'The petition was delivered', smallCaps: true}, {text: ' on Tuesday.'}]},
				],
			},
		])
	})

	it('opens on the first paragraph even when a figure comes before it', () => {
		let parts = bodyParts([FIGURE, paragraph('First words here now.'), paragraph('Later.')], {
			opens: true,
		})
		expect(parts[1]).toEqual({
			kind: 'prose',
			paragraphs: [
				{runs: [{text: 'First words here now.', smallCaps: true}]},
				{runs: [{text: 'Later.'}]},
			],
		})
	})

	it('sets no opening in a quote that comes before the first paragraph', () => {
		let parts = bodyParts([{type: 'quote', runs: [{text: 'A quote.'}]}, paragraph('Then.')], {
			opens: true,
		})
		expect(parts).toEqual([
			{
				kind: 'prose',
				paragraphs: [
					{runs: [{text: 'A quote.'}], italic: true, indent: 16},
					{runs: [{text: 'Then.', smallCaps: true}]},
				],
			},
		])
	})

	it('sets no opening when the body does not open the story', () => {
		let parts = bodyParts([paragraph('Some words.')], {opens: false})
		expect(parts).toEqual([{kind: 'prose', paragraphs: [{runs: [{text: 'Some words.'}]}]}])
	})

	it('links a bare URL in a paragraph, a quote and a list item', () => {
		let url = 'https://x.test/a'
		let parts = bodyParts(
			[
				paragraph(`See ${url}.`),
				{type: 'quote', runs: [{text: url}]},
				{type: 'list', ordered: false, items: [[{text: url, italic: true}]]},
			],
			{opens: false},
		)
		expect(parts).toEqual([
			{
				kind: 'prose',
				paragraphs: [
					{runs: [{text: 'See '}, {text: url, href: url}, {text: '.'}]},
					{runs: [{text: url, href: url}], italic: true, indent: 16},
					{runs: [{text: url, italic: true, href: url}], marker: '•'},
				],
			},
		])
	})
})
