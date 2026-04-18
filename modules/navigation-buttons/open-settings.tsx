import * as React from 'react'
import {Touchable} from '@frogpond/touchable'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import * as c from '@frogpond/colors'
import {commonStyles, rightButtonStyles} from './styles'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackHeaderRightProps} from '@react-navigation/native-stack'

export function OpenSettingsButton(
	_props: NativeStackHeaderRightProps,
): React.ReactNode {
	let navigation = useNavigation()

	return (
		<Touchable
			accessibilityLabel="Open Settings"
			accessibilityRole="button"
			accessible={true}
			highlight={false}
			onPress={() => navigation.navigate('Settings')}
			style={commonStyles.button}
			testID="button-open-settings"
		>
			<Icon
				name="settings"
				style={[rightButtonStyles.icon, {color: c.label}]}
			/>
		</Touchable>
	)
}
