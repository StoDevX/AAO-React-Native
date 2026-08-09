import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, Section, TextField} from '@expo/ui/swift-ui'
import {
	autocorrectionDisabled,
	keyboardType,
	lineLimit,
	textContentType,
	textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers'
import {Stack, useNavigation} from 'expo-router'
import {submitReport} from './submit'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

export let ReportProblemView = (): React.ReactNode => {
	let navigation = useNavigation()

	let [message, setMessage] = React.useState('')
	let [name, setName] = React.useState('')
	let [email, setEmail] = React.useState('')

	let submit = () => {
		submitReport({
			message: message.trim(),
			name: name.trim() || undefined,
			email: email.trim() || undefined,
		})
		navigation.goBack()
	}

	return (
		<>
			<Stack.Screen>
				<Stack.Title>Report a Problem</Stack.Title>
				<Stack.Toolbar placement="left">
					<Stack.Toolbar.Button
						icon="xmark"
						onPress={() => navigation.goBack()}
					/>
				</Stack.Toolbar>
				<Stack.Toolbar placement="right">
					<Stack.Toolbar.Button
						disabled={message.trim().length === 0}
						icon="paperplane"
						onPress={submit}
					/>
				</Stack.Toolbar>
			</Stack.Screen>

			<Host style={styles.host}>
				<Form>
					<Section title="Contact (optional)">
						<TextField
							modifiers={[
								textInputAutocapitalization('words'),
								textContentType('name'),
							]}
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
