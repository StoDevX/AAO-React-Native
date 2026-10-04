import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {Host, List, ScrollView, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listStyle,
	padding,
	refreshable,
	scrollContentBackground,
	textSelection,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {NoticeView} from '@frogpond/notice'
import {TileGrid, useTileColumns, useTileWidth} from '../../components/tile-grid'
import {FILL_WIDTH, SCREEN_MARGIN, TILE_SPACING} from '../../components/tile-layout'
import {PersonHeader} from '../directory/person-header'
import {PersonTile} from '../directory/person-tile'
import {groupStaff, photoSubjectOf} from './lib/staff'
import {MessPage, UnloadedPage, PAPER_BAR, PaperTitle} from './mess-page'
import {PageMessage} from './page-notice'
import {ink, paper, paperTypeface, wash} from './palette'
import {messStaffOptions} from './query'
import {SECTION_HEADING} from './story-blocks'
import type {StaffProfile} from './types'

/** Begins the name of each tile of the staff directory, which ends in its profile's id, for a UI test. */
export const STAFF_TILE_PREFIX = 'mess-staff-tile-'

const BIO = [font({textStyle: 'body', design: 'serif'}), foregroundStyle(ink), textSelection(true)]
const SECTION = [listRowBackground(wash)]
const COLUMN = [
	padding({leading: SCREEN_MARGIN, trailing: SCREEN_MARGIN, top: SCREEN_MARGIN}),
	frame({maxWidth: FILL_WIDTH}),
]

/**
 * The paper's staff for its newest year as the college directory's tiles, grouped as a masthead
 * lists them under a heading each. A tile shows a face and a name; the role waits for the
 * person's own page. Titled with the year the staff is from.
 */
export function StaffScreen(): React.ReactNode {
	let router = useRouter()
	let staff = useQuery(messStaffOptions)
	let columns = useTileColumns()
	let tileWidth = useTileWidth(columns)

	return (
		<>
			<Stack.Screen options={PAPER_BAR} />
			<PaperTitle subtitle={staff.data?.[0]?.year} title="Staff" />
			{staff.data?.length === 0 ? (
				<MessPage onRefresh={() => staff.refetch()}>
					<PageMessage text="The Messenger has listed no staff yet." />
				</MessPage>
			) : staff.data ? (
				<Host matchContents={false} style={styles.paper}>
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
									<Text modifiers={SECTION_HEADING}>{group.title}</Text>
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
												typeface={paperTypeface}
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
 * A staff member's bar: clear over the paper, as the story reader's is, and untitled, since the
 * header beside the photo names the person.
 */
const UNTITLED_CLEAR_BAR = {title: '', headerTransparent: true} as const

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
				<Stack.Screen options={UNTITLED_CLEAR_BAR} />
				<UnloadedPage query={staff} />
			</>
		)
	}

	if (!person) {
		return (
			<>
				<Stack.Screen options={UNTITLED_CLEAR_BAR} />
				<NoticeView
					style={styles.paper}
					systemImage="questionmark.circle"
					title="Staff Member Not Found"
				/>
			</>
		)
	}

	return (
		<>
			<Stack.Screen options={UNTITLED_CLEAR_BAR} />
			<Host style={styles.paper}>
				<List
					modifiers={[
						listStyle('insetGrouped'),
						scrollContentBackground('hidden'),
						background(paper),
					]}
				>
					<Section modifiers={SECTION}>
						<PersonHeader
							person={photoSubjectOf(person)}
							subtitle={person.role}
							typeface={paperTypeface}
						/>
					</Section>
					{person.bio ? (
						<Section header={<Text modifiers={SECTION_HEADING}>About</Text>} modifiers={SECTION}>
							<Text modifiers={BIO}>{person.bio}</Text>
						</Section>
					) : null}
				</List>
			</Host>
		</>
	)
}

const styles = StyleSheet.create({
	paper: {flex: 1, backgroundColor: paper},
})
