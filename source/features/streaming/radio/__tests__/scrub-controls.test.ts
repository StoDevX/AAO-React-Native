import {describe, expect, jest, test} from '@jest/globals'
import {scrubControlsAvailable, useScrubPlayback} from '../use-radio-scrub'

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
})
