import * as React from 'react'
import {beforeEach, expect, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {useMessStore} from '../store'
import {IssueStainsRow} from '../issue-stains-row'

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
