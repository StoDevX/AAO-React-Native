import React from 'react'
import {PrivacyView} from '../../views/settings'
import {Stack} from 'expo-router'

export default function PrivacyScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Privacy Policy'}} />
			<PrivacyView />
		</>
	)
}
