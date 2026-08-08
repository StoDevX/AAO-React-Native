import * as React from 'react'
import {
	StyleSheet,
	ScrollView,
	Image,
	View,
	Text,
	TextProps,
	ViewProps,
} from 'react-native'
import {images as contactImages} from '../../../images/contacts'
import {Markdown, type MarkdownStyle} from '@frogpond/markdown'
import {ListFooter} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {callPhone} from '../../components/call-phone'
import {Button} from '@frogpond/button'
import {openUrl} from '@frogpond/open-url'
import {GH_NEW_ISSUE_URL} from '../../lib/constants'
import type {ContactType} from './types'

const paragraphMarkdownStyle: MarkdownStyle = {paragraph: {fontSize: 16}}

const styles = StyleSheet.create({
	image: {
		width: undefined,
		height: 100,
	},
	container: {
		paddingHorizontal: 18,
		paddingVertical: 6,
	},
	title: {
		color: c.label,
		fontSize: 36,
		textAlign: 'center',
		marginHorizontal: 18,
		marginVertical: 10,
	},
})

export const Title = (props: TextProps): React.ReactNode => (
	<Text {...props} style={[styles.title, props.style]} />
)

export const Container = (props: ViewProps): React.ReactNode => (
	<View {...props} style={[styles.container, props.style]} />
)

type Props = {
	contact: ContactType
}

export const ContactsDetailView = ({contact}: Props): React.ReactNode => {
	let onPress = (): void => {
		let {phoneNumber, buttonText, buttonLink} = contact
		if (buttonLink) {
			openUrl(buttonLink)
		} else if (phoneNumber) {
			callPhone(phoneNumber, {title: buttonText})
		}
	}

	let headerImage =
		contact.image && contactImages.has(contact.image)
			? contactImages.get(contact.image)
			: null

	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			{headerImage ? (
				<Image resizeMode="cover" source={headerImage} style={styles.image} />
			) : null}
			<Container>
				<Title selectable={true}>{contact.title}</Title>

				<Markdown
					markdownStyle={paragraphMarkdownStyle}
					source={contact.text}
				/>

				<Button onPress={onPress} title={contact.buttonText} />

				<ListFooter
					href={GH_NEW_ISSUE_URL}
					title="Collected by the humans of All About Olaf"
				/>
			</Container>
		</ScrollView>
	)
}
