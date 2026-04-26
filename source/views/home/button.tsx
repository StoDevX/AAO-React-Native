import * as React from 'react'
import {Platform, StyleSheet, Text, View} from 'react-native'
import {Entypo as Icon} from '@react-native-vector-icons/entypo'
import type {ViewType} from '../views'
import {Touchable} from '@frogpond/touchable'
import {transparent} from '@frogpond/colors'
import {homescreenForegroundDark, homescreenForegroundLight} from './colors'
import type {TileSize} from './types'

type Props = {
	view: ViewType
	size?: TileSize
	onPress: () => void
}

type Variant = {
	containerStyle: object
	iconSize: number
	showTitle: boolean
	titleStyle?: object
	titleNumberOfLines?: number
}

function variantFor(size: TileSize): Variant {
	switch (size) {
		case '1x1':
			return {
				containerStyle: styles.contentColumn,
				iconSize: 24,
				showTitle: false,
			}
		case '1x2':
			return {
				containerStyle: styles.contentColumn,
				iconSize: 32,
				showTitle: true,
				titleStyle: styles.title1x2,
				titleNumberOfLines: 1,
			}
		case '2x2':
			return {
				containerStyle: styles.contentColumn,
				iconSize: 44,
				showTitle: true,
				titleStyle: styles.title2x2,
				titleNumberOfLines: 2,
			}
		case '2x4':
			return {
				containerStyle: styles.contentRow,
				iconSize: 40,
				showTitle: true,
				titleStyle: styles.title2x4,
				titleNumberOfLines: 1,
			}
	}
}

export function HomeScreenButton({
	view,
	size = '1x2',
	onPress,
}: Props): React.ReactNode {
	const foreground =
		view.foreground === 'light' ? styles.lightForeground : styles.darkForeground
	const variant = variantFor(size)

	return (
		<Touchable
			accessibilityLabel={view.title}
			accessibilityRole="button"
			accessible={true}
			highlight={false}
			onPress={onPress}
			style={[styles.button, {backgroundColor: view.tint}]}
		>
			<View style={variant.containerStyle}>
				<Icon
					name={view.icon}
					size={variant.iconSize}
					style={[foreground, styles.icon]}
				/>
				{variant.showTitle ? (
					<Text
						style={[foreground, styles.title, variant.titleStyle]}
						numberOfLines={variant.titleNumberOfLines}
					>
						{view.title}
					</Text>
				) : null}
			</View>
		</Touchable>
	)
}

export const CELL_MARGIN = 10
const cellVerticalPadding = 8
const cellHorizontalPadding = 4

const styles = StyleSheet.create({
	button: {
		elevation: 2,
		borderRadius: 17,
		flex: 1,
		marginBottom: CELL_MARGIN,
		marginLeft: CELL_MARGIN / 2,
		marginRight: CELL_MARGIN / 2,
	},
	contentColumn: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: cellVerticalPadding,
		paddingBottom: cellVerticalPadding / 2,
		paddingHorizontal: cellHorizontalPadding,
	},
	contentRow: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		gap: 12,
	},
	icon: {
		backgroundColor: transparent,
	},
	title: {
		backgroundColor: transparent,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
	},
	title1x2: {
		fontSize: 14,
	},
	title2x2: {
		fontSize: 15,
	},
	title2x4: {
		fontSize: 17,
		fontWeight: '600',
	},
	lightForeground: {
		color: homescreenForegroundLight,
	},
	darkForeground: {
		color: homescreenForegroundDark,
	},
})
