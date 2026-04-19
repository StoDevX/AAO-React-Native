import * as React from 'react'
import {StyleSheet, ScrollView, Platform} from 'react-native'
import {TableView} from '@frogpond/tableview'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {useIsDevMode} from '../../../../lib/use-is-dev-mode'
import {FaqBannerGroup} from '../../../faqs'
import {FAQ_TARGETS} from '../../../faqs/constants'

import {CredentialsLoginSection} from './login-credentials'
import {MiscellanySection} from './miscellany'
import {SupportSection} from './support'
import {DeveloperSection} from './developer'
import {AppIconSection} from './app-icon'

const styles = StyleSheet.create({
	container: {
		paddingVertical: 20,
	},
	banner: {
		marginHorizontal: 20,
		marginBottom: 20,
	},
})

const SettingsView = (): React.ReactNode => {
	const isDev = useIsDevMode()
	return (
		<ScrollView
			contentContainerStyle={styles.container}
			contentInsetAdjustmentBehavior="automatic"
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="always"
		>
			<FaqBannerGroup
				style={styles.banner}
				target={FAQ_TARGETS.SETTINGS_ROOT}
			/>

			<TableView>
				<CredentialsLoginSection />

				<SupportSection />

				<AppIconSection />

				<MiscellanySection />

				{isDev && <DeveloperSection />}
			</TableView>
		</ScrollView>
	)
}

export {SettingsView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Settings',
	headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
}
