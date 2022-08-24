/* eslint-env jest */
import {trimStoryCateogry} from '../util'

describe('trimStoryCateogry', () => {
	it('should remove extraneous whitespace from the input', () => {
		expect(trimStoryCateogry('Blah    Hi\t Bleep')).toStrictEqual(
			'Blah Hi Bleep',
		)
	})

	it('should title-case the input', () => {
		expect(trimStoryCateogry('blah hi bleep')).toStrictEqual('Blah Hi Bleep')
	})

	it('should normalize any entities', () => {
		expect(trimStoryCateogry('blah &amp; hi bleep')).toStrictEqual(
			'Blah & Hi Bleep',
		)
	})
})
