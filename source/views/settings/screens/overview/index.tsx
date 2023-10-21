import * as React from 'react'
import {Platform, ScrollView, StyleSheet} from 'react-native'

import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {isDevMode} from '@frogpond/constants'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {TableView} from '@frogpond/tableview'

import {AppIconSection} from './app-icon'
import {DeveloperSection} from './developer'
import {CredentialsLoginSection} from './login-credentials'
import {MiscellanySection} from './miscellany'
import {SupportSection} from './support'

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
