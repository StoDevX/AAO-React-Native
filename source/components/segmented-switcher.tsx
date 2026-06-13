import * as React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'

import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'

const styles = StyleSheet.create({
	segment: {
		flexDirection: 'row',
		margin: 12,
		borderRadius: 9,
		backgroundColor: c.secondarySystemFill,
		padding: 2,
	},
	scrollContainer: {
		flexGrow: 0,
	},
	segmentButton: {
		paddingVertical: 7,
		paddingHorizontal: 4,
		borderRadius: 7,
		alignItems: 'center',
		justifyContent: 'center',
	},
	segmentButtonFlex: {
		flex: 1,
	},
	segmentButtonWide: {
		paddingHorizontal: 16,
	},
	segmentButtonActive: {
		backgroundColor: c.systemBackground,
	},
	segmentLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: c.label,
	},
})

export type SwitcherSegment<T extends string> = {
	value: T
	label: string
}

type Props<T extends string> = {
	segments: ReadonlyArray<SwitcherSegment<T>>
	value: T
	onChange: (value: T) => void
	// When there are more segments than fit comfortably, render the control as a
	// horizontally scrolling strip instead of squeezing every label into equal
	// flexed columns.
	scrollable?: boolean
}

export function SegmentedSwitcher<T extends string>({
	segments,
	value,
	onChange,
	scrollable = false,
}: Props<T>): React.ReactNode {
	let buttons = segments.map((segment) => (
		<Touchable
			key={segment.value}
			accessibilityLabel={segment.label}
			accessibilityRole="tab"
			accessibilityState={{selected: value === segment.value}}
			containerStyle={[
				styles.segmentButton,
				scrollable ? styles.segmentButtonWide : styles.segmentButtonFlex,
				value === segment.value && styles.segmentButtonActive,
			]}
			highlight={false}
			onPress={() => onChange(segment.value)}
		>
			<Text numberOfLines={1} style={styles.segmentLabel}>
				{segment.label}
			</Text>
		</Touchable>
	))

	if (scrollable) {
		return (
			<ScrollView
				horizontal={true}
				showsHorizontalScrollIndicator={false}
				style={styles.scrollContainer}
			>
				<View accessibilityRole="tablist" style={styles.segment}>
					{buttons}
				</View>
			</ScrollView>
		)
	}

	return (
		<View accessibilityRole="tablist" style={styles.segment}>
			{buttons}
		</View>
	)
}
