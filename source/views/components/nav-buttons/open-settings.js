/**
 * @flow
 * Exports a button that opens the Settings screen
 */

import * as React from 'react'
import {StyleSheet, Platform} from 'react-native'
import * as c from '../colors'
import {Touchable} from '../touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import type {NavType} from '../../types'

export function OpenSettingsButton({
	navigation,
	buttonStyle,
}: {
	navigation: NavType,
	buttonStyle?: any,
}) {
	return (
		<Touchable
			borderless={true}
			highlight={false}
			onPress={() => navigation.navigate('SettingsView')}
			style={[styles.button, buttonStyle]}
		>
			<Icon name="ios-settings" style={styles.icon} />
		</Touchable>
	)
}

const styles = StyleSheet.create({
	icon: {
		color: c.white,
		fontSize: 24,
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: Platform.OS === 'ios' ? 10 : 16,
		paddingHorizontal: Platform.OS === 'ios' ? 18 : 16,
	},
})
