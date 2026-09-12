import * as React from 'react'
import {Alert, useWindowDimensions} from 'react-native'
import {type UseQueryResult} from '@tanstack/react-query'
import {
	Button,
	Grid,
	HStack,
	Image as UIImage,
	ProgressView,
	Spacer,
	Text as UIText,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityElement,
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {ContactTile} from '../../../source/features/directory/tile'
import {columnsForFontScale, inRows, TILE_SPACING} from '../../../source/components/tile-layout'
import type {ContactType} from '../../../source/features/directory/types'
import {FILL_WIDTH, SCREEN_MARGIN} from '../../../source/features/home/button'

/// Mirrored by TestIdentifiers.Directory.contactGrid.
const CONTACT_GRID_ID = 'directory-contact-grid'
const STALE_CONTACTS_LABEL = 'Contacts may be out of date'

export function ImportantContactsGrid({
	query,
	onSelectContact,
}: {
	query: UseQueryResult<ContactType[], Error>
	onSelectContact: (contact: ContactType) => void
}): React.ReactNode {
	const {
		data: contacts,
		error: contactsError,
		isLoading: contactsLoading,
		refetch: refetchContacts,
	} = query
	let {fontScale} = useWindowDimensions()
	let columns = columnsForFontScale(fontScale)

	let showContactsError = React.useCallback(() => {
		Alert.alert(
			"Couldn't refresh contacts",
			contactsError instanceof Error ? contactsError.message : 'Unknown error',
			[
				{text: 'Try Again', onPress: () => void refetchContacts()},
				{text: 'OK', style: 'cancel'},
			],
		)
	}, [contactsError, refetchContacts])

	return (
		<VStack
			modifiers={[
				listRowBackground('clear'),
				listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
				listRowSeparator('hidden'),
				// Horizontal + top only: the enclosing List owns the gap down
				// to the Departments section below.
				padding({horizontal: SCREEN_MARGIN, top: SCREEN_MARGIN}),
				frame({maxWidth: FILL_WIDTH}),
			]}
			spacing={TILE_SPACING}
		>
			<HStack modifiers={[frame({maxWidth: FILL_WIDTH})]}>
				<UIText modifiers={[font({textStyle: 'headline'})]}>Important Contacts</UIText>
				<Spacer />
				{contactsError && contacts ? (
					<Button
						modifiers={[buttonStyle('plain'), accessibilityLabel(STALE_CONTACTS_LABEL)]}
						onPress={showContactsError}
					>
						<UIImage color={c.orange} systemName="exclamationmark.triangle.fill" />
					</Button>
				) : null}
			</HStack>

			{contacts ? (
				<Grid
					alignment="top"
					horizontalSpacing={TILE_SPACING}
					// The Grid itself carries no accessibility presence of its
					// own, so accessibilityIdentifier alone lands on its first
					// button descendant instead of the grid -- contain() gives it
					// one, keeping the tiles as its individually-navigable
					// children, which is what a UI test counting them needs.
					modifiers={[accessibilityElement('contain'), accessibilityIdentifier(CONTACT_GRID_ID)]}
					verticalSpacing={TILE_SPACING}
				>
					{inRows(contacts, columns).map((row, i) => (
						<Grid.Row key={i}>
							{row.map((contact) => (
								<ContactTile
									key={contact.title}
									contact={contact}
									onPress={() => onSelectContact(contact)}
								/>
							))}
							{/* A short last row leaves its columns empty rather than
                                stretching the tiles in it. 8 contacts divide evenly by
                                4 and 2 columns but not by 3, so this padding matters at
                                every column count, not just the edge cases. */}
							{Array.from({length: columns - row.length}, (_, j) => (
								<Spacer key={j} />
							))}
						</Grid.Row>
					))}
				</Grid>
			) : contactsLoading ? (
				<ProgressView />
			) : (
				<UIText modifiers={[foregroundStyle(c.secondaryLabel)]}>
					Contacts are unavailable. Pull to try again.
				</UIText>
			)}
		</VStack>
	)
}
