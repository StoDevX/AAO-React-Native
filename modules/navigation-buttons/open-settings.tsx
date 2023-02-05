import * as React from 'react'
import {Platform} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {Icon, platformPrefixIconName} from '@frogpond/icon'
import * as c from '@frogpond/colors'
import {commonStyles, rightButtonStyles} from './styles'
import {useNavigation} from '@react-navigation/native'
import {HeaderBackButtonProps} from '@react-navigation/native-stack/lib/typescript/src/types'

export function OpenSettingsButton(_props: HeaderBackButtonProps): JSX.Element {
	let navigation = useNavigation()

	return Platform.select({
		ios: (
			<Icon
				name={platformPrefixIconName('ellipsis-horizontal-circle')}
				style={[commonStyles.button, rightButtonStyles.icon, {color: c.label}]}
				testID="button-open-settings"
			/>
		),
		android: (
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
					style={[rightButtonStyles.icon, {color: c.label}]}
				/>
			</Touchable>
		),
		default: <></>,
	})
}
