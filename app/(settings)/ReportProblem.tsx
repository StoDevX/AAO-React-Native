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

	let submit = () => {
		let submitted = submitReport({
			message: message.trim(),
			name: name.trim() || undefined,
			email: email.trim() || undefined,
		})

		if (submitted) {
			navigation.goBack()
		} else {
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
					disabled={message.trim().length === 0}
					icon="paperplane"
					onPress={submit}
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
				</Form>
			</Host>
		</>
	)
}
