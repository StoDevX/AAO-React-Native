import React from 'react'
import {describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

import {Button, Section} from './expo-ui-mock'

describe('expo-ui-mock', () => {
	test('Section throws when given a string footer', async () => {
		await expect(render(<Section footer="a bare string">{null}</Section>)).rejects.toThrow(
			'Section header/footer are SwiftUI slots; a bare string crashes at mount',
		)
	})

	test('Section throws when given a string header', async () => {
		await expect(render(<Section header="a bare string">{null}</Section>)).rejects.toThrow(
			'Section header/footer are SwiftUI slots; a bare string crashes at mount',
		)
	})

	test('Button throws when given a string child', async () => {
		await expect(render(<Button>a bare string</Button>)).rejects.toThrow(
			'Button children must be nested elements, not a plain string',
		)
	})
})
