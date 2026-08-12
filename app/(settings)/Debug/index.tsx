import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'

import {DebugKeyPathScreen} from '../../../source/features/settings/screens/debug/route-screen'

export default function DebugPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Screen options={{title: 'Debug'}} />
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<DebugKeyPathScreen keyPath={[]} />
		</>
	)
}
