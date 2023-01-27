import * as React from 'react'
import {Image, StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native'
import {Row} from '@frogpond/layout'
import * as c from '@frogpond/colors'
import type {ItemCorIconMapType, MasterCorIconMapType} from './types'

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	wrapper: {
		marginVertical: 5,
		alignItems: 'center',
	},
	iconsDetail: {
		marginRight: 5,
		width: 15,
		height: 15,
	},
	label: {
		color: c.label,
	},
})

type Props = {
	corIcons: MasterCorIconMapType
	dietary: ItemCorIconMapType
	style?: StyleProp<ViewStyle>
}

export function DietaryTagsDetail({
	corIcons,
	dietary,
	style,
}: Props): JSX.Element {
	// filter the mapping of all icons by just the icons provided by this item
	const dietaryKeys = new Set(Object.keys(dietary))
	const filtered = Object.entries(corIcons).filter(([k]) => dietaryKeys.has(k))

	const tags = filtered.map(([key, dietaryIcon]) => (
		<Row key={key} style={styles.wrapper}>
			<Row flex={1}>
				<Image
					accessibilityIgnoresInvertColors={true}
					source={{uri: dietaryIcon.image}}
					style={styles.iconsDetail}
				/>
				<Text style={styles.label}>{dietaryIcon.label}</Text>
			</Row>
		</Row>
	))

	return <View style={[styles.container, style]}>{tags}</View>
}
