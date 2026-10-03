import * as React from 'react'
import {StyleSheet, useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, useRouter} from 'expo-router'
import {Host, HStack, List, ScrollView, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	listStyle,
	padding,
	refreshable,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'
import {TileGrid, useTileColumns} from '../../components/tile-grid'
import {FILL_WIDTH, SCREEN_MARGIN, TILE_SPACING} from '../../components/tile-layout'
import {PersonPhoto} from '../directory/person-photo'
import {PersonTile} from '../directory/person-tile'
import {groupStaff, photoSubjectOf} from './lib/staff'
import {UnloadedPage} from './mess-page'
import {messStaffOptions} from './query'

/** Names every tile of the staff directory, for a UI test. */
export const STAFF_TILE_ID = 'mess-staff-tile'

/** The photo on a person's page, at the college directory's width. */
const PHOTO_WIDTH = 80

const HEADING = [font({textStyle: 'headline'})]
const NAME = [font({textStyle: 'title2', weight: 'semibold'}), foregroundStyle(c.label)]
const ROLE = [font({textStyle: 'subheadline'}), foregroundStyle(c.secondaryLabel)]
const BIO = [textSelection(true)]
const NAME_COLUMN = [frame({maxWidth: Infinity, alignment: 'leading'})]
const COLUMN = [
	padding({leading: SCREEN_MARGIN, trailing: SCREEN_MARGIN, top: SCREEN_MARGIN}),
	frame({maxWidth: FILL_WIDTH}),
]

/**
 * The paper's staff for its newest year as the college directory's tiles, grouped as a masthead
 * lists them under a heading each. A tile shows a face and a name; the role waits for the
 * person's own page.
 */
export function StaffScreen(): React.ReactNode {
	let router = useRouter()
	let staff = useQuery(messStaffOptions)
	let {width: screenWidth} = useWindowDimensions()
	// The scroll view keeps its content inside the safe area, so in landscape the columns share
	// the width left once the notch's side insets are taken, as the directory's grid does.
	let insets = useSafeAreaInsets()
	let columns = useTileColumns()
	let contentWidth = screenWidth - insets.left - insets.right
	// A Grid sizes a cell to its content, so a lone tile in a short row would fill the screen;
	// every tile is pinned to a column's width instead.
	let tileWidth = (contentWidth - 2 * SCREEN_MARGIN - (columns - 1) * TILE_SPACING) / columns

	return (
		<>
			<Stack.Screen options={{title: 'Staff'}} />
			{staff.data ? (
				<Host matchContents={false} style={styles.grid}>
					<ScrollView
						modifiers={[
							refreshable(async () => {
								await staff.refetch()
							}),
						]}
					>
						<VStack alignment="leading" modifiers={COLUMN} spacing={TILE_SPACING * 2}>
							{groupStaff(staff.data).map((group) => (
								<VStack key={group.title} alignment="leading" spacing={TILE_SPACING}>
									<Text modifiers={HEADING}>{group.title}</Text>
									<TileGrid
										accessibilityId={`mess-staff-${group.title}`}
										columns={columns}
										items={group.people}
										keyForItem={(person) => person.id}
										renderItem={(person) => (
											<PersonTile
												onPress={() =>
													router.navigate({
														pathname: '/messenger/staff/[id]',
														params: {id: String(person.id)},
													})
												}
												person={photoSubjectOf(person)}
												testID={STAFF_TILE_ID}
												width={tileWidth}
											/>
										)}
									/>
								</VStack>
							))}
						</VStack>
					</ScrollView>
				</Host>
			) : (
				<UnloadedPage query={staff} />
			)}
		</>
	)
}

/**
 * One person on the staff: their name and role beside their photo, as the college directory's
 * page sets them, then their bio. Read from the directory's list, so a page opened from it needs
 * no fetch of its own.
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

	return (
		<>
			<Stack.Screen options={{title: person.name}} />
			<Host style={styles.page}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section>
						{/* Name leading, photo trailing, both hung from the top, so a long name wraps
						    down the left of the photo rather than pushing it about */}
						<HStack alignment="top" spacing={12}>
							<VStack alignment="leading" modifiers={NAME_COLUMN} spacing={2}>
								<Text modifiers={NAME}>{person.name}</Text>
								{person.role ? <Text modifiers={ROLE}>{person.role}</Text> : null}
							</VStack>
							<PersonPhoto person={photoSubjectOf(person)} width={PHOTO_WIDTH} />
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
	grid: {flex: 1, backgroundColor: c.systemBackground},
	page: {flex: 1, backgroundColor: c.systemGroupedBackground},
})
