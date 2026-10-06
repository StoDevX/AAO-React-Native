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
import {FILL_WIDTH, SCREEN_MARGIN, TILE_SPACING} from '../../source/components/tile-layout'
import {contactsOptions} from '../../source/features/directory/contacts-query'
import {FaqBannerSlot} from '../../source/features/faqs/banner'
import {FAQ_TARGETS} from '../../source/features/faqs/constants'
import {ShareTelemetryToggle} from '../../source/features/telemetry/consent-toggle'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
	// Above the Form, which insets its rows by about `SCREEN_MARGIN`.
	banner: {
		marginHorizontal: SCREEN_MARGIN,
		marginTop: TILE_SPACING,
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

			<Host matchContents={false} style={styles.host}>
				<VStack spacing={0}>
					{/* Above the Form rather than a row in it: a row with nothing
					    in it, as when there is no banner, still takes a row's
					    minimum height. */}
					<FaqBannerSlot style={styles.banner} target={FAQ_TARGETS.SETTINGS_ROOT} />
					{/* On the Form, not the Host: a Host's identifier reaches each
					    child of the stack, and the empty banner slot would be found first. */}
					<Form modifiers={[accessibilityIdentifier('screen-support')]}>
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
				</VStack>
			</Host>
		</>
	)
}
