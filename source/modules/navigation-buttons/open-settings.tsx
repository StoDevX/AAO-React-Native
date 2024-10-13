import * as React from 'react'
import {Touchable} from '../touchable'
import * as c from '../colors'
import {commonStyles, rightButtonStyles} from './styles'
import {useNavigation} from 'expo-router'
import Ionicon from '@expo/vector-icons/Ionicons'

export function OpenSettingsButton(): React.JSX.Element {
	let navigation = useNavigation()

	return (
		<Touchable
			accessibilityLabel="Open Settings"
			accessibilityRole="button"
			accessible={true}
			borderless={true}
			highlight={false}
			onPress={() => {
				navigation.navigate('/settings')
			}}
			style={commonStyles.button}
			testID="button-open-settings"
		>
			<Ionicon
				name="settings"
				style={[rightButtonStyles.icon, {color: c.label}]}
			/>
		</Touchable>
	)
}
