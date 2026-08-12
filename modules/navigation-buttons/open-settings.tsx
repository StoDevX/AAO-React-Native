import * as React from 'react'
import {Touchable} from '@frogpond/touchable'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import * as c from '@frogpond/colors'
import {commonStyles, rightButtonStyles} from './styles'
import type {NavigationProp} from '@react-navigation/native'
import {useNavigation} from 'expo-router'
import type {NativeStackHeaderRightProps} from '@react-navigation/native-stack'
import type {LegacyRootParamList} from '../../source/navigation/types'

export function OpenSettingsButton(
	_props: NativeStackHeaderRightProps,
): React.ReactNode {
	let navigation = useNavigation<NavigationProp<LegacyRootParamList>>()

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
