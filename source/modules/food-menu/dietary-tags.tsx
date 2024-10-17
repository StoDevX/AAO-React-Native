import * as React from 'react'
import {Image, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'

import type {ItemCorIconMapType, MasterCorIconMapType} from './types'

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	iconsList: {
		marginHorizontal: 3,
		width: 15,
		height: 15,
	},
})

interface Args {
	corIcons: MasterCorIconMapType
	dietary: ItemCorIconMapType
	style?: StyleProp<ViewStyle>
}

export function DietaryTags({
	corIcons,
	dietary,
	style,
}: Args): React.JSX.Element {
	// filter the mapping of all icons by just the icons provided by this item
	const dietaryKeys = new Set(Object.keys(dietary))
	const filtered = Object.entries(corIcons).filter(([k]) => dietaryKeys.has(k))

	// turn the remaining items into images
	const tags = filtered.map(([key, dietaryIcon]) => (
		<Image
			key={key}
			accessibilityIgnoresInvertColors={true}
			source={{uri: dietaryIcon.image}}
			style={styles.iconsList}
		/>
	))

	return <View style={[styles.container, style]}>{tags}</View>
}
