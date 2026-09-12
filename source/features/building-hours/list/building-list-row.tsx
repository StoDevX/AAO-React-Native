import * as React from 'react'
import {Button, HStack, Image, Spacer, SwipeActions, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	allowsTightening,
	buttonStyle,
	contentShape,
	fixedSize,
	font,
	foregroundStyle,
	layoutPriority,
	lineLimit,
	minimumScaleFactor,
	shapes,
	tint,
	truncationMode,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import type {BuildingType} from '../types'
import {
	getShortBuildingStatus,
	statusGlyph,
	findOpenService,
	contextualStatus,
	hasDisplayableHours,
	firstScheduleNote,
} from '../lib'

/**
 * Every building row carries this prefix so XCUITest can query them directly
 * without iterating all buttons.
 */
export const BUILDING_ROW_PREFIX = 'building-row-'

/** The swipe action's two labels, which are also how XCUITest finds it. */
export const ADD_TO_FAVORITES = 'Add to Favorites'
export const REMOVE_FROM_FAVORITES = 'Remove from Favorites'

const SINGLE_LINE = [
	lineLimit(1),
	truncationMode('tail'),
	// The status wins this row on layout priority, so without these the name is
	// what gets an ellipsis. Shrinking a little reads better than losing letters,
	// and keeps every row the same height.
	minimumScaleFactor(0.8),
	allowsTightening(true),
]

type Props = {
	building: BuildingType
	now: Moment
	isFavorite: boolean
	onToggleFavorite: (building: BuildingType) => void
	onSelect: (building: BuildingType) => void
}

/**
 * A single building row: swipe-left reveals the favorite action.
 * Tapping opens the building's detail sheet.
 */
export const BuildingListRow = React.memo(function BuildingListRow({
	building,
	now,
	isFavorite,
	onToggleFavorite,
	onSelect,
}: Props): React.ReactNode {
	let status = getShortBuildingStatus(building, now)
	let glyph = statusGlyph(status, findOpenService(building, now) ?? undefined)
	let statusText = contextualStatus(building, now)

	let subtitle = building.subtitle
		? building.subtitle
		: building.abbreviation
			? `(${building.abbreviation})`
			: null

	let schedules = building.schedule || []
	let hasHours = hasDisplayableHours(schedules)
	let firstNote = firstScheduleNote(schedules)

	return (
		<SwipeActions>
			<Button
				modifiers={[
					buttonStyle('plain'),
					accessibilityIdentifier(`${BUILDING_ROW_PREFIX}${building.name}`),
					accessibilityLabel(`${building.name}, ${statusText.long}`),
				]}
				onPress={() => onSelect(building)}
			>
				<HStack
					modifiers={[contentShape(shapes.rectangle()), fixedSize({vertical: true})]}
					spacing={8}
				>
					<VStack alignment="leading">
						<HStack alignment="center" spacing={8}>
							<Text
								modifiers={[
									font({textStyle: 'body', weight: 'medium'}),
									foregroundStyle(c.label),
									...SINGLE_LINE,
								]}
							>
								{building.name}
							</Text>
							<Spacer />
							<Text
								modifiers={[
									font({textStyle: 'body'}),
									foregroundStyle(c.secondaryLabel),
									layoutPriority(1),
								]}
							>
								{hasHours ? statusText.short : (firstNote ?? '')}
							</Text>
							<Image
								modifiers={[foregroundStyle(glyph.color), font({textStyle: 'caption2'})]}
								systemName={glyph.symbol}
							/>
							<Image
								modifiers={[font({textStyle: 'footnote'}), foregroundStyle(c.tertiaryLabel)]}
								systemName="chevron.right"
							/>
						</HStack>

						{subtitle ? (
							<Text
								modifiers={[
									font({textStyle: 'subheadline'}),
									foregroundStyle(c.secondaryLabel),
									...SINGLE_LINE,
								]}
							>
								{subtitle}
							</Text>
						) : null}
					</VStack>
				</HStack>
			</Button>

			{/* One action, and a reversible one, so a full swipe triggers it
			 * directly -- the ordinary iOS pattern, the same way Mail's
			 * single-action swipe behaves. */}
			<SwipeActions.Actions edge="trailing" allowsFullSwipe={true}>
				<Button
					modifiers={[
						tint(c.systemBlue),
						accessibilityLabel(isFavorite ? REMOVE_FROM_FAVORITES : ADD_TO_FAVORITES),
					]}
					onPress={() => onToggleFavorite(building)}
				>
					<Image systemName={isFavorite ? 'heart.slash' : 'heart'} />
				</Button>
			</SwipeActions.Actions>
		</SwipeActions>
	)
})
