import * as React from 'react'
import {beforeEach, expect, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {PhotoToneRow} from '../photo-tone-row'
import {useMessStore} from '../store'

beforeEach(() => {
	useMessStore.setState({photoTone: 'auto'})
})

test('shows the photo tone chosen, and changes it', async () => {
	await render(<PhotoToneRow />)
	expect(screen.getByRole('button', {name: 'Automatic', selected: true})).toBeTruthy()
	await fireEvent.press(screen.getByRole('button', {name: 'Sepia'}))
	expect(useMessStore.getState().photoTone).toBe('sepia')
	await fireEvent.press(screen.getByRole('button', {name: 'Color'}))
	expect(useMessStore.getState().photoTone).toBe('color')
})
