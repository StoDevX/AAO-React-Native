import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'

import {PrivacyView} from '../../source/views/settings/screens/privacy'

export default function PrivacyPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>Privacy</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<PrivacyView />
		</>
	)
}
