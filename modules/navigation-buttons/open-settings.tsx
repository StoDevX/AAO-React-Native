import * as React from 'react'
import {Touchable} from '@frogpond/touchable'
import {Icon, platformPrefixIconName} from '@frogpond/icon'
import {commonStyles, leftButtonStyles} from './styles'
import {useNavigation} from '@react-navigation/native'
import {HeaderBackButtonProps} from '@react-navigation/native-stack/lib/typescript/src/types'

export function OpenSettingsButton(_props: HeaderBackButtonProps): JSX.Element {
	let navigation = useNavigation()
	return (
		<Touchable
			accessibilityLabel="Open Settings"
			accessibilityRole="button"
			accessible={true}
			borderless={true}
			highlight={false}
			onPress={() => navigation.navigate('Settings')}
			style={commonStyles.button}
			testID="button-open-settings"
		>
			<Icon
				name={platformPrefixIconName('settings')}
				style={leftButtonStyles.icon}
			/>
		</Touchable>
	)
}
