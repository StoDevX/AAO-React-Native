import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {DetailRow, DisclosureRow, SelectableText} from '../rows'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../testing/expo-ui-mock') as typeof import('../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../testing/expo-ui-mock') as typeof import('../../testing/expo-ui-mock')
})

describe('DisclosureRow', () => {
	it('renders the detail line when there is one', async () => {
		await render(
			<DisclosureRow detail="Runs every 20 minutes" onPress={jest.fn()} title="Shuttle" />,
		)

		expect(screen.getByText('Shuttle')).toBeOnTheScreen()
		expect(screen.getByText('Runs every 20 minutes')).toBeOnTheScreen()
	})

	it('omits the detail line rather than rendering an empty one', async () => {
		await render(<DisclosureRow onPress={jest.fn()} title="Shuttle" />)

		expect(screen.getByText('Shuttle')).toBeOnTheScreen()
		expect(screen.queryByText('')).not.toBeOnTheScreen()
	})

	it('reads the title and detail as one label, so VoiceOver announces both', async () => {
		await render(
			<DisclosureRow detail="Runs every 20 minutes" onPress={jest.fn()} title="Shuttle" />,
		)

		expect(screen.getByLabelText('Shuttle, Runs every 20 minutes')).toBeOnTheScreen()
	})

	it('falls back to the title alone when there is no detail', async () => {
		await render(<DisclosureRow onPress={jest.fn()} title="Shuttle" />)

		expect(screen.getByLabelText('Shuttle')).toBeOnTheScreen()
	})

	it('calls onPress when tapped', async () => {
		let onPress = jest.fn()
		await render(<DisclosureRow onPress={onPress} title="Shuttle" />)

		fireEvent.press(screen.getByLabelText('Shuttle'))

		expect(onPress).toHaveBeenCalledTimes(1)
	})
})

describe('DisclosureRow detail lines', () => {
	it('renders each of several detail lines', async () => {
		await render(
			<DisclosureRow
				detail={['Rølvaag Library', '7:00 PM – Fri, Sep. 11']}
				onPress={jest.fn()}
				title="Organ Recital"
			/>,
		)

		expect(screen.getByText('Rølvaag Library')).toBeOnTheScreen()
		expect(screen.getByText('7:00 PM – Fri, Sep. 11')).toBeOnTheScreen()
	})

	/// A row builds its detail lines from optional fields, so an absent one
	/// arrives as undefined rather than being left out of the array.
	it('drops the gaps a missing detail line would leave', async () => {
		await render(
			<DisclosureRow
				detail={[undefined, 'Only this one', '']}
				onPress={jest.fn()}
				title="Organ Recital"
			/>,
		)

		expect(screen.getByText('Only this one')).toBeOnTheScreen()
		expect(screen.getByLabelText('Organ Recital, Only this one')).toBeOnTheScreen()
	})

	it('reads every detail line as part of the row label', async () => {
		await render(
			<DisclosureRow
				detail={['Rølvaag Library', '7:00 PM']}
				onPress={jest.fn()}
				title="Organ Recital"
			/>,
		)

		expect(screen.getByLabelText('Organ Recital, Rølvaag Library, 7:00 PM')).toBeOnTheScreen()
	})

	it('still takes a single detail string', async () => {
		await render(
			<DisclosureRow detail="Runs every 20 minutes" onPress={jest.fn()} title="Shuttle" />,
		)

		expect(screen.getByLabelText('Shuttle, Runs every 20 minutes')).toBeOnTheScreen()
	})
})

describe('DisclosureRow leading image', () => {
	it('shows a leading symbol', async () => {
		await render(
			<DisclosureRow image={{systemName: 'printer'}} onPress={jest.fn()} title="stoPrint-LPR" />,
		)

		expect(screen.getByLabelText('printer')).toBeOnTheScreen()
	})

	/// `@expo/ui`'s own Image reads only SF Symbols and local files, so a remote
	/// thumbnail has to be a React Native image hosted inside the SwiftUI row.
	it('hosts a remote thumbnail rather than passing the URL to @expo/ui', async () => {
		await render(
			<DisclosureRow
				image={{uri: 'https://example.com/thumb.jpg', width: 70, height: 40}}
				onPress={jest.fn()}
				title="KSTO"
			/>,
		)

		expect(screen.getByTestId('disclosure-row-thumbnail')).toBeOnTheScreen()
	})

	it('draws no image slot when there is no image', async () => {
		await render(<DisclosureRow onPress={jest.fn()} title="KSTO" />)

		expect(screen.queryByTestId('disclosure-row-thumbnail')).not.toBeOnTheScreen()
	})
})

describe('DetailRow', () => {
	it('shows the label and its value', async () => {
		await render(<DetailRow label="Credits" value="1.00" />)

		expect(screen.getByText('Credits')).toBeOnTheScreen()
		expect(screen.getByText('1.00')).toBeOnTheScreen()
	})

	it('calls onPress when the row is tappable', async () => {
		let onPress = jest.fn()
		await render(<DetailRow label="Email" onPress={onPress} value="ole@stolaf.edu" />)

		fireEvent.press(screen.getByLabelText('Email, ole@stolaf.edu'))

		expect(onPress).toHaveBeenCalledTimes(1)
	})

	/// A row with nowhere to go must not look like one that has somewhere.
	it('is not a button when there is nothing to tap', async () => {
		await render(<DetailRow label="Pronouns" value="they/them" />)

		expect(screen.queryByLabelText('Pronouns, they/them')).not.toBeOnTheScreen()
	})
})

describe('SelectableText', () => {
	it('shows the text', async () => {
		await render(<SelectableText text="Mondays at 7pm, Tomson 280" />)

		expect(screen.getByTestId('selectable-text')).toBeOnTheScreen()
	})

	/// The reason this is a TextInput rather than an @expo/ui Text. Asking for
	/// them collectively detects nothing under the new architecture, so a
	/// regression here would read as "selection still works" while quietly
	/// making every phone number and address unactionable.
	it('names each data detector rather than asking for all of them', async () => {
		await render(<SelectableText text="Call 507-786-2222" />)

		expect(screen.getByTestId('selectable-text').props.dataDetectorTypes).toEqual([
			'calendarEvent',
			'link',
			'phoneNumber',
			'address',
		])
	})

	it('cannot be edited', async () => {
		await render(<SelectableText text="Mondays at 7pm" />)

		expect(screen.getByTestId('selectable-text').props.editable).toBe(false)
	})
})
