import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'

import {CreditsView} from '../../source/views/settings/screens/credits'

export default function CreditsPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>Credits</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<CreditsView />
		</>
	)
}
