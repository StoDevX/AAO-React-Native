import * as React from 'react'
import {useWindowDimensions, type ColorValue} from 'react-native'
import {HStack, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityElement,
	accessibilityIdentifier,
	background,
	clipShape,
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import type {ModifierConfig} from '@expo/ui/swift-ui/modifiers'
import type {Moment} from 'moment-timezone'

import {CARD_INSET, ROW_PADDING} from '../../components/place-card/card-style'
import {SectionHeading} from '../../components/place-card/section-heading'
import {DetailRow} from '../../components/rows'
import {
	accentBarWidth,
	contextualStatus,
	formatBuildingTimes,
	getAccentBackgroundColor,
	getDayOfWeek,
	getShortBuildingStatus,
	groupHoursByDays,
	hasDisplayableHours,
} from './lib'
import type {BuildingType, NamedBuildingScheduleType} from './types'

/// A note sits under its block's rows, in grey, with nothing drawn round it.
const NOTE_ROW = [
	font({textStyle: 'subheadline'}),
	foregroundStyle({type: 'hierarchical', style: 'secondary'}),
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 8, leading: CARD_INSET, bottom: 0, trailing: CARD_INSET}),
]

/// The status row, for UI tests to find. Matches
/// `TestIdentifiers.Hours.status` in `TestIdentifiers.swift`.
const HOURS_STATUS_ID = 'hours-status'

type Props = {
	venue: BuildingType
	now: Moment
}

/**
 * A place's hours as Apple Maps lays them out: its status and today's hours,
 * then the week, one row per run of days. A venue with several schedule
 * blocks (Stav's breakfast, lunch and dinner) gets a section for each, headed
 * by its title, under one status headed "Hours". Used by the map card and by the Hours
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
	let accent = getAccentBackgroundColor(getShortBuildingStatus(venue, now))

	// Alone in its section, the status is its last row and takes no hairline.
	let status = scheduled ? (
		<StatusRow accent={accent} last={!single} now={now} venue={venue} />
	) : null

	if (single) {
		let [block] = withContent
		return (
			<Section>
				<SectionHeading title="Hours" />
				{status}
				<WeekRows accent={accent} block={block} now={now} />
				{block.notes ? <Text modifiers={NOTE_ROW}>{block.notes}</Text> : null}
			</Section>
		)
	}

	// The status speaks for the whole venue rather than its first block, so it
	// takes its own section, headed "Hours", above the blocks.
	return (
		<>
			{status ? (
				<Section>
					<SectionHeading title="Hours" />
					{status}
				</Section>
			) : null}
			{withContent.map((block) => (
				<Section key={block.title}>
					<SectionHeading title={block.title} />
					<WeekRows accent={accent} block={block} now={now} />
					{block.notes ? <Text modifiers={NOTE_ROW}>{block.notes}</Text> : null}
				</Section>
			))}
		</>
	)
}

/// "Open until 10 PM" beside a bar in the status's colour, and today's hours
/// opposite.
function StatusRow({
	venue,
	now,
	accent,
	last,
}: Props & {accent: ColorValue; last: boolean}): React.ReactNode {
	let today = todaysHours(venue.schedule ?? [], now)
	return (
		<HoursRow
			bar={accent}
			label={contextualStatus(venue, now).long}
			identifier={HOURS_STATUS_ID}
			last={last}
			times={today ? [today] : []}
			emphasized={true}
		/>
	)
}

/// One row per run of days with the same hours. The run that covers now is
/// marked with a bar in the status's colour, as the Hours list marks it.
function WeekRows({
	block,
	now,
	accent,
}: {
	block: NamedBuildingScheduleType
	now: Moment
	accent: ColorValue
}): React.ReactNode {
	let groups = groupHoursByDays(block, now)
	return groups.map((group, index) => {
		let current = group.entries.some((entry) => entry.isActive)
		let last = index === groups.length - 1 && !block.notes
		return (
			<HoursRow
				key={group.entries[0].sourceIndex}
				bar={current ? accent : null}
				label={group.label}
				last={last}
				times={group.entries.map((entry) => formatBuildingTimes(entry.schedule, now))}
			/>
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

/// A label beside its times, which stack under it at accessibility text sizes,
/// where two columns leave each too narrow to read -- as Details does.
///
/// A Details row whose accent bar hangs centred in the side margin, so its
/// text lines up with the headings and notes above and below. The bar widens
/// with the text, and the gaps either side of it give way.
function HoursRow({
	bar,
	label,
	times,
	emphasized = false,
	last = false,
	identifier,
}: {
	bar: ColorValue | null
	label: string
	times: Array<string>
	/// Sets the label in semibold: the status, which a reader wants first.
	emphasized?: boolean
	/// The last row of a section has no hairline under it, as in Maps.
	last?: boolean
	identifier?: string
}): React.ReactNode {
	let barWidth = accentBarWidth(useWindowDimensions().fontScale)
	let gap = (CARD_INSET - barWidth) / 2
	let row: ModifierConfig[] = [
		listRowBackground('clear'),
		listRowInsets({top: ROW_PADDING, leading: gap, bottom: ROW_PADDING, trailing: CARD_INSET}),
		...(last ? [listRowSeparator('hidden', 'bottom')] : []),
		...(identifier ? [accessibilityIdentifier(identifier)] : []),
		accessibilityElement('combine'),
	]
	// The bar stands beside the whole row, outside the label and value, so
	// the value lines up under the label when the two stack.
	return (
		<HStack alignment="top" modifiers={row} spacing={gap}>
			<AccentBar color={bar} width={barWidth} />
			<DetailRow emphasized={emphasized} label={label} value={times.join('\n')} />
		</HStack>
	)
}

/// A thin capsule in a status's colour. With no colour it still takes its
/// width, so every row's label starts at the same place.
function AccentBar({color, width}: {color: ColorValue | null; width: number}): React.ReactNode {
	return (
		<VStack
			modifiers={[
				frame({minWidth: width, maxWidth: width, maxHeight: Infinity}),
				...(color ? [background(color), clipShape('capsule')] : []),
			]}
		>
			{null}
		</VStack>
	)
}
