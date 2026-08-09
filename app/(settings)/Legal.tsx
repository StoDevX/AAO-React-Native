import * as React from 'react'
import {Stack} from 'expo-router'

import {LegalView} from '../../source/views/settings/screens/legal'

export default function LegalPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Legal</Stack.Title>
			<LegalView />
		</>
	)
}
