/**
 * @flow
 * Exports a button that opens the Settings screen
 */

import * as React from 'react'
import {Touchable} from '../touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import {commonStyles, leftButtonStyles} from './styles'
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
			style={[commonStyles.button, buttonStyle]}
		>
			<Icon name="ios-settings" style={leftButtonStyles.icon} />
		</Touchable>
	)
}
