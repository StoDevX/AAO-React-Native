import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host} from '@expo/ui/swift-ui'
import {accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'

import {DeveloperSection} from '../../source/features/settings/screens/overview/developer'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

/// The tools for building the app, which Home's Developer tile opens in dev mode.
export default function DeveloperPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Developer</Stack.Title>

			<Host modifiers={[accessibilityIdentifier('screen-developer')]} style={styles.host}>
				<Form>
					<DeveloperSection />
				</Form>
			</Host>
		</>
	)
}
