import * as React from 'react'
import {Pressable} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {SyncedTextField} from '../synced-text-field'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../testing/expo-ui-mock') as typeof import('../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../testing/expo-ui-mock') as typeof import('../../testing/expo-ui-mock')
})

/**
 * Stands in for the screen around the field: a store the typing writes to and
 * the field reads back from, plus a way to change that store from somewhere
 * other than the keyboard.
 */
function Harness({initial, external}: {initial: string; external: string}): React.ReactNode {
	let [value, setValue] = React.useState(initial)
	return (
		<>
			<SyncedTextField onChangeText={setValue} placeholder="Title" value={value} />
			<Pressable
				accessibilityLabel="Change it from elsewhere"
				onPress={() => {
					setValue(external)
				}}
			/>
		</>
	)
}

describe('SyncedTextField', () => {
	it('shows the value it was given', async () => {
		await render(<SyncedTextField onChangeText={jest.fn()} placeholder="Title" value="Stav Hall" />)

		expect(screen.getByPlaceholderText('Title').props.value).toBe('Stav Hall')
	})

	it('reports what was typed', async () => {
		let onChangeText = jest.fn()
		await render(<SyncedTextField onChangeText={onChangeText} placeholder="Title" value="" />)

		await fireEvent.changeText(screen.getByPlaceholderText('Title'), 'The Pause')

		expect(onChangeText).toHaveBeenCalledWith('The Pause')
	})

	/// A schedule deleted out from under the field, or a draft that loaded
	/// after it mounted, changes the value from somewhere other than the
	/// keyboard -- and that has to land.
	it('takes a value that changed from somewhere other than the keyboard', async () => {
		await render(<Harness external="The Cage" initial="Stav Hall" />)

		await fireEvent.press(screen.getByLabelText('Change it from elsewhere'))

		expect(screen.getByPlaceholderText('Title').props.value).toBe('The Cage')
	})

	/// The field is fed from a store that the typing itself updates, so every
	/// keystroke comes back as a new `value`. Writing that echo into the native
	/// state would be at best redundant and at worst a fight with the cursor.
	///
	/// The stand-in field shows whatever the native state holds, and only a
	/// `set` ever changes that, so a field still showing what it started with
	/// is a field that was never written to.
	it('does not write the echo of its own typing back into the field', async () => {
		await render(<Harness external="The Cage" initial="Stav Hall" />)

		await fireEvent.changeText(screen.getByPlaceholderText('Title'), 'The Pause')

		expect(screen.getByPlaceholderText('Title').props.value).toBe('Stav Hall')
	})
})
