import * as React from 'react'
import {Stack} from 'expo-router'
import {LinksScreen} from '../../source/features/links/links-screen'

export default function LinksPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Links</Stack.Title>
			<LinksScreen />
		</>
	)
}
