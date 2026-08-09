import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {toLaxTitleCase} from '@frogpond/titlecase'

import {DebugView} from '../../../source/views/settings/screens/debug'
import {getAtKeyPath} from '../../../source/views/settings/screens/debug/get-at-key-path'
import {useAppSelector} from '../../../source/redux'

export default function DebugKeyPathPage(): React.ReactNode {
	let router = useRouter()
	let {keyPath = []} = useLocalSearchParams<{keyPath?: string[]}>()
	let reduxState = useAppSelector((state) => state)
	let slice = getAtKeyPath(reduxState, keyPath)

	let onDrillDown = (key: string | number) => {
		let nextPath = [...keyPath, String(key)].map(encodeURIComponent).join('/')
		router.push(`/Debug/${nextPath}`)
	}

	return (
		<>
			<Stack.Screen
				options={{title: toLaxTitleCase(keyPath[keyPath.length - 1])}}
			/>
			<DebugView onDrillDown={onDrillDown} state={slice} />
		</>
	)
}
