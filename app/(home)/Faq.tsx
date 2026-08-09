import * as React from 'react'
import {Stack} from 'expo-router'

import {View as FaqView} from '../../source/views/faqs'

export default function FaqPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>FAQs</Stack.Title>
			<FaqView />
		</>
	)
}
