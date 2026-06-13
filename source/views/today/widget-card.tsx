import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'

const styles = StyleSheet.create({
	card: {
		backgroundColor: c.secondarySystemGroupedBackground,
		borderRadius: 14,
		marginHorizontal: 16,
		marginVertical: 8,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: c.label,
	},
	action: {
		fontSize: 15,
		color: c.link,
	},
	empty: {
		fontSize: 15,
		color: c.secondaryLabel,
		paddingVertical: 6,
	},
})

type Props = {
	title: string
	actionLabel?: string
	onPressAction?: () => void
	children: React.ReactNode
}

export function WidgetCard({
	title,
	actionLabel,
	onPressAction,
	children,
}: Props): React.ReactNode {
	return (
		<View style={styles.card}>
			<View style={styles.header}>
				<Text style={styles.title}>{title}</Text>
				{actionLabel && onPressAction ? (
					<Touchable
						accessibilityLabel={actionLabel}
						accessibilityRole="button"
						highlight={false}
						onPress={onPressAction}
					>
						<Text style={styles.action}>{actionLabel}</Text>
					</Touchable>
				) : null}
			</View>
			{children}
		</View>
	)
}

export const widgetStyles = styles
