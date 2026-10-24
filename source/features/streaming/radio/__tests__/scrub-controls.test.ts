import {describe, expect, jest, test} from '@jest/globals'
import {
	customRendererOwnsOutput,
	scrubControlsAvailable,
	useScrubPlayback,
} from '../use-radio-scrub'

jest.mock('@frogpond/radio-scrub', () => ({radioScrub: null}))

describe('DJ control availability', () => {
	let ready = {
		...useScrubPlayback.getState(),
		stationId: 'krlx',
		controlsAvailable: true,
		ready: true,
		bufferSeconds: 1,
	}

	test('only allows the attached station with a usable native buffer', () => {
		expect(scrubControlsAvailable(ready, 'krlx')).toBe(true)
		expect(scrubControlsAvailable(ready, 'ksto')).toBe(false)
		expect(scrubControlsAvailable({...ready, ready: false}, 'krlx')).toBe(false)
		expect(scrubControlsAvailable({...ready, controlsAvailable: false}, 'krlx')).toBe(false)
		expect(scrubControlsAvailable({...ready, bufferSeconds: 0}, 'krlx')).toBe(false)
	})
	test('keeps the PCM renderer in charge of output while paused or buffering', () => {
		let previous = useScrubPlayback.getState()
		try {
			useScrubPlayback.setState({...ready, token: 'attachment', ready: false, bufferSeconds: 0})
			expect(customRendererOwnsOutput('krlx')).toBe(true)
			expect(customRendererOwnsOutput('ksto')).toBe(false)
			useScrubPlayback.setState({controlsAvailable: false})
			expect(customRendererOwnsOutput('krlx')).toBe(false)
			useScrubPlayback.setState({controlsAvailable: true, token: null})
			expect(customRendererOwnsOutput('krlx')).toBe(false)
		} finally {
			useScrubPlayback.setState(previous)
		}
	})
})
