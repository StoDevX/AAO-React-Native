import React from 'react'
import {DictionaryView} from '../../views/dictionary/list'
import {Stack} from 'expo-router'

export default function DictionaryScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Campus Dictionary'}} />
			<DictionaryView />
		</>
	)
}
