import * as React from 'react'
import {Image as RNImage, Linking, StyleSheet} from 'react-native'
import {
	Button,
	Image,
	List,
	RNHostView,
	Section,
	Spacer,
	Text,
	VStack,
	ZStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonBorderShape,
	buttonStyle,
	dynamicTypeSize,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	listRowBackground,
	listRowInsets,
	multilineTextAlignment,
	onGeometryChange,
	padding,
	truncationMode,
} from '@expo/ui/swift-ui/modifiers'
import {openUrl} from '@frogpond/open-url'
import {PlaceCardHeader, PlaceCardScaffold} from '@frogpond/place-card-header'

import {FILL_WIDTH} from '../../components/tile-layout'
import {nameUnderHeader, titleMayMove} from './lib/card-title'
import {normalizeLinks} from './lib/normalize-link'
import type {SheetDetent} from './lib/sheet-moves'
import type {Building, Feature, LabelLink, LabelLinkString} from './types'
import {appleMapsSearchUrl, buildingPhotoUrl} from './urls'

/// Apple Maps' place-card header, measured on iOS 27: 16pt of padding round
/// 44pt buttons -- 76pt in all, the sheet's collapsed stop
/// (`SHEET_COLLAPSED_HEIGHT` in `Map/index.tsx`).
const HEADER_PADDING = 16

/// The header's bottom padding at the large stop: Maps' big title starts 8pt
/// under the buttons, and the list's first row starts at the header's edge.
const LARGE_HEADER_BOTTOM_PADDING = 8

/// Maps' header buttons are 44pt square, and the header's title row is as
/// tall as they are.
const BUTTON_SIZE = 44

/// How far the header's small title keeps from each edge of the header: the
/// close button plus `HEADER_PADDING`, so the title clears it.
const TITLE_INSET = BUTTON_SIZE + HEADER_PADDING

/// Glass pads its label about 7pt on every side (measured on iOS 27), so a
/// 30pt frame round the glyph comes out as Maps' 44pt button.
const CLOSE_GLYPH_FRAME = 30
const CLOSE_GLYPH_SIZE = 20

/// The card's own dismiss button. The search bar's Cancel carries the same
/// "Close" accessibility label, so a screen-wide query for that label could
/// answer for either; this testID scopes a test to the card alone. Matches
/// `TestIdentifiers.CarletonMap.cardCloseButton` in `TestIdentifiers.swift`.
const CARD_CLOSE_BUTTON_ID = 'card-close-button'

/// The header's title. Matches `TestIdentifiers.CarletonMap.cardTitle` in
/// `TestIdentifiers.swift`.
const CARD_TITLE_ID = 'card-title'

/// The big title's subtitle at the large stop.
const CARD_BIG_SUBTITLE_ID = 'card-big-subtitle'

type Props = {
	building: Feature<Building> | undefined
	onClose: () => void
	/// Which stop the sheet is at: large lays the name out differently, and only the other two let a long one move.
	stop: SheetDetent
}

/// The info card's contents, as SwiftUI. The sheet that presents them belongs
/// to the map screen, which swaps between this and the picker.
export function BuildingInfo({building, onClose, stop}: Props): React.ReactNode {
	if (!building) {
		return (
			<List>
				<Section>
					<Text>Building not found.</Text>
					<CloseButton onClose={onClose} />
				</Section>
			</List>
		)
	}

	// A new building starts over with its big title in view.
	return <BuildingCard building={building} key={building.id} onClose={onClose} stop={stop} />
}

