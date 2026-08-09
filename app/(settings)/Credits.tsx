import * as React from 'react'
import {Stack} from 'expo-router'

import {CreditsView} from '../../source/views/settings'

export default function CreditsPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Credits'}} />
			<CreditsView />
		</>
	)
}
