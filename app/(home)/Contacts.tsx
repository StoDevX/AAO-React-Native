import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Host, List} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {contactsOptions} from '../../source/features/directory/contacts-query'
import {ImportantContactsGrid} from '../../source/features/directory/important-contacts-grid'

/// The curated campus contacts on their own, for the Help group on home. The
/// same grid heads the Directory, where it shares the screen with the
/// department roster.
export default function ContactsPage(): React.ReactNode {
	let router = useRouter()
	let contacts = useQuery(contactsOptions)

	return (
		<>
			<Stack.Title>Contacts</Stack.Title>
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
								pathname: '/Directory/named/[title]',
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
