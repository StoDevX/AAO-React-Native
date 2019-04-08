// @flow

import * as React from 'react'
import {Touchable} from '@frogpond/touchable'
import {Icon, platformPrefixIconName} from '@frogpond/icon'
import {commonStyles, leftButtonStyles} from './styles'
import type {NavigationScreenProp} from 'react-navigation'

type Props = {
	navigation: NavigationScreenProp<*>,
	buttonStyle?: any,
}

export function OpenSettingsButton({navigation, buttonStyle}: Props) {
	return (
		<Touchable
			accessibilityLabel="Open Settings"
			accessibilityRole="button"
			accessible={true}
			borderless={true}
			highlight={false}
			onPress={() => navigation.navigate('SettingsView')}
			style={[commonStyles.button, buttonStyle]}
			testID="button-open-settings"
		>
			<Icon
				name={platformPrefixIconName('settings')}
				style={leftButtonStyles.icon}
			/>
		</Touchable>
	)
}
