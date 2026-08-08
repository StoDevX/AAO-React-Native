import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Button, Form, Host, Section, TextField} from '@expo/ui/swift-ui'
import {
	autocorrectionDisabled,
	disabled,
	keyboardType,
	lineLimit,
	textContentType,
	textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {submitReport} from './submit'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Report a Problem',
	presentation: 'modal',
	headerLeft: () => <CloseScreenButton title="Cancel" />,
}

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
		<Host style={styles.host}>
			<Form>
				<Section title="Description">
					<TextField
						axis="vertical"
						modifiers={[lineLimit({min: 3, max: 8})]}
						onTextChange={setMessage}
						placeholder="What's the problem? What did you expect?"
					/>
				</Section>
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
				<Section>
					<Button
						label="Send"
						modifiers={[disabled(message.trim().length === 0)]}
						onPress={submit}
					/>
				</Section>
			</Form>
		</Host>
	)
}
