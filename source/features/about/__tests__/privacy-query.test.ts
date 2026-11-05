import {describe, expect, test} from '@jest/globals'

import {privacyTextFrom} from '../privacy-query'

describe('the privacy policy', () => {
	test('is the text of the published file', () => {
		expect(privacyTextFrom({text: '# Privacy\n\nWe collect nothing.'})).toBe(
			'# Privacy\n\nWe collect nothing.',
		)
	})

	test('is refused when the answer carries no text, so the screen shows its error', () => {
		for (let raw of [null, {}, {text: 42}, {text: ''}, '<html>Not Found</html>']) {
			expect(() => privacyTextFrom(raw)).toThrow('no privacy policy')
		}
	})
})
