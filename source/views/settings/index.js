// @flow

import * as React from 'react'
import {StyleSheet, ScrollView, Platform} from 'react-native'
import {TableView} from 'react-native-tableview-simple'
import type {TopLevelViewPropsType} from '../types'
import * as c from '../components/colors'

import CredentialsLoginSection from './sections/login-credentials'
import OddsAndEndsSection from './sections/odds-and-ends'
import SupportSection from './sections/support'

const styles = StyleSheet.create({
	container: {
		backgroundColor:
			Platform.OS === 'ios' ? c.iosLightBackground : c.androidLightBackground,
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

				<OddsAndEndsSection navigation={props.navigation} />
			</TableView>
		</ScrollView>
	)
}
SettingsView.navigationOptions = {
	title: 'Settings',
}
