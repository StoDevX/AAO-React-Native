import React from 'react'
import {describe, expect, test} from '@jest/globals'

import {render} from '@testing-library/react-native'
import {SelectableCell} from '../cells/selectable'

describe('SelectableCell', () => {
	// `dataDetectorTypes="all"` silently detects nothing under the new
	// architecture: UIDataDetectorTypeAll is NSUIntegerMax, and React Native
	// reads it through `unsignedIntValue`, truncating it to 32 bits.
	// See https://github.com/facebook/react-native/issues/55367.
	test('it asks for data detectors by name rather than "all"', async () => {
		let tree = (await render(<SelectableCell text="Aug. 17 9:00 AM to Aug. 20 6:00 PM" />)).toJSON()
		let props = (tree as {props: {dataDetectorTypes?: unknown}}).props

		expect(props.dataDetectorTypes).not.toBe('all')
		expect(props.dataDetectorTypes).toEqual(
			expect.arrayContaining(['calendarEvent', 'link', 'phoneNumber', 'address']),
		)
	})
})
