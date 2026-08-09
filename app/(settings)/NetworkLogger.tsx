import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'

import {NetworkLoggerView} from '../../source/views/settings/screens/network-logger'

export default function NetworkLoggerPage(): React.ReactNode {
	const navigation = useNavigation()
	return (
		<>
			<Stack.Screen options={{presentation: 'modal', gestureEnabled: false}} />
			<Stack.Title>Network Logger</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<NetworkLoggerView />
		</>
	)
}
