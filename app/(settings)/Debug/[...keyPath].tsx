import * as React from 'react'
import {Stack, useLocalSearchParams, useNavigation} from 'expo-router'

import {DebugKeyPathScreen} from '../../../source/features/settings/screens/debug/route-screen'

export default function DebugKeyPathPage(): React.ReactNode {
	const navigation = useNavigation()
	let {keyPath = []} = useLocalSearchParams<{keyPath?: string[]}>()

	return (
		<>
			<Stack.Title>.{keyPath[keyPath.length - 1]}</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<DebugKeyPathScreen keyPath={keyPath} />
		</>
	)
}
