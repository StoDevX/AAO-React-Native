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

import {ImageAttachmentsSection} from '../../source/components/image-attachments-section'
import {useImageAttachments} from '../../source/components/use-image-attachments'
import {readAttachment} from '../../source/features/settings/screens/overview/report-problem/attachments'
import {submitReport} from '../../source/features/settings/screens/overview/report-problem/submit'

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

	let submit = async () => {
		if (sendingNow.current) {
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

		let submitted = submitReport({
			message: message.trim(),
			name: name.trim() || undefined,
			email: email.trim() || undefined,
			attachments: files,
		})

		if (submitted) {
			navigation.goBack()
		} else {
			sendingNow.current = false
			setSending(false)
			Alert.alert('Sentry is disabled', 'Problem reporting only works in production builds.')
		}
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
