import * as React from 'react'
import {StyleSheet, ScrollView, Platform} from 'react-native'
import {TableView} from '@frogpond/tableview'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {NativeStackNavigationOptions} from 'expo-router-stack'

import {isDevMode} from '@frogpond/constants'

import {CredentialsLoginSection} from './login-credentials'
import {MiscellanySection} from './miscellany'
import {SupportSection} from './support'
import {DeveloperSection} from './developer'
import {AppIconSection} from './app-icon'

const styles = StyleSheet.create({
	container: {
		paddingVertical: 20,
	},
})

const SettingsView = (): React.JSX.Element => (
	<ScrollView
		contentContainerStyle={styles.container}
		keyboardDismissMode="on-drag"
		keyboardShouldPersistTaps="always"
	>
		<TableView>
			<CredentialsLoginSection />

			<SupportSection />

			<AppIconSection />

			<MiscellanySection />

			{isDevMode() && <DeveloperSection />}
		</TableView>
	</ScrollView>
)

export {SettingsView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Settings',
	headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
}
