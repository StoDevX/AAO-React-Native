import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, RNHostView, VStack} from '@expo/ui/swift-ui'
import {listRowBackground, listRowInsets, listRowSeparator} from '@expo/ui/swift-ui/modifiers'
import {Stack, useNavigation} from 'expo-router'

import {useIsDevMode} from '../../source/lib/use-is-dev-mode'
import {FaqBannerGroup} from '../../source/features/faqs/banner'
import {FAQ_TARGETS} from '../../source/features/faqs/constants'

import {CredentialsLoginSection} from '../../source/features/settings/screens/overview/login-credentials'
import {MiscellanySection} from '../../source/features/settings/screens/overview/miscellany'
import {SupportSection} from '../../source/features/settings/screens/overview/support'
import {DeveloperSection} from '../../source/features/settings/screens/overview/developer'
import {IconSettingsView} from '../../source/features/settings/screens/change-icon'

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

export default function SettingsRootPage(): React.ReactNode {
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
							<FaqBannerGroup style={styles.banner} target={FAQ_TARGETS.SETTINGS_ROOT} />
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
