import * as React from 'react'
import {Stack} from 'expo-router'

import {APITestView} from '../../source/views/settings/screens/api-test'

export default function APITestPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>API Tester</Stack.Title>
			<APITestView />
		</>
	)
}
