import * as React from 'react'
import {Stack} from 'expo-router'

import {BadgeLibrary} from '../../source/views/settings/screens/overview/component-library/badge'

export default function BadgeLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Badges'}} />
			<BadgeLibrary />
		</>
	)
}
