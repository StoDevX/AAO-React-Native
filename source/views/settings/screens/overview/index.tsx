import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'
import {Form, Host, RNHostView} from '@expo/ui/swift-ui'
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
				{/* The banner is still React Native, so it has to be hosted back
				    into SwiftUI to scroll with the rest of the content. */}
				<RNHostView matchContents={true}>
					<FaqBannerGroup
						style={styles.banner}
						target={FAQ_TARGETS.SETTINGS_ROOT}
					/>
				</RNHostView>

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
