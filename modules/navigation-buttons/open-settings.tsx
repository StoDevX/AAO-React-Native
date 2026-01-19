import * as React from 'react'
import {Touchable} from '@frogpond/touchable'
import {Ionicons} from '@react-native-vector-icons/ionicons'
import * as c from '@frogpond/colors'
import {commonStyles, rightButtonStyles} from './styles'
import {useNavigation} from '@react-navigation/native'

export function OpenSettingsButton(): React.JSX.Element {
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
			<Ionicons
				name="settings"
				style={[rightButtonStyles.icon, {color: c.label}]}
			/>
		</Touchable>
	)
}
