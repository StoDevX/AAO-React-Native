import * as React from 'react'
import {Stack} from 'expo-router'

import {DictionaryView} from '../../../source/views/dictionary'

export default function DictionaryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Campus Dictionary'}} />
			<DictionaryView />
		</>
	)
}