/// A found building's card: the pinned header over the list of its details.
function BuildingCard({
	building,
	onClose,
	stop,
}: {
	building: Feature<Building>
	onClose: () => void
	stop: SheetDetent
}): React.ReactNode {
	let large = stop === 'large'
	let [bigTitleAway, setBigTitleAway] = React.useState(false)
	let [headerBottom, setHeaderBottom] = React.useState<number | null>(null)

	// The name's frame reports on every step of a scroll, in window
	// coordinates like the header's, so comparing the two is exact at any
	// stop and text size. React skips the render while the answer holds.
	let measureBigTitle = (box: {y: number; height: number}) => {
		setBigTitleAway(nameUnderHeader(box, headerBottom))
	}

	let {
		accessibility,
		address,
		departments,
		description,
		floors,
		links,
		name,
		nickname,
		offices,
		photos,
	} = building.properties

	let subtitle = building.properties.type || null

	return (
		<PlaceCardScaffold large={large}>
			<ZStack
				alignment="topTrailing"
				modifiers={[
					// At large Maps sets the big title 8pt under the buttons, so
					// the header ends there.
					padding({
						top: HEADER_PADDING,
						horizontal: HEADER_PADDING,
						bottom: large ? LARGE_HEADER_BOTTOM_PADDING : HEADER_PADDING,
					}),
					// Only the large card swaps its title, so only there is the
					// header's edge worth a render as the sheet moves.
					...(large ? [onGeometryChange((box) => setHeaderBottom(box.y + box.height))] : []),
				]}
			>
				{large ? (
					bigTitleAway ? (
						// Maps' inline title at large: an ellipsis, no marquee, no
						// subtitle, clear of the button at the trailing edge. Maps
						// stops it growing at about xxxLarge, so the header keeps
						// to the buttons' row and does not jump taller at the swap.
						<Text
							modifiers={[
								font({textStyle: 'title3', weight: 'bold'}),
								dynamicTypeSize({max: 'xxxLarge'}),
								lineLimit(1),
								truncationMode('tail'),
								padding({horizontal: TITLE_INSET}),
								frame({maxWidth: FILL_WIDTH, minHeight: BUTTON_SIZE}),
							]}
						>
							{name}
						</Text>
					) : (
						<Spacer modifiers={[frame({height: BUTTON_SIZE})]} />
					)
				) : (
					<PlaceCardHeader
						animate={titleMayMove(stop)}
						subtitle={subtitle}
						testID={CARD_TITLE_ID}
						title={name}
					/>
				)}
				<CloseButton onClose={onClose} />
			</ZStack>

			<List>
				{large ? (
					<Section
						modifiers={[
							// Straight on the sheet, as Maps draws it, not in a row's
							// rounded box.
							listRowBackground('clear'),
							listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
						]}
					>
						{/* Maps sets the subtitle straight under the name. */}
						<VStack modifiers={[frame({maxWidth: FILL_WIDTH})]} spacing={0}>
							{/* The name alone is measured, not the subtitle under it:
							    Maps swaps titles once the name has gone under the
							    header, with the subtitle still in view. */}
							<Text
								modifiers={[
									font({textStyle: 'title', weight: 'bold'}),
									multilineTextAlignment('center'),
									onGeometryChange(measureBigTitle),
								]}
							>
								{name}
							</Text>
							{subtitle ? (
								<Text
									modifiers={[
										font({textStyle: 'subheadline', weight: 'semibold'}),
										foregroundStyle({type: 'hierarchical', style: 'secondary'}),
									]}
									testID={CARD_BIG_SUBTITLE_ID}
								>
									{subtitle}
								</Text>
							) : null}
						</VStack>
					</Section>
				) : null}

				{nickname ? (
					<Section title="Abbreviation">
						<Text>{nickname}</Text>
					</Section>
				) : null}

				{photos?.[0] ? (
					<Section
						modifiers={[
							// A List row insets its content, which framed the photograph in
							// white on all four sides. Here the photo is the row.
							listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
						]}
					>
						{/* SwiftUI's Image reads a local file synchronously; these are
							    remote, so the React Native image loader does the work and
							    SwiftUI hosts the result. */}
						<RNHostView matchContents={true}>
							<RNImage
								accessibilityLabel={`Photo of ${name}`}
								source={{uri: buildingPhotoUrl(photos[0])}}
								style={styles.photo}
							/>
						</RNHostView>
					</Section>
				) : null}

				{description ? (
					<Section title="About">
						<Text>{description}</Text>
					</Section>
				) : null}

				{address ? (
					<Section title="Address">
						<AddressLink address={address} />
					</Section>
				) : null}

				<Section title="Accessibility">
					<Text>{accessibilityCopy(accessibility)}</Text>
				</Section>

				<LinkSection items={departments} title="Departments" />
				<LinkSection items={offices} title="Offices" />
				<LinkSection items={floors} title="Floors" />
				<LinkSection items={links} title="Links" />
			</List>
		</PlaceCardScaffold>
	)
}

/// Maps' close button: a glass circle holding a plain xmark.
function CloseButton({onClose}: {onClose: () => void}): React.ReactNode {
	return (
		<Button
			modifiers={[accessibilityLabel('Close'), buttonStyle('glass'), buttonBorderShape('circle')]}
			onPress={onClose}
			testID={CARD_CLOSE_BUTTON_ID}
		>
			<Image
				modifiers={[frame({width: CLOSE_GLYPH_FRAME, height: CLOSE_GLYPH_FRAME})]}
				size={CLOSE_GLYPH_SIZE}
				systemName="xmark"
			/>
		</Button>
	)
}

function AddressLink({address}: {address: string}): React.ReactNode {
	// Linking rather than openUrl: maps.apple.com is a universal link that iOS
	// hands to Maps.app, and openUrl would offer to show it in the in-app
	// browser instead, which lands on Apple's web fallback page.
	let onPress = () => {
		let url = appleMapsSearchUrl(address)
		Linking.openURL(url).catch((err: unknown) => {
			console.warn(`could not open ${url}`, err)
		})
	}
	return (
		<Button modifiers={[accessibilityLabel(`Open ${address} in Maps`)]} onPress={onPress}>
			<Text>{address}</Text>
		</Button>
	)
}

function LinkSection({
	title,
	items,
}: {
	title: string
	// The server is not schema-validated at the boundary, so a record that
	// omits the field arrives as undefined rather than as an empty array.
	// St. Olaf serves these as {label, href} objects where Carleton serves
	// "Label <url>" strings, hence the union -- normalizeLinks reconciles them.
	items: Array<LabelLinkString | LabelLink> | undefined
}): React.ReactNode {
	let normalized = normalizeLinks(items)
	if (normalized.length === 0) {
		return null
	}
	return (
		<Section title={title}>
			{normalized.map(({label, href}, index) => {
				// Neither field is unique on its own -- two entries can share a
				// label, and a label-only entry has no href at all -- so the key
				// combines both with the row's position.
				let key = `${label}-${href}-${index}`
				if (!href) {
					return <Text key={key}>{label}</Text>
				}
				return (
					<Button
						key={key}
						modifiers={[accessibilityLabel(`Open ${label}`)]}
						onPress={() => openUrl(href)}
					>
						<Text>{label}</Text>
					</Button>
				)
			})}
		</Section>
	)
}

function accessibilityCopy(value: Building['accessibility']): string {
	switch (value) {
		case 'wheelchair':
			return 'Wheelchair-accessible.'
		case 'none':
			return 'Not wheelchair-accessible.'
		default:
			return 'Accessibility information not available.'
	}
}

const styles = StyleSheet.create({
	photo: {width: '100%', height: 180},
})
