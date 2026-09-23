import * as React from 'react'
import {Alert, StyleSheet} from 'react-native'
import {Form, Host, List, Section, Text, TextField} from '@expo/ui/swift-ui'
import {
	autocorrectionDisabled,
	keyboardType,
	lineLimit,
	textContentType,
	textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers'
import {Stack, useNavigation} from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import noop from 'lodash/noop'

import {ActionRow, DisclosureRow} from '../../source/components/rows'
import {
	MAX_ATTACHMENTS,
	readAttachment,
	type PickedImage,
} from '../../source/features/settings/screens/overview/report-problem/attachments'
import {submitReport} from '../../source/features/settings/screens/overview/report-problem/submit'

/** The edge of an image's thumbnail, in points. */
const THUMBNAIL_SIZE = 44

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
	let [images, setImages] = React.useState<Array<PickedImage>>([])
	let [sending, setSending] = React.useState(false)

	let addImages = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsMultipleSelection: true,
			selectionLimit: MAX_ATTACHMENTS - images.length,
			// Re-encodes a full-resolution photo to a fraction of its size, which
			// is still plenty to read a screenshot or a sign by.
			quality: 0.7,
		})

		if (result.canceled) {
			return
		}

		setImages((current) => [...current, ...result.assets].slice(0, MAX_ATTACHMENTS))
	}

	let removeImage = (uri: string) => {
		setImages((current) => current.filter((image) => image.uri !== uri))
	}

	let confirmRemoveImage = (uri: string) => {
		Alert.alert('Remove this image?', undefined, [
			{text: 'Cancel', style: 'cancel', onPress: noop},
			{text: 'Remove', style: 'destructive', onPress: () => removeImage(uri)},
		])
	}

	let submit = async () => {
		setSending(true)

		let attachments
		try {
			attachments = await Promise.all(images.map(readAttachment))
		} catch {
			setSending(false)
			Alert.alert(
				'Could not attach images',
				'Remove the images and try again, or send the report without them.',
			)
			return
		}

		let submitted = submitReport({
			message: message.trim(),
			name: name.trim() || undefined,
			email: email.trim() || undefined,
			attachments,
		})

		if (submitted) {
			navigation.goBack()
		} else {
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
					disabled={message.trim().length === 0 || sending}
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
					<Section
						footer={
							<Text>{`Screenshots or photos help show the problem. Up to ${MAX_ATTACHMENTS}.`}</Text>
						}
						title="Images (optional)"
					>
						<List.ForEach
							onDelete={(indices) => indices.forEach((index) => removeImage(images[index].uri))}
						>
							{images.map((image, index) => (
								<DisclosureRow
									key={image.uri}
									destination="action"
									image={{uri: image.uri, width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE}}
									onPress={() => confirmRemoveImage(image.uri)}
									title={`Image ${index + 1}`}
								/>
							))}
						</List.ForEach>
						<ActionRow
							disabled={images.length >= MAX_ATTACHMENTS}
							onPress={() => void addImages()}
							title="Add Image"
						/>
					</Section>
				</Form>
			</Host>
		</>
	)
}
