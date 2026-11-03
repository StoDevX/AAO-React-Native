import {describe, expect, test} from '@jest/globals'

import {privacyScreenState, privacyTextFrom} from '../privacy-query'

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

describe('what the privacy screen shows', () => {
	test('the policy it has, even when refreshing it failed, so it works offline', () => {
		expect(privacyScreenState({data: 'policy', isLoading: false})).toBe('policy')
	})

	test('a spinner while the first load is under way', () => {
		expect(privacyScreenState({data: undefined, isLoading: true})).toBe('loading')
	})

	test('the error when it has no policy and is no longer loading', () => {
		expect(privacyScreenState({data: undefined, isLoading: false})).toBe('error')
	})
})
