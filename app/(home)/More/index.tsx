import * as React from 'react'
import {Stack} from 'expo-router'

import {View} from '../../../source/views/more'

export default function MorePage(): React.ReactNode {
	return (
		<>
			<Stack.Title>More</Stack.Title>
			<View />
		</>
	)
}
