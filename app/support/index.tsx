import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Button, Form, HStack, Host, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	disabled,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import {Stack, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {callPhone} from '../../source/components/call-phone'
import {NavigationRow} from '../../source/components/rows'
import {FILL_WIDTH} from '../../source/components/tile-layout'
import {contactsOptions} from '../../source/features/directory/contacts-query'
import {FaqBannerSlot} from '../../source/features/faqs/banner'
import {FAQ_TARGETS} from '../../source/features/faqs/constants'
import {ShareTelemetryToggle} from '../../source/features/telemetry/consent-toggle'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

type EmergencyButton = {title: string; phoneNumber?: string}

/// 911 is the one number that never changes, so it is the only one written here.
const EMERGENCY_NUMBER = '911'

/// Titles of the contacts, in data/contact-info/, whose numbers the buttons dial.
const PUBSAFE = 'PubSafe'
const SARN = 'SARN'

const EMERGENCY_BUTTON = [buttonStyle('bordered'), frame({maxWidth: FILL_WIDTH})]

/// Where to get help: campus emergency contacts, the FAQs, and the problem report.
export default function SupportPage(): React.ReactNode {
	let router = useRouter()
	let {data: contacts} = useQuery(contactsOptions)

	let numberFor = (title: string) =>
		contacts?.find((contact) => contact.title === title)?.phoneNumber
	let buttons: EmergencyButton[] = [
		{title: PUBSAFE, phoneNumber: numberFor(PUBSAFE)},
		{title: SARN, phoneNumber: numberFor(SARN)},
		{title: EMERGENCY_NUMBER, phoneNumber: EMERGENCY_NUMBER},
	]

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
						{buttons.map(({title, phoneNumber}) => (
							<Button
								key={title}
								modifiers={[
									...EMERGENCY_BUTTON,
									accessibilityLabel(`Call ${title}`),
									disabled(!phoneNumber),
								]}
								onPress={() => phoneNumber && callPhone(phoneNumber, {title: `Call ${title}`})}
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
