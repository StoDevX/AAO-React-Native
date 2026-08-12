import * as React from 'react'
import {Stack} from 'expo-router'

import {PrivacyView} from '../../source/views/settings'

export default function PrivacyPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Privacy'}} />
			<PrivacyView />
		</>
	)
}
