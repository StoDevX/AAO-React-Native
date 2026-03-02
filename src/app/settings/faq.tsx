import React from 'react'
import {View as FaqView} from '../../views/faqs'
import {Stack} from 'expo-router'

export default function FaqScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'FAQs'}} />
			<FaqView />
		</>
	)
}
