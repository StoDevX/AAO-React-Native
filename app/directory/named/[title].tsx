import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Button, Host, List, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	buttonStyle,
	controlSize,
	font,
	foregroundStyle,
	frame,
	listStyle,
	multilineTextAlignment,
	padding,
	scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers'

import {SheetCloseButton} from '../../../source/components/sheet-close-button'
import {contactByTitleOptions} from '../../../source/features/directory/contacts-query'
import {useBranding} from '../../../source/features/campus/branding'
import {useCampus} from '../../../source/features/campus/store'
import {remoteImage, type RemoteImage} from '../../../source/lib/remote-images'
import {useImageFailure} from '../../../source/lib/use-image-failure'
import {callPhone} from '../../../source/components/call-phone'
import {openUrl} from '@frogpond/open-url'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {FILL_WIDTH} from '../../../source/components/tile-layout'
import {SECTION_GAP, SHEET_ROW} from '../../../source/components/place-card/card-style'
import {InsetImageRow} from '../../../source/components/inset-image-row'
import {MarkdownRow} from '../../../source/components/markdown-row'

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
	let {
		data: contact,
		error,
		isLoading,
		refetch,
	} = useQuery(contactByTitleOptions(title, useCampus()))

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
				<LoadErrorView error={error} onRetry={refetch} />
			</>
		)
	}

	if (!contact) {
		return (
			<>
				{screenTitle}
				<NoticeView systemImage="questionmark.circle" title="Contact Not Found" />
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

	let headerImage = contact.image ? remoteImage('contacts', contact.image) : null

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
	contact: {text: string; buttonText: string; buttonLink?: string}
	headerImage: RemoteImage | null
	onPress: () => void
}): React.ReactNode {
	// A photo that cannot be fetched leaves its row out, as no photo does.
	let [imageFailed, onImageError] = useImageFailure(headerImage?.uri)
	let {appName} = useBranding()

	return (
		<Host style={styles.host}>
			<List modifiers={[listStyle('plain'), scrollContentBackground('hidden')]}>
				{headerImage && !imageFailed ? (
					<Section>
						<InsetImageRow onError={onImageError} source={headerImage} />
					</Section>
				) : null}

				<Section>
					<MarkdownRow source={contact.text} />

					<VStack modifiers={ACTION_ROW}>
						<Button
							modifiers={[buttonStyle('bordered'), controlSize('large')]}
							onPress={onPress}
							label={contact.buttonText}
							// A link opens in the browser; otherwise the button places a call.
							systemImage={contact.buttonLink ? 'safari' : 'phone.fill'}
						/>
					</VStack>

					<Text modifiers={FOOTER_ROW}>Collected by the humans of {appName}</Text>
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
})
