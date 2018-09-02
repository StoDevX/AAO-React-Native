// @flow
import * as React from 'react'
import {View, Text, StyleSheet, Image} from 'react-native'
import {Row} from '@frogpond/layout'

import keys from 'lodash/keys'
import pick from 'lodash/pick'
import map from 'lodash/map'
import type {ItemCorIconMapType, MasterCorIconMapType} from './types'

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

export function DietaryTagsDetail({
	corIcons,
	dietary,
	style,
}: {
	corIcons: MasterCorIconMapType,
	dietary: ItemCorIconMapType,
	style?: any,
}) {
	// filter the mapping of all icons by just the icons provided by this item
	let filtered = Array.isArray(dietary)
		? pick(corIcons, [])
		: pick(corIcons, keys(dietary))

	let tags = map(filtered, (dietaryIcon, key) => (
		<Row key={key} alignItems="center" style={styles.wrapper}>
			<Row flex={1}>
				<Image source={{uri: dietaryIcon.image}} style={styles.iconsDetail} />
				<Text>{dietaryIcon.label}</Text>
			</Row>
		</Row>
	))
	return <View style={[styles.container, style]}>{tags}</View>
}
