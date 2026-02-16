import * as React from 'react'
import {Stack} from 'expo-router'
import {View as DictionaryView} from './list'

export default function DictionaryRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Campus Dictionary'}} />
			<DictionaryView />
		</>
	)
}
