import {describe, expect, test} from '@jest/globals'

import {captionPanelStatus} from '../caption-status'

const SPEAK = {symbol: 'captions.bubble', text: 'Captions appear when someone speaks'}

describe('captionPanelStatus', () => {
	test('says nothing while captioning or on music, with lines to show', () => {
		for (let kind of ['captioning', 'music'] as const) {
			expect(captionPanelStatus({engine: {kind}, running: true, hasLines: true})).toEqual({
				line: null,
				empty: null,
			})
		}
	})

	test('invites speech in the empty view, never a top line, while captioning or on music', () => {
		for (let kind of ['captioning', 'music'] as const) {
			expect(captionPanelStatus({engine: {kind}, running: true, hasLines: false})).toEqual({
				line: null,
				empty: SPEAK,
			})
		}
	})

	test.each([
		['downloading', {kind: 'downloading'}, 'Getting captions ready…', 'arrow.down.circle'],
		['no word yet from the engine', null, 'Getting captions ready…', 'arrow.down.circle'],
		['reconnecting', {kind: 'reconnecting'}, 'Reconnecting…', 'wifi.exclamationmark'],
		[
			'unavailable',
			{kind: 'unavailable', reason: 'No model'},
			'No model',
			'exclamationmark.circle',
		],
	] as const)(
		'%s: a top line over lines, the empty view without',
		(_name, engine, text, symbol) => {
			expect(captionPanelStatus({engine, running: true, hasLines: true})).toEqual({
				line: {text, spoken: text},
				empty: null,
			})
			expect(captionPanelStatus({engine, running: true, hasLines: false})).toEqual({
				line: null,
				empty: {symbol, text},
			})
		},
	)

	test('says the captions wait for the station while not running, whatever the engine last said', () => {
		let text = 'Captions resume when the station plays'

		expect(
			captionPanelStatus({engine: {kind: 'captioning'}, running: false, hasLines: true}),
		).toEqual({
			line: {text, spoken: text},
			empty: null,
		})
		expect(captionPanelStatus({engine: {kind: 'music'}, running: false, hasLines: false})).toEqual({
			line: null,
			empty: {symbol: 'pause.circle', text},
		})
	})
})
