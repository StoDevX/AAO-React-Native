import * as React from 'react'
import {Touchable} from '@frogpond/touchable'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import * as c from '@frogpond/colors'
import {commonStyles, rightButtonStyles} from './styles'
import {useRouter} from 'expo-router'
import type {NativeStackHeaderRightProps} from '@react-navigation/native-stack'

export function OpenSettingsButton(
	_props: NativeStackHeaderRightProps,
): React.ReactNode {
	let router = useRouter()

	return (
		<Touchable
			accessibilityLabel="Open Settings"
			accessibilityRole="button"
			accessible={true}
			highlight={false}
			onPress={() => router.push('/SettingsRoot')}
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
