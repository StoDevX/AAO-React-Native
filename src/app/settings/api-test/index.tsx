import React from 'react'
import {APITestView} from '../../../views/settings'
import {Stack} from 'expo-router'

export default function APITestScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'API Tester'}} />
			<APITestView />
		</>
	)
}
