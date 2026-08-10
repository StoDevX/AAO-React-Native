import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'

import {LegalView} from '../../source/views/settings/screens/legal'

export default function LegalPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>Legal</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<LegalView />
		</>
	)
}
