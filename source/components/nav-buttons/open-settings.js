/**
 * @flow
 * Exports a button that opens the Settings screen
 */

import * as React from 'react'
import {Touchable} from '@frogpond/touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import {commonStyles, leftButtonStyles} from './styles'
import type {NavType} from '../../views/types'

export function OpenSettingsButton({
	navigation,
	buttonStyle,
}: {
	navigation: NavType,
	buttonStyle?: any,
}) {
	return (
		<Touchable
			accessibilityComponentType="button"
			accessibilityLabel="Open Settings"
			accessibilityTraits="button"
			accessible={true}
			borderless={true}
			highlight={false}
			onPress={() => navigation.navigate('SettingsView')}
			style={[commonStyles.button, buttonStyle]}
			testID="button-open-settings"
		>
			<Icon name="ios-settings" style={leftButtonStyles.icon} />
		</Touchable>
	)
}
