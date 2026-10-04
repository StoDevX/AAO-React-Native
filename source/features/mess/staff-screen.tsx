import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {Host, List, ScrollView, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	font,
	frame,
	listStyle,
	padding,
	refreshable,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'
import {TileGrid, useTileColumns, useTileWidth} from '../../components/tile-grid'
import {FILL_WIDTH, SCREEN_MARGIN, TILE_SPACING} from '../../components/tile-layout'
import {PersonHeader} from '../directory/person-header'
import {PersonTile} from '../directory/person-tile'
import {groupStaff, photoSubjectOf} from './lib/staff'
import {MessPage, UnloadedPage} from './mess-page'
import {PageMessage} from './page-notice'
import {messStaffOptions} from './query'
import type {StaffProfile} from './types'

/** Begins the name of each tile of the staff directory, which ends in its profile's id, for a UI test. */
export const STAFF_TILE_PREFIX = 'mess-staff-tile-'

const HEADING = [font({textStyle: 'headline'}), accessibilityAddTraits(['isHeader'])]
const BIO = [textSelection(true)]
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
	let columns = useTileColumns()
	let tileWidth = useTileWidth(columns)

	return (
		<>
			<Stack.Screen options={{title: 'Staff'}} />
			{staff.data?.length === 0 ? (
				<MessPage color={c.systemBackground} onRefresh={() => staff.refetch()}>
					<PageMessage text="The Messenger has listed no staff yet." />
				</MessPage>
			) : staff.data ? (
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
												testID={`${STAFF_TILE_PREFIX}${person.id}`}
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
				<UnloadedPage color={c.systemBackground} query={staff} />
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
	// A refetch can move the list on to a new year without this person, so the page keeps showing
	// whom it last found rather than turning into Not Found while it is open.
	let [lastFound, setLastFound] = React.useState<StaffProfile | null>(null)
	let listed = staff.data?.find((p) => String(p.id) === id)
	if (listed && listed !== lastFound) setLastFound(listed)
	let person = listed ?? (lastFound && String(lastFound.id) === id ? lastFound : undefined)

	if (!staff.data) {
		return (
			<>
				<Stack.Screen options={{title: ''}} />
				<UnloadedPage color={c.systemGroupedBackground} query={staff} />
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
						<PersonHeader person={photoSubjectOf(person)} subtitle={person.role} />
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
