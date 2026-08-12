import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {toLaxTitleCase} from '@frogpond/titlecase'

import {DebugKeyPathScreen} from '../../../source/views/settings/screens/debug/route-screen'

export default function DebugKeyPathPage(): React.ReactNode {
	let {keyPath = []} = useLocalSearchParams<{keyPath?: string[]}>()

	return (
		<>
			<Stack.Screen
				options={{title: toLaxTitleCase(keyPath[keyPath.length - 1])}}
			/>
			<DebugKeyPathScreen keyPath={keyPath} />
		</>
	)
}
