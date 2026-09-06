import * as React from 'react'
import type {ColorValue} from 'react-native'
import {Button, HStack, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	background,
	buttonStyle,
	clipShape,
	contentShape,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	padding,
	shapes,
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

/** How far the accent bar clears the title/subtitle block at each end. */
const BAR_OVERSHOOT = 3

/** The gap between the accent bar and the text beside it. */
const BAR_GAP = 8

const SINGLE_LINE = [lineLimit(1), truncationMode('tail')]

type Props = {
	building: BuildingType
	now: Moment
	onPress: (building: BuildingType) => void
}

/**
 * A single building row: an accent bar coloured by open status, the building
 * name with its contextual status trailing, and the subtitle or abbreviation
 * beneath it.
 */
export const BuildingListRow = React.memo(function BuildingListRow({
	building,
	now,
	onPress,
}: Props): React.ReactNode {
	let status = getShortBuildingStatus(building, now)
	let accentColor: ColorValue = getAccentBackgroundColor(status)
	let statusText = contextualStatus(building, now)

	let subtitle = building.subtitle
		? building.subtitle
		: building.abbreviation
			? `(${building.abbreviation})`
			: null

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityIdentifier(`${BUILDING_ROW_PREFIX}${building.name}`),
				accessibilityLabel(`${building.name}, ${statusText}`),
			]}
			onPress={() => onPress(building)}
		>
			<HStack alignment="top" modifiers={[contentShape(shapes.rectangle())]} spacing={BAR_GAP}>
				<VStack
					modifiers={[
						frame({minWidth: 4, maxWidth: 4, maxHeight: Infinity}),
						background(accentColor),
						clipShape('capsule'),
					]}
				>
					{null}
				</VStack>

				<VStack alignment="leading" modifiers={[padding({vertical: BAR_OVERSHOOT})]}>
					<HStack spacing={8}>
						<Text
							modifiers={[
								font({textStyle: 'body', weight: 'semibold'}),
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
								lineLimit(1),
							]}
						>
							{statusText}
						</Text>
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
	)
})
