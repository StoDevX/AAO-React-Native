import React from 'react'
import {describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

import {Button, Menu, Toggle} from './expo-ui-mock'

describe('expo-ui-mock', () => {
	test('Menu throws when given a string child', async () => {
		await expect(render(<Menu label="Title">a bare string</Menu>)).rejects.toThrow(
			'Menu children must be nested elements, not a plain string',
		)
	})

	test('Toggle throws when given a string child', async () => {
		await expect(render(<Toggle>a bare string</Toggle>)).rejects.toThrow(
			'Toggle children must be nested elements, not a plain string',
		)
	})

	test('Button throws when given a string child', async () => {
		await expect(render(<Button>a bare string</Button>)).rejects.toThrow(
			'Button children must be nested elements, not a plain string',
		)
	})
})
