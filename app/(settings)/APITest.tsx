import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'

import {APITestView} from '../../source/views/settings/screens/api-test'

export default function APITestPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>API Tester</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<APITestView />
		</>
	)
}
