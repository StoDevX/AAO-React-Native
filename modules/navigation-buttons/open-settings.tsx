import * as React from 'react'
import {Ionicons} from '@react-native-vector-icons/ionicons'
import * as c from '@frogpond/colors'
import {commonStyles, rightButtonStyles} from './styles'
import {Link} from 'expo-router'

export function OpenSettingsButton(): React.JSX.Element {
	return (
		<Link
			aria-label="Open Settings"
			href="/settings"
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
