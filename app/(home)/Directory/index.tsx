import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'

import {DirectoryView} from '../../../source/views/directory'

export default function DirectoryPage(): React.ReactNode {
	let {queryParam} = useLocalSearchParams<{queryParam?: string}>()

	return (
		<>
			<Stack.Screen options={{title: queryParam ?? 'Directory'}} />
			<DirectoryView />
		</>
	)
}
