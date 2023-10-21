/**
 * <Header/> controls the header of the detail view – title, abbr, and
 * subtitle.
 */

import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

import * as c from '@frogpond/colors'

import type {BuildingType} from '../types'

type Props = {building: BuildingType}

export const Header = (props: Props): JSX.Element => {
	let {building} = props

	let abbr = building.abbreviation ? ` (${building.abbreviation})` : ''

	let subtitle = building.subtitle ? (
		<View style={styles.subtitle}>
			<Text selectable={true} style={[styles.name, styles.subtitleText]}>
				{building.subtitle}
			</Text>
		</View>
	) : null

	return (
		<View>
			<View style={styles.title}>
				<Text selectable={true} style={styles.name}>
					{building.name}
					{abbr}
				</Text>
			</View>
			{subtitle}
		</View>
	)
}

const styles = StyleSheet.create({
	title: {
		paddingTop: 16,
		paddingBottom: 4,
		paddingHorizontal: 8,
	},
	name: {
		textAlign: 'center',
		color: c.label,
		fontSize: 32,
		fontWeight: '300',
	},
	subtitle: {
		paddingTop: 8,
		paddingHorizontal: 8,
	},
	subtitleText: {
		fontSize: 18,
	},
})
