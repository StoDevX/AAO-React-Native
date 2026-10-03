import * as React from 'react'
import {Stack} from 'expo-router'

import {DebugKeyPathScreen} from '../../../source/features/developer/debug/route-screen'

export default function DebugPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Debug</Stack.Title>

			<DebugKeyPathScreen keyPath={[]} />
		</>
	)
}
