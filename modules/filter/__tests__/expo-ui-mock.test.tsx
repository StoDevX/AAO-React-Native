import React from 'react'
import {describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

import {BottomSheet, Button, Menu, Section, Toggle} from './expo-ui-mock'

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

	test('BottomSheet throws when given a string anchor', async () => {
		await expect(
			render(
				<BottomSheet anchor="a bare string" isPresented={false}>
					{null}
				</BottomSheet>,
			),
		).rejects.toThrow('BottomSheet anchor is a SwiftUI slot; a bare string crashes at mount')
	})

	test('Section throws when given a string header', async () => {
		await expect(render(<Section header="a bare string">{null}</Section>)).rejects.toThrow(
			'Section header/footer are SwiftUI slots; a bare string crashes at mount',
		)
	})

	test('Section throws when given a string footer', async () => {
		await expect(render(<Section footer="a bare string">{null}</Section>)).rejects.toThrow(
			'Section header/footer are SwiftUI slots; a bare string crashes at mount',
		)
	})
})
