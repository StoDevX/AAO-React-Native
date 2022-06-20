/* eslint-env jest */
import {trimStoryCateogry} from '../util'

describe('trimStoryCateogry', () => {
	it('should remove extraneous whitespace from the input', () => {
		expect(trimStoryCateogry('Blah    Hi\t Bleep')).toBe('Blah Hi Bleep')
	})

	it('should title-case the input', () => {
		expect(trimStoryCateogry('blah hi bleep')).toBe('Blah Hi Bleep')
	})

	it('should normalize any entities', () => {
		expect(trimStoryCateogry('blah &amp; hi bleep')).toBe('Blah & Hi Bleep')
	})
})
