import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'

import {DebugKeyPathScreen} from '../../../source/features/settings/screens/debug/route-screen'

export default function DebugKeyPathPage(): React.ReactNode {
	let {keyPath = []} = useLocalSearchParams<{keyPath?: string[]}>()

	// The last key in the path, dotted the way a property access reads. With no
	// path there is no key to dot, and the screen is the root of the tree -- the
	// same thing Debug/index calls itself.
	let lastKey = keyPath.at(-1)

	return (
		<>
			<Stack.Title>{lastKey === undefined ? 'Debug' : `.${lastKey}`}</Stack.Title>

			<DebugKeyPathScreen keyPath={keyPath} />
		</>
	)
}
