import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Host, List} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {NoticeView} from '@frogpond/notice'

import {contactsOptionsFor} from '../source/features/directory/contacts-query'
import {useCampusId, useCampusSection} from '../source/features/campus/store'
import {ImportantContactsGrid} from '../source/features/directory/important-contacts-grid'
import {requiresSection} from '../source/features/campus/section-gate'

/// The curated campus contacts on their own, for the Help group on home. The
/// same grid heads the Directory, where it shares the screen with the
/// department roster.
function ContactsPage(): React.ReactNode {
	let router = useRouter()
	let section = useCampusSection('contacts')
	let {college} = useCampusSection('branding')
	let contacts = useQuery({
		...contactsOptionsFor(useCampusId()),
		enabled: section !== undefined,
	})

	// The route stays reachable by URL on a campus without contacts.
	if (!section) {
		return (
			<>
				<Stack.Title>Contacts</Stack.Title>
				<NoticeView
					description={`The app has no contacts for ${college}.`}
					systemImage="phone"
					title="No Contacts"
				/>
			</>
		)
	}

	return (
		<>
			{/* Named as each campus's home tile names it. */}
			<Stack.Title>{section.title}</Stack.Title>
			<Host matchContents={false} style={styles.host}>
				<List
					modifiers={[
						listStyle('insetGrouped'),
						refreshable(async () => {
							await contacts.refetch()
						}),
					]}
				>
					<ImportantContactsGrid
						onSelectContact={(contact) => {
							router.navigate({
								pathname: '/directory/named/[title]',
								params: {title: contact.title},
							})
						}}
						query={contacts}
					/>
				</List>
			</Host>
		</>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

export default requiresSection(
	'contacts',
	{title: 'Contacts', noun: 'important contacts', systemImage: 'phone'},
	ContactsPage,
)
