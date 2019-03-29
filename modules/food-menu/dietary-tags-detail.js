// @flow
import * as React from 'react'
import {View, Text, StyleSheet, Image} from 'react-native'
import {Row} from '@frogpond/layout'

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
	wrapper: {
		marginVertical: 5,
	},
	iconsDetail: {
		marginRight: 5,
		width: 15,
		height: 15,
	},
})

type Args = {
	corIcons: MasterCorIconMapType,
	dietary: ItemCorIconMapType,
	style?: any,
}

export function DietaryTagsDetail({corIcons, dietary, style}: Args) {
	// filter the mapping of all icons by just the icons provided by this item
	let dietaryKeys = new Set(keys(dietary))
	let filteredAny: Array<any> = Object.entries(corIcons).filter(([k]) =>
		dietaryKeys.has(k),
	)
	let filtered: Array<[string, CorIconType]> = filteredAny

	let tags = filtered.map(([key, dietaryIcon]) => (
		<Row key={key} alignItems="center" style={styles.wrapper}>
			<Row flex={1}>
				<Image
					accessibilityIgnoresInvertColors={true}
					source={{uri: dietaryIcon.image}}
					style={styles.iconsDetail}
				/>
				<Text>{dietaryIcon.label}</Text>
			</Row>
		</Row>
	))

	return <View style={[styles.container, style]}>{tags}</View>
}
