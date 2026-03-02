import React from 'react'
import {DebugRootView} from '../../views/settings'
import {Stack, useLocalSearchParams} from 'expo-router'

export default function DebugScreen(): React.ReactNode {
	let params = useLocalSearchParams<{keyPath?: string}>()
	let keyPath = params.keyPath
		? (JSON.parse(params.keyPath) as string[])
		: ['Root']

	return (
		<>
			<Stack.Screen options={{title: keyPath.join(' > ')}} />
			<DebugRootView />
		</>
	)
}
