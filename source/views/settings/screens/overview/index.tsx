import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'
import {Form, Host, RNHostView, VStack} from '@expo/ui/swift-ui'
import {
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {useIsDevMode} from '../../../../lib/use-is-dev-mode'
import {FaqBannerGroup} from '../../../faqs'
import {FAQ_TARGETS} from '../../../faqs/constants'

import {CredentialsLoginSection} from './login-credentials'
import {MiscellanySection} from './miscellany'
import {SupportSection} from './support'
import {DeveloperSection} from './developer'
import {IconSettingsView} from '../change-icon'

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

	// SwiftUI's Form owns the scrolling. Wrapping this in a React Native
	// ScrollView instead puts that scroll view between the touch and the
	// SwiftUI rows, the way it does on the home screen.
	return (
		<Host style={styles.host}>
			<Form>
				{/* The banner is a React Native view, so it has to be hosted into
				    SwiftUI to scroll with the rest of the content. A Form dresses
				    each child as a grouped row -- inset, on a filled rounded card,
				    above a separator -- which would frame the banner a second time,
				    so this row is stripped back to bare content. */}
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
	)
}

export {SettingsView as View}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Settings',
	headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
}
