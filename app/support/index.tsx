import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, RNHostView, Section, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import {Stack, useRouter} from 'expo-router'

import {NavigationRow} from '../../source/components/rows'
import {FaqBannerGroup} from '../../source/features/faqs/banner'
import {FAQ_TARGETS} from '../../source/features/faqs/constants'
import {ShareTelemetryToggle} from '../../source/features/telemetry/consent-toggle'

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

/// Where to get help: the FAQs, the notices in force, campus emergency contacts, and the problem report.
export default function SupportPage(): React.ReactNode {
	let router = useRouter()

	return (
		<>
			<Stack.Title>Support</Stack.Title>

			<Host modifiers={[accessibilityIdentifier('screen-support')]} style={styles.host}>
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

					<Section>
						<NavigationRow onPress={() => router.navigate('/faq')} title="FAQs" />
						<NavigationRow onPress={() => router.navigate('/support/notices')} title="Notices" />
						<NavigationRow
							onPress={() => router.navigate('/contacts')}
							title="PubSafe • SARN • 911"
						/>
						<NavigationRow
							onPress={() => router.navigate('/report-problem')}
							title="Send Feedback"
						/>
					</Section>

					<Section>
						<ShareTelemetryToggle />
					</Section>
				</Form>
			</Host>
		</>
	)
}
