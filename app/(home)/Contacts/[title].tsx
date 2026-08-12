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
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {contactByTitleOptions} from '../../../source/features/contacts/query'
import {images as contactImages} from '../../../images/contacts'
import {Markdown, type MarkdownStyle} from '@frogpond/markdown'
import {ListFooter} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {callPhone} from '../../../source/components/call-phone'
import {Button} from '@frogpond/button'
import {openUrl} from '@frogpond/open-url'
import {GH_NEW_ISSUE_URL} from '../../../source/lib/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'

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

const Title = (props: TextProps): React.ReactNode => (
	<Text {...props} style={[styles.title, props.style]} />
)

const Container = (props: ViewProps): React.ReactNode => (
	<View {...props} style={[styles.container, props.style]} />
)

export default function ContactsDetailPage(): React.ReactNode {
	let {title} = useLocalSearchParams<{title: string}>()
	let {
		data: contact,
		error,
		isLoading,
		refetch,
	} = useQuery(contactByTitleOptions(title))

	// Set from the route param immediately, then from the resolved contact
	// once it loads -- so the header never falls back to the raw route name
	// while loading, erroring, or failing to find the contact.
	let screenTitle = <Stack.Title>{contact?.title ?? title}</Stack.Title>

	if (isLoading) {
		return (
			<>
				{screenTitle}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screenTitle}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!contact) {
		return (
			<>
				{screenTitle}
				<NoticeView text={`Could not find contact "${title}".`} />
			</>
		)
	}

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
		<>
			{screenTitle}
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
		</>
	)
}
