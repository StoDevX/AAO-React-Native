// @flow
import * as React from 'react'
import {View, StyleSheet, Image} from 'react-native'

import keys from 'lodash/keys'
import type {
	ItemCorIconMapType,
	MasterCorIconMapType,
	CorIconType,
} from './types'

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

type Args = {
	corIcons: MasterCorIconMapType,
	dietary: ItemCorIconMapType,
	style?: any,
}

export function DietaryTags({corIcons, dietary, style}: Args) {
	// filter the mapping of all icons by just the icons provided by this item
	let dietaryKeys = new Set(keys(dietary))
	let filteredAny: Array<any> = Object.entries(corIcons).filter(([k]) =>
		dietaryKeys.has(k),
	)
	let filtered: Array<[string, CorIconType]> = filteredAny

	// turn the remaining items into images
	let tags = filtered.map(([key, dietaryIcon]) => (
		<Image
			key={key}
			accessibilityIgnoresInvertColors={true}
			source={{uri: dietaryIcon.image}}
			style={styles.iconsList}
		/>
	))

	return <View style={[styles.container, style]}>{tags}</View>
}
