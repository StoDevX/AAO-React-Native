import * as React from 'react'
import {Alert} from 'react-native'
import {type UseQueryResult} from '@tanstack/react-query'
import {
	Button,
	HStack,
	Image as UIImage,
	ProgressView,
	Text as UIText,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {ContactTile} from '../../../source/features/directory/tile'
import {FILL_WIDTH, TILE_SPACING} from '../../../source/components/tile-layout'
import {TileGrid} from '../../../source/components/tile-grid'
import type {ContactType} from '../../../source/features/directory/types'

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
				frame({maxWidth: FILL_WIDTH}),
			]}
			spacing={TILE_SPACING}
		>
			<HStack modifiers={[frame({maxWidth: FILL_WIDTH})]}>
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
				<TileGrid
					accessibilityId={CONTACT_GRID_ID}
					items={contacts}
					keyForItem={(contact) => contact.title}
					renderItem={(contact) => (
						<ContactTile contact={contact} onPress={() => onSelectContact(contact)} />
					)}
				/>
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
