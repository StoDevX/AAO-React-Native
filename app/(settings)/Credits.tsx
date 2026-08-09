import * as React from 'react'
import {Stack} from 'expo-router'

import {CreditsView} from '../../source/views/settings/screens/credits'

export default function CreditsPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Credits</Stack.Title>
			<CreditsView />
		</>
	)
}
