import * as React from 'react'
import {Pressable, Text, View} from 'react-native'

/// SegmentedControl is a native iOS view, so under Jest it renders nothing to
/// press. This stand-in exposes one pressable per segment with the same
/// onChange event shape, which is all the tests exercise.
type Props = {
	values: readonly string[]
	selectedIndex: number
	onChange: (event: {nativeEvent: {selectedSegmentIndex: number}}) => void
}

export default function MockSegmentedControl({
	values,
	selectedIndex,
	onChange,
}: Props): React.ReactNode {
	return (
		<View>
			{values.map((label, index) => (
				<Pressable
					key={label}
					accessibilityState={{selected: index === selectedIndex}}
					onPress={() => {
						onChange({nativeEvent: {selectedSegmentIndex: index}})
					}}
				>
					<Text>{label}</Text>
				</Pressable>
			))}
		</View>
	)
}
