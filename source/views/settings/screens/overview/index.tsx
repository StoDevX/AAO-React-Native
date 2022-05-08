import * as React from 'react'
import {StyleSheet, ScrollView} from 'react-native'
import {TableView} from '@frogpond/tableview'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {isDevMode} from '@frogpond/constants'

import {ConnectedCredentialsLoginSection} from './login-credentials'
import {MiscellanySection} from './miscellany'
import {OddsAndEndsSection} from './odds-and-ends'
import {SupportSection} from './support'
import {DeveloperSection} from './developer'

const styles = StyleSheet.create({
	container: {
		paddingVertical: 20,
	},
})

const SettingsView = (): JSX.Element => (
	<ScrollView
		contentContainerStyle={styles.container}
		keyboardDismissMode="on-drag"
		keyboardShouldPersistTaps="always"
	>
		<TableView>
			<ConnectedCredentialsLoginSection />

			<SupportSection />

			<MiscellanySection />

			<OddsAndEndsSection />

			{isDevMode() && <DeveloperSection />}
		</TableView>
	</ScrollView>
)

export {SettingsView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Settings',
}
