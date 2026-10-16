import {describe, expect, test} from '@jest/globals'

import {captionPanelStatus} from '../caption-status'

const WAITING = {symbol: 'captions.bubble', text: 'Captions appear when someone speaks'}

describe('captionPanelStatus', () => {
	// Starting up, reconnecting and music all come and go
	// while captions are on; none is worth a word over lines already shown.
	test.each([
		['captioning', {kind: 'captioning'}],
		['music', {kind: 'music'}],
		['downloading', {kind: 'downloading'}],
		['reconnecting', {kind: 'reconnecting'}],
		['no word yet from the engine', null],
	] as const)('%s: says nothing over lines', (_name, engine) => {
		expect(captionPanelStatus({engine, hasLines: true})).toEqual({
			line: null,
			empty: null,
		})
	})

	test.each([
		['captioning', {kind: 'captioning'}],
		['music', {kind: 'music'}],
		['downloading', {kind: 'downloading'}],
		['reconnecting', {kind: 'reconnecting'}],
		['no word yet from the engine', null],
	] as const)('%s: waits for speech in the empty view, never a top line', (_name, engine) => {
		expect(captionPanelStatus({engine, hasLines: false})).toEqual({
			line: null,
			empty: WAITING,
		})
	})

	test('says why captions are unavailable: a top line over lines, the empty view without', () => {
		let engine = {kind: 'unavailable', reason: 'No model'} as const
		expect(captionPanelStatus({engine, hasLines: true})).toEqual({
			line: {text: 'No model', spoken: 'No model'},
			empty: null,
		})
		expect(captionPanelStatus({engine, hasLines: false})).toEqual({
			line: null,
			empty: {symbol: 'exclamationmark.circle', text: 'No model'},
		})
	})
})
