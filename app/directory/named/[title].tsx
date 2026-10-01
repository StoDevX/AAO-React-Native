import * as React from 'react'
import {StyleSheet, Image, View} from 'react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Button, Host, List, RNHostView, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	buttonStyle,
	controlSize,
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	listStyle,
	multilineTextAlignment,
	onGeometryChange,
	padding,
	scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers'

import {SheetCloseButton} from '../../../source/components/sheet-close-button'
import {contactByTitleOptions} from '../../../source/features/directory/contacts-query'
import {images as contactImages} from '../../../images/contacts'
import {Markdown} from '@frogpond/markdown'
import {callPhone} from '../../../source/components/call-phone'
import {openUrl} from '@frogpond/open-url'
import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {FILL_WIDTH} from '../../../source/components/tile-layout'
import {
	CARD_INSET,
	PICTURE_CORNER_RADIUS,
	SECTION_GAP,
} from '../../../source/components/place-card/card-style'

/// A row on the sheet, inset from its sides like the Hours sheet's, with a
/// section's gap above it and no hairline.
const SHEET_ROW = [
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: SECTION_GAP, leading: CARD_INSET, bottom: 0, trailing: CARD_INSET}),
]

const ACTION_ROW = [frame({maxWidth: FILL_WIDTH}), ...SHEET_ROW]

const FOOTER_ROW = [
	font({textStyle: 'caption2'}),
	foregroundStyle(c.secondaryLabel),
	multilineTextAlignment('center'),
	frame({maxWidth: FILL_WIDTH}),
	padding({bottom: SECTION_GAP}),
	...SHEET_ROW,
]

export default function ContactsDetailPage(): React.ReactNode {
	let {title} = useLocalSearchParams<{title: string}>()
	let {data: contact, error, isLoading, refetch} = useQuery(contactByTitleOptions(title))

	// Set from the route param immediately, then from the resolved contact
	// once it loads -- so the header never falls back to the raw route name
	// while loading, erroring, or failing to find the contact. It is the
	// screen's only copy of the name: the header title, rather than a static
	// heading repeated in the body.
	let screenTitle = (
		<>
			<Stack.Title>{contact?.title ?? title}</Stack.Title>
			<SheetCloseButton />
		</>
	)

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
					text={`A problem occurred while loading: ${
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
		contact.image && contactImages.has(contact.image) ? contactImages.get(contact.image) : null

	return (
		<>
			{screenTitle}
			<ContactBody headerImage={headerImage} onPress={onPress} contact={contact} />
		</>
	)
}

/**
 * The contact's photo, text and action, laid out as the Hours sheet lays out
 * a building: each inset from the sheet's sides, the photo with rounded
 * corners.
 */
function ContactBody({
	contact,
	headerImage,
	onPress,
}: {
	contact: {text: string; buttonText: string}
	headerImage: React.ComponentProps<typeof Image>['source'] | null | undefined
	onPress: () => void
}): React.ReactNode {
	// A hosted view is given the row's width outright: 100% inside RNHostView
	// resolves against the whole sheet, and a paragraph's own width is however
	// long its longest line would be unwrapped. The row fills its width
	// whatever its content's, so measuring it can't feed back on itself.
	let [rowWidth, setRowWidth] = React.useState(0)
	// The list's row modifiers go last: outside the frame, where the list reads
	// them.
	let hostedRow = [
		frame({maxWidth: FILL_WIDTH}),
		onGeometryChange((box) => setRowWidth(box.width)),
		...SHEET_ROW,
	]

	return (
		<Host style={styles.host}>
			<List modifiers={[listStyle('plain'), scrollContentBackground('hidden')]}>
				{headerImage ? (
					<Section>
						{/* On a wrapping stack because RNHostView takes no modifiers of
						    its own. */}
						<VStack modifiers={hostedRow}>
							<RNHostView matchContents={true}>
								<Image
									accessibilityIgnoresInvertColors={true}
									resizeMode="cover"
									source={headerImage}
									style={[styles.image, {width: rowWidth}]}
								/>
							</RNHostView>
						</VStack>
					</Section>
				) : null}

				<Section>
					<VStack modifiers={hostedRow}>
						<RNHostView matchContents={true}>
							<View style={{width: rowWidth}}>
								<Markdown source={contact.text} />
							</View>
						</RNHostView>
					</VStack>

					<VStack modifiers={ACTION_ROW}>
						<Button
							modifiers={[buttonStyle('bordered'), controlSize('large')]}
							onPress={onPress}
							label={contact.buttonText}
						/>
					</VStack>

					<Text modifiers={FOOTER_ROW}>Collected by the humans of All About Olaf</Text>
				</Section>
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
	image: {
		height: 100,
		borderRadius: PICTURE_CORNER_RADIUS,
	},
})
