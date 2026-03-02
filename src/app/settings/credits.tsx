import React from 'react'
import {CreditsView} from '../../views/settings'
import {Stack} from 'expo-router'

export default function CreditsScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Credits'}} />
			<CreditsView />
		</>
	)
}
