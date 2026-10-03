import * as React from 'react'
import {Alert, StyleSheet} from 'react-native'
import {Form, Host, Section, TextField} from '@expo/ui/swift-ui'
import {
	autocorrectionDisabled,
	keyboardType,
	lineLimit,
	textContentType,
	textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers'
import {Stack, useNavigation} from 'expo-router'

import {ImageAttachmentsSection} from '../source/components/image-attachments-section'
import {useImageAttachments} from '../source/components/use-image-attachments'
import {readAttachment} from '../source/features/support/report-problem/attachments'
import {composeEmail} from '../source/components/send-email'
import {reportEmail, submitReport} from '../source/features/support/report-problem/submit'
import {useTelemetryStore} from '../source/features/telemetry/store'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

export default function ReportProblemPage(): React.ReactNode {
	let navigation = useNavigation()

	let [message, setMessage] = React.useState('')
	let [name, setName] = React.useState('')
	let [email, setEmail] = React.useState('')
	let attachments = useImageAttachments()
	let [sending, setSending] = React.useState(false)

	// Refs, not state: a second tap can land before the render that disables
	// Submit, and a read can finish after the screen has closed.
	let sendingNow = React.useRef(false)
	let closed = React.useRef(false)
	React.useEffect(() => {
		closed.current = false
		return () => {
			closed.current = true
		}
	}, [])

	let report = () => ({
		message: message.trim(),
		name: name.trim() || undefined,
		email: email.trim() || undefined,
	})

	// Sharing is off, so Sentry is closed and the report can't go that way.
	let offerEmail = () => {
		Alert.alert(
			'Sharing is off',
			'Problem reports go through the same service as crash data, which you turned off. Send this report by email instead?',
			[
				{text: 'Cancel', style: 'cancel'},
				{
					text: 'Send by Email',
					onPress: async () => {
						let handedOff = await composeEmail({
							...reportEmail(report()),
							attachments: attachments.images.map((image) => image.uri),
						})
						if (handedOff) {
							navigation.goBack()
						}
					},
				},
			],
		)
	}

	let submit = async () => {
		if (sendingNow.current) {
			return
		}

		// Decided before the images are read: reading one goes through Sentry's
		// native side, which opting out has closed, and email needs only its
		// address.
		if (!useTelemetryStore.getState().enabled) {
			offerEmail()
			return
		}

		sendingNow.current = true
		setSending(true)

		let files
		try {
			files = await Promise.all(attachments.images.map(readAttachment))
		} catch {
			sendingNow.current = false
			setSending(false)
			Alert.alert(
				'Could not attach images',
				'Remove the images and try again, or send the report without them.',
			)
			return
		}

		// Closing the screen while the images were read is a cancel.
		if (closed.current) {
			return
		}

		let result = submitReport({...report(), attachments: files})

		if (result === 'sent') {
			navigation.goBack()
			return
		}

		sendingNow.current = false
		setSending(false)

		if (result === 'disabled') {
			Alert.alert('Sentry is disabled', 'Problem reporting only works in production builds.')
			return
		}

		offerEmail()
	}

	return (
		<>
			<Stack.Title>Report a Problem</Stack.Title>
			<Stack.Toolbar placement="left">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Submit"
					disabled={message.trim().length === 0 || sending || attachments.picking}
					icon="paperplane"
					onPress={() => void submit()}
				/>
			</Stack.Toolbar>

			<Host style={styles.host}>
				<Form>
					<Section title="Contact (optional)">
						<TextField
							modifiers={[textInputAutocapitalization('words'), textContentType('name')]}
							onTextChange={setName}
							placeholder="Name"
						/>
						<TextField
							modifiers={[
								keyboardType('email-address'),
								textContentType('emailAddress'),
								textInputAutocapitalization('never'),
								autocorrectionDisabled(),
							]}
							onTextChange={setEmail}
							placeholder="Email"
						/>
					</Section>
					<Section title="Description">
						<TextField
							axis="vertical"
							modifiers={[lineLimit({min: 3, max: 80})]}
							onTextChange={setMessage}
							placeholder="What's the problem? What did you expect?"
						/>
					</Section>
					<ImageAttachmentsSection attachments={attachments} title="Images (optional)" />
				</Form>
			</Host>
		</>
	)
}
