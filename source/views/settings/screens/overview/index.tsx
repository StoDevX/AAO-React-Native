import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, RNHostView, VStack} from '@expo/ui/swift-ui'
import {
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'

import {useIsDevMode} from '../../../../lib/use-is-dev-mode'
import {FaqBannerGroup} from '../../../faqs'
import {FAQ_TARGETS} from '../../../faqs/constants'

import {CredentialsLoginSection} from './login-credentials'
import {MiscellanySection} from './miscellany'
import {SupportSection} from './support'
import {DeveloperSection} from './developer'
import {IconSettingsView} from '../change-icon'
import {Stack, useNavigation} from 'expo-router'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
	banner: {
		marginHorizontal: 20,
		marginTop: 20,
		marginBottom: 10,
	},
})

const SettingsView = (): React.ReactNode => {
	const isDev = useIsDevMode()
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>Settings</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<Host style={styles.host}>
				<Form>
					<VStack
						modifiers={[
							listRowBackground('clear'),
							listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
							listRowSeparator('hidden'),
						]}
					>
						<RNHostView matchContents={true}>
							<FaqBannerGroup
								style={styles.banner}
								target={FAQ_TARGETS.SETTINGS_ROOT}
							/>
						</RNHostView>
					</VStack>

					<CredentialsLoginSection />

					<SupportSection />

					<IconSettingsView />

					<MiscellanySection />

					{isDev && <DeveloperSection />}
				</Form>
			</Host>
		</>
	)
}

export {SettingsView as View}
