import React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {Text as RNText} from 'react-native'

import {
	accessibilityIdentifier,
	accessibilityLabel,
	BottomSheet,
	Button,
	disabled,
	HStack,
	List,
	Menu,
	refreshable,
	Section,
	TabView,
	tag,
	Text,
	Toggle,
} from '../expo-ui-mock'

/**
 * Every suite that renders SwiftUI renders it through this mock, so a mock
 * that accepts more than the real component does hides a broken screen behind
 * a passing test. These are the places where the mock makes a decision of its
 * own, rather than drawing something a screenshot would judge.
 */
describe('expo-ui-mock', () => {
	describe('slots reject a bare string, as the native components do', () => {
		test('Section footer', async () => {
			await expect(render(<Section footer="a bare string">{null}</Section>)).rejects.toThrow(
				'Section header/footer are SwiftUI slots; a bare string crashes at mount',
			)
		})

		test('Section header', async () => {
			await expect(render(<Section header="a bare string">{null}</Section>)).rejects.toThrow(
				'Section header/footer are SwiftUI slots; a bare string crashes at mount',
			)
		})

		test('Button children', async () => {
			await expect(render(<Button>a bare string</Button>)).rejects.toThrow(
				'Button children must be nested elements, not a plain string',
			)
		})

		test('Menu children', async () => {
			await expect(render(<Menu label="Sort">a bare string</Menu>)).rejects.toThrow(
				'Menu children must be nested elements, not a plain string',
			)
		})

		test('Toggle children', async () => {
			await expect(render(<Toggle isOn={true}>a bare string</Toggle>)).rejects.toThrow(
				'Toggle children must be nested elements, not a plain string',
			)
		})

		test('BottomSheet anchor', async () => {
			await expect(
				render(
					<BottomSheet anchor="a bare string" isPresented={false}>
						{null}
					</BottomSheet>,
				),
			).rejects.toThrow('BottomSheet anchor is a SwiftUI slot; a bare string crashes at mount')
		})
	})

	// SwiftUI's `Text` concatenation takes a string, a number, or another
	// `Text`, and silently drops anything else -- so a sentence assembled from
	// custom components comes out blank on device with no warning.
	describe('Text keeps what SwiftUI would concatenate', () => {
		test('and drops what it would not', async () => {
			function Custom(): React.ReactNode {
				return <RNText>dropped</RNText>
			}

			await render(
				<Text>
					{'kept '}
					{7} <Text>nested</Text>
					<Custom />
				</Text>,
			)

			expect(screen.getByText('kept 7 nested')).toBeTruthy()
			expect(screen.queryByText('dropped')).toBeNull()
		})
	})

	// Each modifier's payload carries the parameter names the real one uses.
	// Renaming a key here would let the mock agree with itself while the
	// component reading it on device found nothing. Listed here are the ones
	// the mock reads back -- the rest it only carries.
	describe('modifiers carry the real parameter names', () => {
		test.each([
			['tag', tag('sciences'), {$type: 'tag', tag: 'sciences'}],
			[
				'accessibilityLabel',
				accessibilityLabel('Filter'),
				{$type: 'accessibilityLabel', label: 'Filter'},
			],
			[
				'accessibilityIdentifier',
				accessibilityIdentifier('filter-button'),
				{$type: 'accessibilityIdentifier', identifier: 'filter-button'},
			],
			['disabled', disabled(), {$type: 'disabled', disabled: true}],
		])('%s', (_name, built, expected) => {
			expect(built).toEqual(expected)
		})
	})

	describe('Button', () => {
		test('announces an accessibilityLabel modifier over its own label', async () => {
			await render(
				<Button label="Tofu Scramble" modifiers={[accessibilityLabel('Tofu Scramble, vegan')]} />,
			)

			expect(screen.getByRole('button', {name: 'Tofu Scramble, vegan'})).toBeTruthy()
		})

		test('ignores a press while a disabled modifier is on it', async () => {
			let onPress = jest.fn()

			await render(<Button label="Save" modifiers={[disabled()]} onPress={onPress} />)
			await fireEvent.press(screen.getByRole('button', {name: 'Save'}))

			expect(onPress).not.toHaveBeenCalled()
		})
	})

	describe('BottomSheet', () => {
		test('keeps the anchor mounted and the children out while dismissed', async () => {
			await render(
				<BottomSheet anchor={<Button label="Open" />} isPresented={false}>
					<Text>a row</Text>
				</BottomSheet>,
			)

			expect(screen.getByRole('button', {name: 'Open'})).toBeTruthy()
			expect(screen.queryByText('a row')).toBeNull()
		})

		test('mounts the children while presented', async () => {
			await render(
				<BottomSheet anchor={<Button label="Open" />} isPresented={true}>
					<Text>a row</Text>
				</BottomSheet>,
			)

			expect(screen.getByText('a row')).toBeTruthy()
		})
	})

	// A `List` given a `selection` owns its rows' taps, and a tapped row
	// reports the whole new selection rather than the one row that changed.
	describe('List selection', () => {
		test('adds the pressed row to the selection', async () => {
			let onSelectionChange = jest.fn()

			await render(
				<List onSelectionChange={onSelectionChange} selection={['art']}>
					<HStack modifiers={[tag('art'), accessibilityIdentifier('row:art')]}>
						<Text>Art</Text>
					</HStack>
					<HStack modifiers={[tag('biology'), accessibilityIdentifier('row:biology')]}>
						<Text>Biology</Text>
					</HStack>
				</List>,
			)
			await fireEvent.press(screen.getByTestId('row:biology'))

			expect(onSelectionChange).toHaveBeenCalledWith(['art', 'biology'])
		})

		test('removes a row that was already selected', async () => {
			let onSelectionChange = jest.fn()

			await render(
				<List onSelectionChange={onSelectionChange} selection={['art', 'biology']}>
					<HStack modifiers={[tag('art'), accessibilityIdentifier('row:art')]}>
						<Text>Art</Text>
					</HStack>
				</List>,
			)
			await fireEvent.press(screen.getByTestId('row:art'))

			expect(onSelectionChange).toHaveBeenCalledWith(['biology'])
		})

		test('leaves a row alone when the list has no selection to own', async () => {
			await render(
				<List>
					<HStack modifiers={[tag('art'), accessibilityIdentifier('row:art')]}>
						<Text>Art</Text>
					</HStack>
				</List>,
			)

			expect(screen.queryByTestId('row:art')).toBeNull()
			expect(screen.getByText('Art')).toBeTruthy()
		})
	})

	// A paged TabView draws one tab. A stand-in that fell back to the first tab
	// when the selection matched none of them would draw a day the device draws
	// blank -- which is how a broken day pane passed its tests once already.
	describe('TabView', () => {
		test('draws the selected tab and no other', async () => {
			await render(
				<TabView selection="tuesday">
					<TabView.Tab value="monday">
						<Text>monday events</Text>
					</TabView.Tab>
					<TabView.Tab value="tuesday">
						<Text>tuesday events</Text>
					</TabView.Tab>
				</TabView>,
			)

			expect(screen.getByText('tuesday events')).toBeTruthy()
			expect(screen.queryByText('monday events')).toBeNull()
		})

		test('takes defaultSelection when nothing drives it', async () => {
			await render(
				<TabView defaultSelection="monday">
					<TabView.Tab value="monday">
						<Text>monday events</Text>
					</TabView.Tab>
				</TabView>,
			)

			expect(screen.getByText('monday events')).toBeTruthy()
		})

		test('draws nothing when the selection matches no tab', async () => {
			await render(
				<TabView selection="wednesday">
					<TabView.Tab value="monday">
						<Text>monday events</Text>
					</TabView.Tab>
				</TabView>,
			)

			expect(screen.queryByText('monday events')).toBeNull()
		})
	})

	// The handler reaches the test whole, promise and all -- a wrapper that
	// swallowed the return value would leave a test unable to tell a refresh
	// still running from one already finished.
	test('List hands back a refreshable handler that is still the caller’s own', async () => {
		let handler = jest.fn(() => Promise.resolve())

		await render(
			<List modifiers={[refreshable(handler)]}>
				<Text>a row</Text>
			</List>,
		)
		let onRefresh = screen.getByTestId('refreshable').props.onRefresh as () => Promise<void>

		await expect(onRefresh()).resolves.toBeUndefined()
		expect(handler).toHaveBeenCalled()
	})
})
