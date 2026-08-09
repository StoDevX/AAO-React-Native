import * as React from 'react'
import {Stack} from 'expo-router'

import {BonAppPickerView} from '../../source/views/menus/dev-bonapp-picker'

export default function BonAppPickerPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Dev BonApp Picker</Stack.Title>
			<BonAppPickerView />
		</>
	)
}
