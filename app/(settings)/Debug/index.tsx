import * as React from 'react'
import {Stack, useRouter} from 'expo-router'

import {DebugView} from '../../../source/views/settings/screens/debug'
import {useAppSelector} from '../../../source/redux'

export default function DebugPage(): React.ReactNode {
	let router = useRouter()
	let reduxState = useAppSelector((state) => state)

	let onDrillDown = (key: string | number) => {
		router.push(`/Debug/${encodeURIComponent(String(key))}`)
	}

	return (
		<>
			<Stack.Screen options={{title: 'Debug'}} />
			<DebugView onDrillDown={onDrillDown} state={reduxState} />
		</>
	)
}
