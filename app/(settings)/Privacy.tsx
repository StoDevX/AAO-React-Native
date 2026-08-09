import * as React from 'react'
import {Stack} from 'expo-router'

import {PrivacyView} from '../../source/views/settings/screens/privacy'

export default function PrivacyPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Privacy</Stack.Title>
			<PrivacyView />
		</>
	)
}
