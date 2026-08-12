import * as React from 'react'
import {Stack} from 'expo-router'

import {LegalView} from '../../source/views/settings'

export default function LegalPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Legal'}} />
			<LegalView />
		</>
	)
}
