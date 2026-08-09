import * as React from 'react'
import {Stack} from 'expo-router'

import {ButtonLibrary} from '../../source/views/settings/screens/overview/component-library/button'

export default function ButtonLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Buttons'}} />
			<ButtonLibrary />
		</>
	)
}
