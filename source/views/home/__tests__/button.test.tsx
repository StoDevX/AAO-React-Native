import React from 'react'
import {describe, it, expect, jest} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

jest.mock('@react-native-vector-icons/entypo', () => ({
	Entypo: 'Icon',
}))

import {HomeScreenButton} from '../button'
import type {ViewType} from '../../views'

const baseView: ViewType = {
	id: 'menus',
	type: 'view',
	view: 'Menus',
	title: 'Menus',
	icon: 'bowl',
	foreground: 'light',
	tint: '#3478F6',
}

describe('HomeScreenButton', () => {
	it('renders the title text at size 1x2 (default)', () => {
		render(<HomeScreenButton onPress={jest.fn()} size="1x2" view={baseView} />)
		expect(screen.getByText('Menus')).toBeTruthy()
	})

	it('renders the title text at size 2x2', () => {
		render(<HomeScreenButton onPress={jest.fn()} size="2x2" view={baseView} />)
		expect(screen.getByText('Menus')).toBeTruthy()
	})

	it('renders the title text at size 2x4', () => {
		render(<HomeScreenButton onPress={jest.fn()} size="2x4" view={baseView} />)
		expect(screen.getByText('Menus')).toBeTruthy()
	})

	it('hides the title text at size 1x1 (icon-only)', () => {
		render(<HomeScreenButton onPress={jest.fn()} size="1x1" view={baseView} />)
		expect(screen.queryByText('Menus')).toBeNull()
	})

	it('always exposes the title via accessibilityLabel, including at 1x1', () => {
		render(<HomeScreenButton onPress={jest.fn()} size="1x1" view={baseView} />)
		expect(screen.getByLabelText('Menus')).toBeTruthy()
	})

	it('uses row layout for 2x4 and column layout for other sizes', () => {
		const renderTree = (size: '1x1' | '1x2' | '2x2' | '2x4') =>
			render(
				<HomeScreenButton onPress={jest.fn()} size={size} view={baseView} />,
			).toJSON()

		const hasRowFlex = (json: unknown): boolean => {
			if (json == null) return false
			if (typeof json !== 'object') return false
			const node = json as {props?: {style?: unknown}; children?: unknown[]}
			const styles = Array.isArray(node.props?.style)
				? node.props.style
				: node.props?.style != null
					? [node.props.style]
					: []
			for (const s of styles) {
				if (
					s &&
					typeof s === 'object' &&
					'flexDirection' in s &&
					(s as {flexDirection: string}).flexDirection === 'row'
				) {
					return true
				}
			}
			if (Array.isArray(node.children)) {
				for (const child of node.children) {
					if (hasRowFlex(child)) return true
				}
			}
			return false
		}

		expect(hasRowFlex(renderTree('2x4'))).toBe(true)
		expect(hasRowFlex(renderTree('2x2'))).toBe(false)
		expect(hasRowFlex(renderTree('1x2'))).toBe(false)
		expect(hasRowFlex(renderTree('1x1'))).toBe(false)
	})
})
