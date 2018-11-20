// @flow

import * as React from 'react'
import {StyleSheet, ScrollView} from 'react-native'
import {TableView} from '@frogpond/tableview'
import {type NavigationScreenProp} from 'react-navigation'

import {CredentialsLoginSection} from './login-credentials'
import {MiscellanySection} from './miscellany'
import {OddsAndEndsSection} from './odds-and-ends'
import {SupportSection} from './support'

const styles = StyleSheet.create({
	container: {
		paddingVertical: 20,
	},
})

export function SettingsView(props: {navigation: NavigationScreenProp<*>}) {
	return (
		<ScrollView
			contentContainerStyle={styles.container}
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="always"
		>
			<TableView>
				<CredentialsLoginSection />

				<SupportSection navigation={props.navigation} />

				<MiscellanySection navigation={props.navigation} />

				<OddsAndEndsSection navigation={props.navigation} />
			</TableView>
		</ScrollView>
	)
}
SettingsView.navigationOptions = {
	title: 'Settings',
}
