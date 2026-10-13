import {expect, test} from '@jest/globals'

import sample from './sample.yaml'

test('a .yaml import is the JSON it describes', () => {
	expect(sample).toEqual({name: 'Glacier Hall', floors: [1, 2]})
})
