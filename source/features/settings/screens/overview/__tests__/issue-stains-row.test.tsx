import * as React from 'react'
import {beforeEach, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {useMessStore} from '../../../../mess/store'
import {IssueStainsRow} from '../issue-stains-row'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../../testing/expo-ui-mock') as typeof import('../../../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../../testing/expo-ui-mock') as typeof import('../../../../../testing/expo-ui-mock')
})

beforeEach(() => {
	useMessStore.setState({stainKind: 'coffee'})
})

test('shows the stain kind chosen, and changes it', async () => {
	await render(<IssueStainsRow />)
	expect(screen.getByRole('button', {name: 'Coffee', selected: true})).toBeTruthy()
	await fireEvent.press(screen.getByRole('button', {name: 'Tea'}))
	expect(useMessStore.getState().stainKind).toBe('tea')
	await fireEvent.press(screen.getByRole('button', {name: 'None'}))
	expect(useMessStore.getState().stainKind).toBe('none')
})
