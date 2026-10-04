import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Button, Form, HStack, Host, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import {Stack, useRouter} from 'expo-router'

import {callPhone} from '../../source/components/call-phone'
import {NavigationRow} from '../../source/components/rows'
import {FILL_WIDTH} from '../../source/components/tile-layout'
import {FaqBannerSlot} from '../../source/features/faqs/banner'
import {FAQ_TARGETS} from '../../source/features/faqs/constants'
import {ShareTelemetryToggle} from '../../source/features/telemetry/consent-toggle'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

type EmergencyContact = {title: string; phoneNumber: string}

/** Who the emergency buttons call: campus Public Safety, the sexual assault resource network, and 911. */
const EMERGENCY_CONTACTS: EmergencyContact[] = [
	{title: 'PubSafe', phoneNumber: '5077863666'},
	{title: 'SARN', phoneNumber: '5076493367'},
	{title: '911', phoneNumber: '911'},
]

const EMERGENCY_BUTTON = [buttonStyle('bordered'), frame({maxWidth: FILL_WIDTH})]

/// Where to get help: campus emergency contacts, the FAQs, and the problem report.
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
						<FaqBannerSlot target={FAQ_TARGETS.SETTINGS_ROOT} />
					</VStack>

					<HStack
						modifiers={[
							listRowBackground('clear'),
							listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
							listRowSeparator('hidden'),
						]}
						spacing={12}
					>
						{EMERGENCY_CONTACTS.map(({title, phoneNumber}) => (
							<Button
								key={title}
								modifiers={[...EMERGENCY_BUTTON, accessibilityLabel(`Call ${title}`)]}
								onPress={() => callPhone(phoneNumber, {title: `Call ${title}`})}
							>
								<Text>{title}</Text>
							</Button>
						))}
					</HStack>

					<Section>
						<NavigationRow onPress={() => router.navigate('/faq')} title="FAQs" />
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
