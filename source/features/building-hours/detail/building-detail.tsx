import * as React from 'react'
import {StyleSheet, Image} from 'react-native'
import {Host, List, RNHostView, Section, Text, Button, HStack, VStack} from '@expo/ui/swift-ui'
import {
	background,
	buttonStyle,
	clipShape,
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	listStyle,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import {BuildingCutout} from './building-cutout'
import {resolveCutoutFeature} from '../lib/find-building-feature'
import type {BuildingType} from '../types'
import type {Campus} from '../query'
import {mapDataOptions} from '../../map/query'
import {images as buildingImages} from '../../../../images/spaces'
import {
	getShortBuildingStatus,
	getAccentBackgroundColor,
	contextualStatus,
	isScheduleRowActive,
} from '../lib'
import {ScheduleRowSwiftUI} from './schedule-row-swiftui'
import {openUrl} from '@frogpond/open-url'

/** The gap between the accent bar and the text beside it. */
const BAR_GAP = 8

type Props = {
	building: BuildingType
	now: Moment
	campus: Campus
}

/**
 * The building detail screen: current status, one section per schedule, the
 * building's photo, and any links for the building.
 */
export function BuildingDetailSwiftUI({building, now, campus}: Props): React.ReactNode {
	// `buildingImages` only ever holds St. Olaf's photos. Some slugs collide
	// with Carleton venues that happen to share a name (Bookstore, Post
	// Office) or an unrelated slug (Carleton's Writing Center -> `disco`), so
	// a Carleton building must never resolve a photo through this map.
	let buildingPhoto =
		campus === 'stolaf' && building.image && buildingImages.has(building.image)
			? buildingImages.get(building.image)
			: null

	let status = getShortBuildingStatus(building, now)
	let accentColor = getAccentBackgroundColor(status)
	let statusText = contextualStatus(building, now)

	let schedules = building.schedule || []
	let links = building.links || []

	// Every Carleton venue, and any St. Olaf one not yet keyed to a building,
	// carries no `building` id -- skip the fetch entirely rather than warm a
	// cache no lookup will ever use. Where a key does exist, this query shares
	// `mapDataOptions`' cache key with `/Map`, so the sheet usually hits a warm
	// cache instead of a spinner.
	let {data: mapFeatures} = useQuery({
		...mapDataOptions(campus),
		enabled: Boolean(building.building),
	})
	// A venue can join to a record with no outline -- a point of interest rather
	// than a building -- in which case this follows its `parent` to the building
	// it sits in. Undefined when nothing in that chain has an outline, and the
	// section goes with it: an empty row reads as a broken image, not an absent
	// one.
	let feature = mapFeatures ? resolveCutoutFeature(mapFeatures, building) : undefined

	return (
		// A Host doesn't need a React Native scroll view under it: the hosting
		// view carries a UIKit autoresizing mask, so it fills its superview on
		// its own, without the Fabric coercion an RN scroll view would need.
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
							modifiers={[font({textStyle: 'body', weight: 'semibold'}), foregroundStyle(c.label)]}
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
								isActive={isScheduleRowActive(schedule, set, now)}
								now={now}
								schedule={set}
							/>
						))}
					</Section>
				))}

				{feature ? (
					<Section>
						{/* Zeroed the same way the photo below is: RNHostView takes no
						    modifiers of its own, so the inset has to come from the
						    wrapping stack. */}
						<VStack modifiers={[listRowInsets({top: 0, bottom: 0, leading: 0, trailing: 0})]}>
							<BuildingCutout campus={campus} feature={feature} />
						</VStack>
					</Section>
				) : null}

				{buildingPhoto ? (
					<Section>
						{/* The insets are zeroed on a wrapping stack because RNHostView
						    takes no modifiers of its own, and they are zeroed so the photo
						    meets the row's edges the way an image row reads on iOS. */}
						<VStack modifiers={[listRowInsets({top: 0, bottom: 0, leading: 0, trailing: 0})]}>
							<RNHostView matchContents={true}>
								<Image
									accessibilityIgnoresInvertColors={true}
									resizeMode="cover"
									source={buildingPhoto}
									style={styles.image}
									testID="building-photo"
								/>
							</RNHostView>
						</VStack>
					</Section>
				) : null}

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
						listRowBackground(c.systemGroupedBackground),
						listRowInsets({top: 0, bottom: 0, leading: 0, trailing: 0}),
						listRowSeparator('hidden'),
					]}
				>
					Building hours subject to change without notice{'\n\n'}Data collected by the humans of All
					About Olaf
				</Text>
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
	image: {
		width: '100%',
		height: 100,
	},
})
