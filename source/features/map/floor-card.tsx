import * as React from 'react'
import {Group, List, Section, Text, VStack} from '@expo/ui/swift-ui'
import {font, foregroundStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {timezone} from '@frogpond/constants'
import {openUrl} from '@frogpond/open-url'
import {useMomentTimer} from '@frogpond/timer'
import type {Moment} from 'moment-timezone'

import {DETAIL_ROW, LAST_ROW} from '../../components/place-card/card-style'
import {DisclosureRow} from '../../components/rows'
import {STATUS_TEXT} from '../building-hours/hours-section'
import {contextualStatus, getShortBuildingStatus, hasDisplayableHours} from '../building-hours/lib'
import type {BuildingType} from '../building-hours/types'
import {CloseButton, PlaceCard} from './building-info'
import {resolveEntry, roomLabel, sortedEntries, type EntryTarget} from './directory/directory'
import type {DirectoryEntry, DirectoryFloor} from './directory/types'
import type {StackEntry} from './lib/also-here'
import type {PlaceTile} from './lib/place-tiles'
import type {SheetDetent} from './lib/sheet-moves'
import type {Building, Feature} from './types'

/// Names a directory entry's row for UI tests; the row's label says which.
export const DIRECTORY_ENTRY_ID = 'directory-entry'

type Place = {
	features: Array<Feature<Building>>
	venues: Array<BuildingType>
	links: Array<PlaceTile>
}

/// A venue's live status, as a place tile shows it; none without hours.
function statusOf(venue: BuildingType | undefined, now: Moment) {
	if (!venue || !hasDisplayableHours(venue.schedule ?? [])) {
		return
	}
	return {
		text: contextualStatus(venue, now).long,
		color: STATUS_TEXT[getShortBuildingStatus(venue, now)],
	}
}

/**
 * One floor of a building, stacked over the building's card: what is on it,
 * alphabetically, each with its room. A place with a card stacks it; a
 * department with only a web page opens the page; anything else is text.
 */
export function FloorCard({
	building,
	floor,
	place,
	onOpen,
	onClose,
	stacked,
	stop,
}: {
	building: Feature<Building> | undefined
	floor: DirectoryFloor | undefined
	place: Place
	onOpen: (entry: StackEntry) => void
	onClose: () => void
	/// The sheet stacked over this card, if any.
	stacked?: React.ReactNode
	stop: SheetDetent
}): React.ReactNode {
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})

	// The directory can change under a stacked sheet, or the map feed not
	// have the building yet.
	if (!building || !floor) {
		return (
			<List>
				<Section>
					<Text>Floor not found.</Text>
					<CloseButton onClose={onClose} />
					{stacked}
				</Section>
			</List>
		)
	}

	let abbreviation = building.properties.abbreviation ?? undefined
	let entries = sortedEntries(floor)
	return (
		<PlaceCard
			name={floor.name}
			onClose={onClose}
			stacked={stacked}
			stop={stop}
			subtitle={building.properties.name}
		>
			<Section>
				{entries.map((entry, position) => (
					// The card's rows sit on the sheet with its insets; a row takes
					// no modifiers of its own, so the group carries them to it.
					<Group
						key={`${entry.name}-${entry.room ?? ''}`}
						modifiers={position === entries.length - 1 ? LAST_ROW : DETAIL_ROW}
					>
						<EntryRow
							entry={entry}
							now={now}
							onOpen={onOpen}
							room={roomLabel(abbreviation, entry.room)}
							target={resolveEntry(entry, {building, ...place})}
						/>
					</Group>
				))}
			</Section>
		</PlaceCard>
	)
}

function EntryRow({
	entry,
	target,
	room,
	now,
	onOpen,
}: {
	entry: DirectoryEntry
	target: EntryTarget
	room: string | undefined
	now: Moment
	onOpen: (entry: StackEntry) => void
}): React.ReactNode {
	if (target.kind === 'card') {
		return (
			<DisclosureRow
				detail={room}
				identifier={DIRECTORY_ENTRY_ID}
				onPress={() => onOpen(target.opens)}
				status={statusOf(target.venue, now)}
				title={entry.name}
			/>
		)
	}
	if (target.kind === 'link') {
		return (
			<DisclosureRow
				destination="external"
				detail={room}
				identifier={DIRECTORY_ENTRY_ID}
				onPress={() => openUrl(target.href)}
				title={entry.name}
			/>
		)
	}
	return (
		<VStack alignment="leading" spacing={2}>
			<Text>{entry.name}</Text>
			{room ? (
				<Text modifiers={[font({textStyle: 'subheadline'}), foregroundStyle(c.secondaryLabel)]}>
					{room}
				</Text>
			) : null}
		</VStack>
	)
}
