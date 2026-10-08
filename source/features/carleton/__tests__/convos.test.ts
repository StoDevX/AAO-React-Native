import {describe, expect, test} from '@jest/globals'

import {toArchivedConvos} from '../convos'

function episode(overrides: Partial<Parameters<typeof toArchivedConvos>[0][number]> = {}) {
	return {
		title: 'Carleton Convo with Someone | October 2, 2026',
		description: 'A talk.',
		pubDate: '2026-10-06T13:59:46.000Z',
		enclosure: {url: 'https://example.com/a.mp3', type: 'audio/mpeg', length: '1'},
		...overrides,
	}
}

describe('toArchivedConvos', () => {
	test('lists the newest recording first', () => {
		let convos = toArchivedConvos([
			episode({pubDate: '2026-04-24T00:00:00.000Z', title: 'Older'}),
			episode({pubDate: '2026-10-02T00:00:00.000Z', title: 'Newer'}),
		])

		expect(convos.map((convo) => convo.title)).toEqual(['Newer', 'Older'])
	})

	test('leaves out an episode with no recording to open', () => {
		let convos = toArchivedConvos([
			episode({title: 'No enclosure', enclosure: null}),
			episode({
				title: 'Empty URL',
				enclosure: {url: '', type: 'audio/mpeg', length: '1'},
			}),
			episode({title: 'Kept'}),
		])

		expect(convos.map((convo) => convo.title)).toEqual(['Kept'])
	})

	test('leaves out an episode whose date cannot be read', () => {
		expect(toArchivedConvos([episode({pubDate: 'not a date'})])).toEqual([])
	})

	test('tells a video recording from an audio one', () => {
		let [video, audio] = toArchivedConvos([
			episode({
				pubDate: '2026-10-02T00:00:00.000Z',
				enclosure: {url: 'https://example.com/v.mp4', type: 'video/mp4', length: '1'},
			}),
			episode({pubDate: '2026-10-01T00:00:00.000Z'}),
		])

		expect(video?.isVideo).toBe(true)
		expect(audio?.isVideo).toBe(false)
	})
})
