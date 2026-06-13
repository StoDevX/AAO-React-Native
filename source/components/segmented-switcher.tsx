import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

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
	segmentButton: {
		flex: 1,
		paddingVertical: 7,
		paddingHorizontal: 4,
		borderRadius: 7,
		alignItems: 'center',
		justifyContent: 'center',
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
}

export function SegmentedSwitcher<T extends string>({
	segments,
	value,
	onChange,
}: Props<T>): React.ReactNode {
	return (
		<View accessibilityRole="tablist" style={styles.segment}>
			{segments.map((segment) => (
				<Touchable
					key={segment.value}
					accessibilityLabel={segment.label}
					accessibilityRole="tab"
					accessibilityState={{selected: value === segment.value}}
					containerStyle={[
						styles.segmentButton,
						value === segment.value && styles.segmentButtonActive,
					]}
					highlight={false}
					onPress={() => onChange(segment.value)}
				>
					<Text numberOfLines={1} style={styles.segmentLabel}>
						{segment.label}
					</Text>
				</Touchable>
			))}
		</View>
	)
}
