import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section, Text, VStack} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	listStyle,
	onGeometryChange,
	padding,
	scrollContentBackground,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import type {Moment} from 'moment-timezone'
import {BuildingCutout} from './building-cutout'
import {resolveCutoutFeature} from '../lib/find-building-feature'
import type {BuildingType, Campus} from '../types'
import {mapDataOptions} from '../../map/query'
import {buildingPhoto} from '../lib/building-photo'
import {useImageFailure} from '../../../lib/use-image-failure'
import {HoursSection} from '../hours-section'
import {LinkListSection} from '../../map/card/link-list-section'
import {FILL_WIDTH} from '../../../components/tile-layout'
import {CARD_INSET, SECTION_GAP, SHEET_ROW} from '../../../components/place-card/card-style'
import {InsetImageRow} from '../../../components/inset-image-row'

/// The formal name sits straight under the sheet's title, as the map card's
/// subtitle sits under its name.
const FORMAL_NAME_ROW = [
	font({textStyle: 'subheadline', weight: 'semibold'}),
	foregroundStyle(c.secondaryLabel),
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: 0, leading: CARD_INSET, bottom: 0, trailing: CARD_INSET}),
]

type Props = {
	building: BuildingType
	now: Moment
	campus: Campus
}

/**
 * The building detail screen, in the map card's look: the venue's hours as
 * the card draws them, then where it is, its photo, and any links for it.
 */
export function BuildingDetailSwiftUI({building, now, campus}: Props): React.ReactNode {
	let photo = buildingPhoto(campus, building.image)
	// A photo that cannot be fetched leaves its row out, as no photo does.
	let [photoFailed, onPhotoError] = useImageFailure(photo?.uri)
	// The outline is given the row's width outright, since 100% inside
	// RNHostView resolves against the whole sheet, and the sheet itself can be
	// narrower than the window -- an iPad's form sheet, or iOS 26's resting
	// sheet, inset from the screen's edges. The row fills its width whatever
	// the outline's, so measuring it can't feed back on itself.
	let [outlineWidth, setOutlineWidth] = React.useState(0)
	// The list's row modifiers go last: outside the frame, where the list
	// reads them.
	let outlineRow = [
		frame({maxWidth: FILL_WIDTH}),
		onGeometryChange((box) => setOutlineWidth(box.width)),
		...SHEET_ROW,
	]

	let links = (building.links || []).map(({title, url}) => ({label: title, href: url}))

	// A venue is listed under the name people say, so this is the only place it
	// is spelled out: DiSCO is the Digital Scholarship Center, SARN the Sexual
	// Assault Resource Network. Where there is no formal name, the abbreviation
	// stands in.
	let formalName = building.subtitle
		? building.subtitle
		: building.abbreviation
			? `(${building.abbreviation})`
			: null

	// Every Carleton venue, and any St. Olaf one not yet keyed to a building,
	// carries no `building` id -- skip the fetch entirely rather than warm a
	// cache no lookup will ever use. Where a key does exist, this query shares
	// `mapDataOptions`' cache key with `/map`, so the sheet usually hits a warm
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
			{/* Plain, on the sheet's own colour, as the map card is. */}
			<List modifiers={[listStyle('plain'), scrollContentBackground('hidden')]}>
				{formalName ? (
					<Section>
						<Text modifiers={FORMAL_NAME_ROW}>{formalName}</Text>
					</Section>
				) : null}

				<HoursSection now={now} venue={building} />

				{feature ? (
					<Section>
						{/* On a wrapping stack because RNHostView takes no modifiers of
						    its own. */}
						<VStack modifiers={outlineRow}>
							<BuildingCutout campus={campus} feature={feature} width={outlineWidth} />
						</VStack>
					</Section>
				) : null}

				{photo && !photoFailed ? (
					<Section>
						<InsetImageRow onError={onPhotoError} source={photo} testID="building-photo" />
					</Section>
				) : null}

				<LinkListSection items={links} title="Links" />

				<Text
					modifiers={[
						font({textStyle: 'footnote'}),
						foregroundStyle(c.secondaryLabel),
						padding({top: SECTION_GAP, horizontal: CARD_INSET}),
						listRowBackground('clear'),
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
})
