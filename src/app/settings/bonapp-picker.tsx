import React from 'react'
import {BonAppPickerView} from '../../views/menus/dev-bonapp-picker'
import {Stack} from 'expo-router'

export default function BonAppPickerScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Dev BonApp Picker'}} />
			<BonAppPickerView />
		</>
	)
}
