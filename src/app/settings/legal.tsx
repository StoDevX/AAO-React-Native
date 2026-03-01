import React from 'react'
import {LegalView} from '../../views/settings'
import {Stack} from 'expo-router'

export default function LegalScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Legal'}} />
			<LegalView />
		</>
	)
}
