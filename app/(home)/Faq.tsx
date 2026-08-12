import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'

import {View as FaqView} from '../../source/views/faqs'

export default function FaqPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>FAQs</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>
			<FaqView />
		</>
	)
}
