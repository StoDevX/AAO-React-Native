import * as React from 'react'
import type {ColorValue} from 'react-native'
import {Button, HStack, Image, Spacer, SwipeActions, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	fixedSize,
	font,
	foregroundStyle,
	layoutPriority,
	lineLimit,
	shapes,
	tint,
	truncationMode,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import type {BuildingType} from '../types'
import {getShortBuildingStatus, getAccentBackgroundColor, contextualStatus} from '../lib'

/**
 * Every building row carries this prefix so XCUITest can query them directly
 * without iterating all buttons.
 */
export const BUILDING_ROW_PREFIX = 'building-row-'

const SINGLE_LINE = [lineLimit(1), truncationMode('tail')]

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
	let accentBg: ColorValue = getAccentBackgroundColor(status)
	let statusText = contextualStatus(building, now)

	let subtitle = building.subtitle
		? building.subtitle
		: building.abbreviation
			? `(${building.abbreviation})`
			: null

	let schedules = building.schedule || []
	let hasHours = schedules.some((s) => s.hours.length > 0)
	let firstNote = schedules.find((s) => s.notes)?.notes

	return (
		<SwipeActions>
			<Button
				modifiers={[
					buttonStyle('plain'),
					accessibilityIdentifier(`${BUILDING_ROW_PREFIX}${building.name}`),
					accessibilityLabel(`${building.name}, ${statusText}`),
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
								{hasHours ? statusText : (firstNote ?? '')}
							</Text>
							<Image
								modifiers={[foregroundStyle(accentBg), font({textStyle: 'caption2'})]}
								systemName="circle.fill"
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

			<SwipeActions.Actions edge="trailing" allowsFullSwipe={false}>
				<Button modifiers={[tint(c.systemBlue)]} onPress={() => onToggleFavorite(building)}>
					<Image systemName={isFavorite ? 'heart.slash' : 'heart'} />
				</Button>
			</SwipeActions.Actions>
		</SwipeActions>
	)
})
