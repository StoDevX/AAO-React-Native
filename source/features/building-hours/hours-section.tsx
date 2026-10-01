import * as React from 'react'
import type {ColorValue} from 'react-native'
import {LabeledContent, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityElement,
	accessibilityIdentifier,
	font,
	foregroundStyle,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
} from '@expo/ui/swift-ui/modifiers'
import type {ModifierConfig} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'

import {CARD_INSET, ROW_PADDING} from '../../components/place-card/card-style'
import {SectionHeading} from '../../components/place-card/section-heading'
import {
	contextualStatus,
	formatBuildingTimes,
	getShortBuildingStatus,
	groupHoursByDays,
	hasDisplayableHours,
	schedulesWithContent,
	statusWindow,
} from './lib'
import type {BuildingStatusType, BuildingType, NamedBuildingScheduleType} from './types'

/// The status's colour as text, as Maps writes a place's Open or Closed. The
/// Hours list's yellow is for its dots and too faint as text, so the in-between
/// statuses take orange.
export const STATUS_TEXT: Record<BuildingStatusType, ColorValue> = {
	Open: c.systemGreen,
	'Almost Open': c.systemOrange,
	'Almost Closed': c.systemOrange,
	Chapel: c.systemOrange,
	Closed: c.systemRed,
}

/// The space between the week's lines, which Maps sets 27pt apart.
const WEEK_LINE_GAP = 5

/// The space under the week's grey title, a little more than between its
/// lines, so the title reads as a heading rather than a first line.
const WEEK_TITLE_GAP = 8

const PRIMARY = foregroundStyle({type: 'hierarchical', style: 'primary'})
const SECONDARY = foregroundStyle({type: 'hierarchical', style: 'secondary'})

/// The week's single row: on the sheet, inset like every other row, with no
/// hairline under it.
const WEEK_ROW = [
	listRowBackground('clear'),
	listRowInsets({top: ROW_PADDING, leading: CARD_INSET, bottom: ROW_PADDING, trailing: CARD_INSET}),
	listRowSeparator('hidden', 'bottom'),
]

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
	let withContent = schedulesWithContent(blocks)
	if (withContent.length === 0) {
		return null
	}
	let [first, ...rest] = withContent
	// A lone block, or a first block titled "Hours", is the venue's own week,
	// so it shares the status's "Hours" section. Otherwise the status speaks
	// for every block and takes a section to itself above them.
	let shared = rest.length === 0 || first.title === 'Hours'
	// Alone in its section, the status is its last row and takes no hairline.
	let status = scheduled ? <StatusRow last={!shared} now={now} venue={venue} /> : null

	return (
		<>
			{shared ? (
				<Section>
					<SectionHeading title="Hours" />
					{status}
					<WeekRows block={first} heading="Normal Hours" now={now} />
					{first.notes ? <Text modifiers={NOTE_ROW}>{first.notes}</Text> : null}
				</Section>
			) : status ? (
				<Section>
					<SectionHeading title="Hours" />
					{status}
				</Section>
			) : null}
			{(shared ? rest : withContent).map((block) => (
				<Section key={block.title}>
					<SectionHeading title={block.title} />
					<WeekRows block={block} now={now} />
					{block.notes ? <Text modifiers={NOTE_ROW}>{block.notes}</Text> : null}
				</Section>
			))}
		</>
	)
}

/// "Open until 10 PM" in the status's colour, as Maps writes Open, and today's
/// hours opposite.
function StatusRow({venue, now, last}: Props & {last: boolean}): React.ReactNode {
	let window = statusWindow(venue, now)
	return (
		<HoursLine
			emphasized={true}
			label={contextualStatus(venue, now).long}
			labelColor={STATUS_TEXT[getShortBuildingStatus(venue, now)]}
			modifiers={[
				listRowBackground('clear'),
				listRowInsets({
					top: ROW_PADDING,
					leading: CARD_INSET,
					bottom: ROW_PADDING,
					trailing: CARD_INSET,
				}),
				...(last ? [listRowSeparator('hidden', 'bottom')] : []),
				accessibilityIdentifier(HOURS_STATUS_ID),
			]}
			times={window ? [formatBuildingTimes(window, now)] : []}
		/>
	)
}

/// The week, one line per run of days with the same hours, packed into a
/// single row as Maps packs its Normal Hours. The run that covers now is set
/// in semibold.
function WeekRows({
	block,
	now,
	heading,
}: {
	block: NamedBuildingScheduleType
	now: Moment
	/// A grey title over the lines, where no section heading names them.
	heading?: string
}): React.ReactNode {
	let groups = groupHoursByDays(block, now)
	if (groups.length === 0) {
		return null
	}
	return (
		<VStack alignment="leading" modifiers={WEEK_ROW} spacing={WEEK_TITLE_GAP}>
			{heading ? <Text modifiers={[SECONDARY]}>{heading}</Text> : null}
			<VStack alignment="leading" spacing={WEEK_LINE_GAP}>
				{groups.map((group) => (
					<HoursLine
						key={group.entries[0].sourceIndex}
						emphasized={group.entries.some((entry) => entry.isActive)}
						label={group.label}
						times={group.entries.map((entry) => formatBuildingTimes(entry.schedule, now))}
					/>
				))}
			</VStack>
		</VStack>
	)
}

/// A label beside its times, which stack under it at accessibility text sizes,
/// where two columns leave each too narrow to read -- as Details does. The
/// times are grey, as a Details row's value is.
function HoursLine({
	label,
	labelColor,
	times,
	emphasized = false,
	modifiers,
}: {
	label: string
	labelColor?: ColorValue
	times: Array<string>
	/// Sets the label in semibold: the status, and the run of days covering now.
	emphasized?: boolean
	modifiers?: ModifierConfig[]
}): React.ReactNode {
	let labelStyle = [
		font({textStyle: 'body', weight: emphasized ? 'semibold' : 'regular'}),
		labelColor ? foregroundStyle(labelColor) : PRIMARY,
	]
	// With no times -- a status on a day with no hours -- the label alone. A
	// LabeledContent with nothing to label draws only its label, and the
	// modifiers on it, the status row's identifier among them, are lost.
	if (times.length === 0) {
		return <Text modifiers={[...labelStyle, ...(modifiers ?? [])]}>{label}</Text>
	}
	return (
		<LabeledContent
			label={<Text modifiers={labelStyle}>{label}</Text>}
			modifiers={[...(modifiers ?? []), accessibilityElement('combine')]}
		>
			<VStack alignment="trailing" spacing={2}>
				{times.map((time) => (
					<Text key={time} modifiers={[SECONDARY]}>
						{time}
					</Text>
				))}
			</VStack>
		</LabeledContent>
	)
}
