import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {ActionRow, DetailRow, DisclosureRow, SelectableText} from '../rows'

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

	it('calls onPress when tapped', async () => {
		let onPress = jest.fn()
		await render(<DisclosureRow onPress={onPress} title="Shuttle" />)

		fireEvent.press(screen.getByLabelText('Shuttle'))

		expect(onPress).toHaveBeenCalledTimes(1)
	})

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
})

describe('DisclosureRow badge', () => {
	it('carries its badge count in its spoken label', async () => {
		await render(<DisclosureRow badge={4} onPress={jest.fn()} title="Entry-level jobs" />)
		expect(screen.getByLabelText('Entry-level jobs, 4')).toBeOnTheScreen()
	})

	it('draws its badge count', async () => {
		await render(<DisclosureRow badge={4} onPress={jest.fn()} title="Entry-level jobs" />)
		expect(screen.getByText('4')).toBeOnTheScreen()
	})

	it('says nothing of a badge of zero', async () => {
		await render(<DisclosureRow badge={0} onPress={jest.fn()} title="Summer jobs" />)
		expect(screen.getByLabelText('Summer jobs')).toBeOnTheScreen()
	})

	it('does not fire when disabled', async () => {
		let onPress = jest.fn()
		await render(<DisclosureRow disabled={true} onPress={onPress} title="Summer jobs" />)
		fireEvent.press(screen.getByLabelText('Summer jobs'))
		expect(onPress).not.toHaveBeenCalled()
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

	/// A symbol that means something -- an unread dot -- has to say so to
	/// VoiceOver, which reads the row as one element.
	it('leads the row’s spoken label with the symbol’s own label', async () => {
		await render(
			<DisclosureRow
				detail="$12.50/hr"
				image={{systemName: 'circle.fill', label: 'New'}}
				onPress={jest.fn()}
				title="Tutor"
			/>,
		)

		expect(screen.getByLabelText('New, Tutor, $12.50/hr')).toBeOnTheScreen()
	})

	it('adds nothing to the spoken label for a symbol without one', async () => {
		await render(
			<DisclosureRow image={{systemName: 'printer'}} onPress={jest.fn()} title="stoPrint-LPR" />,
		)

		expect(screen.getByLabelText('stoPrint-LPR')).toBeOnTheScreen()
	})

	it('draws no image slot when there is no image', async () => {
		await render(<DisclosureRow onPress={jest.fn()} title="KSTO" />)

		expect(screen.queryByTestId('disclosure-row-thumbnail')).not.toBeOnTheScreen()
	})
})

describe('DisclosureRow destination', () => {
	it('points into the stack by default', async () => {
		await render(<DisclosureRow onPress={jest.fn()} title="Shuttle" />)

		expect(screen.getByTestId('symbol-chevron.right')).toBeOnTheScreen()
	})

	it('points out of the app when the row opens a document elsewhere', async () => {
		await render(<DisclosureRow destination="external" onPress={jest.fn()} title="KSTO" />)

		expect(screen.getByTestId('symbol-arrow.up.right')).toBeOnTheScreen()
		expect(screen.queryByTestId('symbol-chevron.right')).not.toBeOnTheScreen()
	})

	/// An action returns you to this row, so there is nowhere to point.
	it('points nowhere when the row is the thing it does', async () => {
		await render(<DisclosureRow destination="action" onPress={jest.fn()} title="Email Us" />)

		expect(screen.queryByTestId('symbol-chevron.right')).not.toBeOnTheScreen()
		expect(screen.queryByTestId('symbol-arrow.up.right')).not.toBeOnTheScreen()
	})

	/// The arrow is drawn, not read: VoiceOver hears the row's own label, so
	/// the row has to say it leaves the app some other way.
	it('tells VoiceOver it is a link when it opens a document elsewhere', async () => {
		await render(<DisclosureRow destination="external" onPress={jest.fn()} title="KSTO" />)

		expect(screen.getByRole('link', {name: 'KSTO'})).toBeOnTheScreen()
	})

	it('stays a plain button when it pushes', async () => {
		await render(<DisclosureRow onPress={jest.fn()} title="Shuttle" />)

		expect(screen.queryByRole('link')).not.toBeOnTheScreen()
	})
})

describe('DetailRow destination', () => {
	it('points into the stack by default', async () => {
		await render(<DetailRow label="Days" onPress={jest.fn()} value="Mon – Fri" />)

		expect(screen.getByTestId('symbol-chevron.right')).toBeOnTheScreen()
	})

	it('points out of the app when the value is a document elsewhere', async () => {
		await render(
			<DetailRow
				destination="external"
				label="Profile"
				onPress={jest.fn()}
				value="stolaf.edu/profile/ole"
			/>,
		)

		expect(screen.getByTestId('symbol-arrow.up.right')).toBeOnTheScreen()
	})

	it('points nowhere when the value is a number to call', async () => {
		await render(
			<DetailRow destination="action" label="Phone" onPress={jest.fn()} value="507-786-1234" />,
		)

		expect(screen.queryByTestId('symbol-chevron.right')).not.toBeOnTheScreen()
		expect(screen.queryByTestId('symbol-arrow.up.right')).not.toBeOnTheScreen()
	})

	it('tells VoiceOver it is a link when the value is a document elsewhere', async () => {
		await render(
			<DetailRow
				destination="external"
				label="Profile"
				onPress={jest.fn()}
				value="stolaf.edu/profile/ole"
			/>,
		)

		expect(screen.getByRole('link', {name: 'Profile, stolaf.edu/profile/ole'})).toBeOnTheScreen()
	})

	/// Directory's office-hours row states a destination but only sometimes has
	/// a URL behind it, so an untappable row must stay unmarked.
	it('points nowhere when there is nothing to tap', async () => {
		await render(<DetailRow destination="external" label="Office Hours" value="By appointment" />)

		expect(screen.queryByTestId('symbol-arrow.up.right')).not.toBeOnTheScreen()
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
})

describe('ActionRow', () => {
	it('calls onPress when tapped', async () => {
		let onPress = jest.fn()
		await render(<ActionRow onPress={onPress} title="Print" />)

		fireEvent.press(screen.getByLabelText('Print'))

		expect(onPress).toHaveBeenCalledTimes(1)
	})

	it('is disabled when it says it is', async () => {
		let onPress = jest.fn()
		await render(<ActionRow disabled={true} onPress={onPress} title="Print" />)

		fireEvent.press(screen.getByLabelText('Print'))

		expect(onPress).not.toHaveBeenCalled()
	})
})
