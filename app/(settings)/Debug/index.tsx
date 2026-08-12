import * as React from 'react'
import {Stack} from 'expo-router'

import {DebugKeyPathScreen} from '../../../source/views/settings/screens/debug/route-screen'

export default function DebugPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Debug'}} />
			<DebugKeyPathScreen keyPath={[]} />
		</>
	)
}
