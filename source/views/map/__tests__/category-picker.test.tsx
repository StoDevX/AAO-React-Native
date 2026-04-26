import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {CategoryPicker, CATEGORY_LABELS} from '../category-picker'

jest.mock('@react-native-segmented-control/segmented-control', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
	let React = require('react')
	// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
	let {Pressable, Text, View} = require('react-native')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function MockSegmentedControl(props: any) {
		return (
			<View>
				{/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */}
				{props.values.map((label: string, index: number) => (
					<Pressable
						key={label}
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						accessibilityState={{selected: index === props.selectedIndex}}
						onPress={() => {
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
							props.onChange?.({nativeEvent: {selectedSegmentIndex: index}})
						}}
					>
						<Text>{label}</Text>
					</Pressable>
				))}
			</View>
		)
	}
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
	return {__esModule: true, default: MockSegmentedControl} as any
})

it('renders all configured category labels', () => {
	render(<CategoryPicker onChange={jest.fn()} selected="Buildings" />)
	for (let label of CATEGORY_LABELS) {
		expect(screen.getByText(label)).toBeTruthy()
	}
})

it('calls onChange with the chosen label when a segment is pressed', () => {
	let onChange = jest.fn()
	render(<CategoryPicker onChange={onChange} selected="Buildings" />)
	fireEvent.press(screen.getByText('Outdoors'))
	expect(onChange).toHaveBeenCalledWith('Outdoors')
})
