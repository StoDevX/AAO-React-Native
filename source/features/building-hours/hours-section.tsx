import * as React from 'react'
import type {ColorValue} from 'react-native'
import {HStack, Section, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'

import {CARD_INSET, DETAIL_ROW, LAST_ROW} from '../../components/place-card/card-style'
import {SectionHeading} from '../../components/place-card/section-heading'
import {
	contextualStatus,
	formatBuildingTimes,
	getDayOfWeek,
	getShortBuildingStatus,
	groupHoursByDays,
	hasDisplayableHours,
} from './lib'
import type {BuildingStatusType, BuildingType, NamedBuildingScheduleType} from './types'

/// The status word's colour. Maps writes a place's status in green, orange or
/// red; the Hours list's yellow is for its bars and too faint as text.
const STATUS_TEXT: Record<BuildingStatusType, ColorValue> = {
	Open: c.systemGreen,
	'Almost Open': c.systemOrange,
	'Almost Closed': c.systemOrange,
	Chapel: c.systemOrange,
	Closed: c.systemRed,
}

/// A note sits under its block's rows, in grey, with nothing drawn round it.
const NOTE_ROW = [
	font({textStyle: 'subheadline'}),
	foregroundStyle({type: 'hierarchical', style: 'secondary'}),
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 8, leading: CARD_INSET, bottom: 0, trailing: CARD_INSET}),
]

type Props = {
	venue: BuildingType
	now: Moment
}

/**
 * A place's hours as Apple Maps lays them out: its status and today's hours,
 * then the week, one row per run of days. A venue with several schedule
 * blocks (Stav's breakfast, lunch and dinner) gets a section for each, headed
 * by its title, under the one status. Used by the map card and by the Hours
 * screen's detail sheet, so the two always agree.
 *
 * A venue with no hours listed is unscheduled rather than closed, so it shows
 * its notes and no status; with no notes either, it shows nothing.
 */
export function HoursSection({venue, now}: Props): React.ReactNode {
	let blocks = venue.schedule ?? []
	let scheduled = hasDisplayableHours(blocks)
	let withContent = blocks.filter((block) => block.hours.length > 0 || block.notes)
	if (withContent.length === 0) {
		return null
	}
	let single = withContent.length === 1

	return withContent.map((block, index) => (
		<Section key={block.title}>
			<SectionHeading title={single ? 'Hours' : block.title} />
			{index === 0 && scheduled ? <StatusRow now={now} venue={venue} /> : null}
			<WeekRows block={block} now={now} />
			{block.notes ? <Text modifiers={NOTE_ROW}>{block.notes}</Text> : null}
		</Section>
	))
}

/// "Open until 10 PM" in the status's colour, and today's hours opposite.
function StatusRow({venue, now}: Props): React.ReactNode {
	let status = getShortBuildingStatus(venue, now)
	let today = todaysHours(venue.schedule ?? [], now)
	return (
		<HStack modifiers={DETAIL_ROW}>
			<Text
				modifiers={[
					font({textStyle: 'body', weight: 'semibold'}),
					foregroundStyle(STATUS_TEXT[status]),
				]}
			>
				{contextualStatus(venue, now).long}
			</Text>
			<Spacer />
			{today ? <Text>{today}</Text> : null}
		</HStack>
	)
}

/// One row per run of days with the same hours. The run that covers now is
/// set in semibold, as the Hours list marks it.
function WeekRows({block, now}: {block: NamedBuildingScheduleType; now: Moment}): React.ReactNode {
	let groups = groupHoursByDays(block, now)
	return groups.map((group, index) => {
		let current = group.entries.some((entry) => entry.isActive)
		let weight = current ? ('semibold' as const) : ('regular' as const)
		let last = index === groups.length - 1 && !block.notes
		return (
			<HStack
				key={group.entries[0].sourceIndex}
				alignment="firstTextBaseline"
				modifiers={last ? LAST_ROW : DETAIL_ROW}
			>
				<Text modifiers={[font({textStyle: 'body', weight})]}>{group.label}</Text>
				<Spacer />
				<VStack alignment="trailing" spacing={2}>
					{group.entries.map((entry) => (
						<Text key={entry.sourceIndex} modifiers={[font({textStyle: 'body', weight})]}>
							{formatBuildingTimes(entry.schedule, now)}
						</Text>
					))}
				</VStack>
			</HStack>
		)
	})
}

/// Today's hours for the status row: the set running now, else the first set
/// that includes today, across every block.
function todaysHours(blocks: Array<NamedBuildingScheduleType>, now: Moment): string | null {
	let day = getDayOfWeek(now)
	for (let block of blocks) {
		let groups = groupHoursByDays(block, now)
		let active = groups.flatMap((group) => group.entries).find((entry) => entry.isActive)
		if (active) {
			return formatBuildingTimes(active.schedule, now)
		}
	}
	for (let block of blocks) {
		let todays = block.hours.find((set) => set.days.includes(day))
		if (todays) {
			return formatBuildingTimes(todays, now)
		}
	}
	return null
}
