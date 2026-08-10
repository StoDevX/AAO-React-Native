import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'

import {BonAppPickerView} from '../../source/views/menus/dev-bonapp-picker'

export default function BonAppPickerPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>Dev BonApp Picker</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<BonAppPickerView />
		</>
	)
}
