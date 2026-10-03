import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {Host, HStack, List, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	listStyle,
	refreshable,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'
import {DisclosureRow, type DisclosureRowImage} from '../../components/rows'
import {groupStaff} from './lib/staff'
import {UnloadedPage} from './mess-page'
import {messStaffOptions} from './query'
import {RemotePhoto} from './remote-photo'
import type {StaffProfile} from './types'

/** Names every row of the staff directory, for a UI test. */
export const STAFF_ROW_ID = 'mess-staff-row'

/** The face beside each name, at the college directory's size. */
const THUMBNAIL_SIZE = 35
/** The photo on a person's page, at the college directory's width. */
const PHOTO_WIDTH = 80

const NAME = [font({textStyle: 'title2', weight: 'semibold'}), foregroundStyle(c.label)]
const ROLE = [font({textStyle: 'subheadline'}), foregroundStyle(c.secondaryLabel)]
const BIO = [textSelection(true)]
const NAME_COLUMN = [frame({maxWidth: Infinity, alignment: 'leading'})]

/** A person's photo as a row's thumbnail, or a symbol in its place so every name lines up. */
function thumbnailOf(person: StaffProfile): DisclosureRowImage {
	return person.photo
		? {uri: person.photo.url, width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE}
		: {systemName: 'person.crop.circle', size: THUMBNAIL_SIZE * 0.8, width: THUMBNAIL_SIZE}
}

/**
 * The paper's staff for its newest year, grouped as a masthead lists them, each person a row to
 * their own page.
 */
export function StaffScreen(): React.ReactNode {
	let router = useRouter()
	let staff = useQuery(messStaffOptions)

	return (
		<>
			<Stack.Screen options={{title: 'Staff'}} />
			{staff.data ? (
				<Host style={styles.list}>
					<List
						modifiers={[
							listStyle('insetGrouped'),
							refreshable(async () => {
								await staff.refetch()
							}),
						]}
					>
						{groupStaff(staff.data).map((group) => (
							<Section key={group.title} title={group.title}>
								{group.people.map((person) => (
									<DisclosureRow
										key={person.id}
										detail={[person.role]}
										identifier={STAFF_ROW_ID}
										image={thumbnailOf(person)}
										onPress={() =>
											router.navigate({
												pathname: '/messenger/staff/[id]',
												params: {id: String(person.id)},
											})
										}
										title={person.name}
									/>
								))}
							</Section>
						))}
					</List>
				</Host>
			) : (
				<UnloadedPage query={staff} />
			)}
		</>
	)
}

/**
 * One person on the staff: their name and role beside their photo, then their bio. Read from the
 * directory's list, so a page opened from it needs no fetch of its own.
 */
export function StaffMemberScreen({id}: {id: string}): React.ReactNode {
	let staff = useQuery(messStaffOptions)
	let person = staff.data?.find((p) => String(p.id) === id)

	if (!staff.data) {
		return (
			<>
				<Stack.Screen options={{title: ''}} />
				<UnloadedPage query={staff} />
			</>
		)
	}

	if (!person) {
		return (
			<>
				<Stack.Screen options={{title: ''}} />
				<NoticeView systemImage="questionmark.circle" title="Staff Member Not Found" />
			</>
		)
	}

	let photoHeight = person.photo ? (PHOTO_WIDTH * person.photo.height) / person.photo.width : 0
	return (
		<>
			<Stack.Screen options={{title: person.name}} />
			<Host style={styles.list}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section>
						{/* Name leading, photo trailing, both hung from the top, as the college directory's page */}
						<HStack alignment="top" spacing={12}>
							<VStack alignment="leading" modifiers={NAME_COLUMN} spacing={2}>
								<Text modifiers={NAME}>{person.name}</Text>
								{person.role ? <Text modifiers={ROLE}>{person.role}</Text> : null}
							</VStack>
							{person.photo ? (
								<RemotePhoto height={photoHeight} url={person.photo.url} width={PHOTO_WIDTH} />
							) : null}
						</HStack>
					</Section>
					{person.bio ? (
						<Section title="About">
							<Text modifiers={BIO}>{person.bio}</Text>
						</Section>
					) : null}
				</List>
			</Host>
		</>
	)
}

const styles = StyleSheet.create({
	list: {flex: 1, backgroundColor: c.systemGroupedBackground},
})
