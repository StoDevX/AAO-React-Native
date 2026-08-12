import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'

import {BannerBuilderView} from '../../source/views/settings/screens/banner-builder'

export default function BannerBuilderPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>Banner Builder</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<BannerBuilderView />
		</>
	)
}
