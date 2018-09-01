// @flow

import * as React from 'react'
import {StyleSheet, ScrollView} from 'react-native'
import {TableView} from '@frogpond/tableview'
import type {TopLevelViewPropsType} from '../types'

import CredentialsLoginSection from './sections/login-credentials'
import MiscellanySection from './sections/miscellany'
import OddsAndEndsSection from './sections/odds-and-ends'
import SupportSection from './sections/support'

const styles = StyleSheet.create({
	container: {
		paddingVertical: 20,
	},
})

export default function SettingsView(props: TopLevelViewPropsType) {
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
