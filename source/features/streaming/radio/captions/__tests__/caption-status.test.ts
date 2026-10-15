import {captionStatus} from '../caption-status'

describe('captionStatus', () => {
	test('shows nothing while captioning', () => {
		expect(captionStatus({kind: 'captioning'}, true)).toBeNull()
	})
	test('says music is playing', () => {
		expect(captionStatus({kind: 'music'}, true)?.text).toBe('Music')
	})
	test('says why captions are unavailable', () => {
		expect(captionStatus({kind: 'unavailable', reason: 'No model'}, false)?.text).toBe('No model')
	})
	test('waits for a first line', () => {
		expect(captionStatus({kind: 'captioning'}, false)?.text).toBe('Listening for speech…')
	})
	test('names the model download', () => {
		expect(captionStatus({kind: 'downloading'}, false)?.text).toBe('Getting captions ready…')
	})
	test('names a lost stream', () => {
		expect(captionStatus({kind: 'reconnecting'}, true)?.text).toBe('Reconnecting…')
	})
})
