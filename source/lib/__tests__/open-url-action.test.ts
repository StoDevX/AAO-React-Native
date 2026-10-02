import {describe, expect, it, jest} from '@jest/globals'
import {openURLAction} from '../open-url-action'

describe('openURLAction', () => {
	it('is the modifier the native side registers as openURLAction', () => {
		expect(openURLAction(() => undefined).$type).toBe('openURLAction')
	})

	it("hands the URL from the native event's payload to the handler", () => {
		let handler = jest.fn<(url: string) => void>()
		openURLAction(handler).eventListener({url: 'https://x.test/a?b=c'})
		expect(handler).toHaveBeenCalledWith('https://x.test/a?b=c')
	})
})
