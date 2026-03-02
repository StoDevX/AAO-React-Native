import * as React from 'react'
import {Ionicons} from '@react-native-vector-icons/ionicons'
import * as c from '@frogpond/colors'
import {commonStyles, rightButtonStyles} from './styles'
import {useNavigation} from 'expo-router'
import {Link} from 'expo-router'

export function OpenSettingsButton(): React.JSX.Element {
	let navigation = useNavigation()

	return (
		<Link
			href="/settings"
			aria-label="Open Settings"
			style={commonStyles.button}
			suppressHighlighting={true}
		>
			<Ionicons
				name="settings"
				style={[rightButtonStyles.icon, {color: c.label}]}
			/>
		</Link>
	)
}
