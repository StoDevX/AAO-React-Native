import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host} from '@expo/ui/swift-ui'
import {accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'

import {SheetCloseButton} from '../../source/components/sheet-close-button'

import {MiscellanySection} from '../../source/features/settings/screens/overview/miscellany'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

export default function SettingsRootPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Settings</Stack.Title>
			<SheetCloseButton />

			<Host style={styles.host} modifiers={[accessibilityIdentifier('screen-settings')]}>
				<Form>
					<MiscellanySection />
				</Form>
			</Host>
		</>
	)
}
