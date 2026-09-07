import * as React from 'react'
import {StyleSheet, Image, View} from 'react-native'
import {Host, List, Section, Text, Button, HStack, VStack} from '@expo/ui/swift-ui'
import {
	background,
	buttonStyle,
	clipShape,
	font,
	foregroundStyle,
	frame,
	listStyle,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import type {BuildingType} from '../types'
import {images as buildingImages} from '../../../../images/spaces'
import {
	getShortBuildingStatus,
	getAccentBackgroundColor,
	contextualStatus,
	isScheduleOpenAtMoment,
	getDayOfWeek,
} from '../lib'
import {ScheduleRowSwiftUI} from './schedule-row-swiftui'
import {openUrl} from '@frogpond/open-url'

/** The gap between the accent bar and the text beside it. */
const BAR_GAP = 8

type Props = {
	building: BuildingType
	now: Moment
}

/**
 * The building detail screen: header image, current status, one section per
 * schedule, and any links for the building.
 */
export function BuildingDetailSwiftUI({building, now}: Props): React.ReactNode {
	let headerImage =
		building.image && buildingImages.has(building.image) ? buildingImages.get(building.image) : null

	let status = getShortBuildingStatus(building, now)
	let accentColor = getAccentBackgroundColor(status)
	let statusText = contextualStatus(building, now)
	let dayOfWeek = getDayOfWeek(now)

	let schedules = building.schedule || []
	let links = building.links || []

	return (
		// An RN view and a SwiftUI view can't be stacked as siblings inside one
		// Host -- Host bridges its children into SwiftUI, and Image isn't a
		// SwiftUI view, so the two would draw on top of each other instead of
		// stacking in a column. Pinning the banner as the Host's sibling here,
		// rather than its child, keeps the photo above the list instead of under it.
		<View style={styles.container}>
			{headerImage ? (
				<Image
					accessibilityIgnoresInvertColors={true}
					resizeMode="cover"
					source={headerImage}
					style={styles.image}
				/>
			) : null}

			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section>
						<HStack alignment="center" spacing={BAR_GAP}>
							<VStack
								modifiers={[
									frame({minWidth: 4, maxWidth: 4, minHeight: 24}),
									background(accentColor),
									clipShape('capsule'),
								]}
							>
								{null}
							</VStack>
							<Text
								modifiers={[
									font({textStyle: 'body', weight: 'semibold'}),
									foregroundStyle(c.label),
								]}
							>
								{statusText}
							</Text>
						</HStack>
					</Section>

					{schedules.map((schedule) => (
						<Section
							key={schedule.title}
							footer={schedule.notes ? <Text>{schedule.notes}</Text> : undefined}
							title={schedule.title.toUpperCase()}
						>
							{schedule.hours.map((set, i) => (
								<ScheduleRowSwiftUI
									key={i}
									accentColor={accentColor}
									isActive={
										schedule.isPhysicallyOpen !== false &&
										set.days.includes(dayOfWeek) &&
										isScheduleOpenAtMoment(set, now)
									}
									now={now}
									schedule={set}
								/>
							))}
						</Section>
					))}

					{links.length > 0 ? (
						<Section title="RESOURCES">
							{links.map((link, i) => (
								<Button
									key={i}
									modifiers={[buttonStyle('plain')]}
									onPress={() => openUrl(link.url.toString())}
								>
									<Text modifiers={[foregroundStyle(c.systemBlue)]}>{link.title}</Text>
								</Button>
							))}
						</Section>
					) : null}

					<Text
						modifiers={[
							font({textStyle: 'footnote'}),
							foregroundStyle(c.secondaryLabel),
							padding({top: 16, horizontal: 16}),
						]}
					>
						Building hours subject to change without notice{'\n\n'}Data collected by the humans of
						All About Olaf
					</Text>
				</List>
			</Host>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
	image: {
		width: '100%',
		height: 100,
	},
})
