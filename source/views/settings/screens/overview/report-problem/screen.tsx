import * as React from 'react'
import {Button, Form, Section, TextField} from '@expo/ui/swift-ui'
import {disabled} from '@expo/ui/swift-ui/modifiers'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {submitReport} from './submit'

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
		<Form>
			<Section title="Description">
				<TextField
					axis="vertical"
					onTextChange={setMessage}
					placeholder="What's the problem? What did you expect?"
				/>
			</Section>
			<Section title="Contact (optional)">
				<TextField onTextChange={setName} placeholder="Name" />
				<TextField onTextChange={setEmail} placeholder="Email" />
			</Section>
			<Section>
				<Button
					label="Send"
					modifiers={[disabled(message.trim().length === 0)]}
					onPress={submit}
				/>
			</Section>
		</Form>
	)
}
