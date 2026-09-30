import * as React from 'react'
import {Button, HStack, Image, List, Section, Spacer, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityLabel,
	background,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	onGeometryChange,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {CampusSearchBar} from '@frogpond/campus-search-bar'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'

import {RowAccessory} from '../../components/rows'
import type {Campus} from '../building-hours/types'
import {CategoryGrid} from './category-grid'
import {BUNDLED_MAP_CATEGORIES, mapCategoriesOptions} from './category-groups-query'
import {groupsFor, placesIn, type CategoryGroup} from './lib/category-groups'
import {searchPlaces} from './lib/search-places'
import {mapDataOptions} from './query'
import type {Building, Feature} from './types'
import type {MapGroupLabel} from '../telemetry/catalog'
import {track} from '../telemetry/track'

/// Matches the debounce every other search screen in the app uses.
const SEARCH_DEBOUNCE_MS = 200

/// The margin above and below the search field, in LAYOUT space, and the
/// margin the field visibly gets: `CampusSearchBarView` gives the bar a 44pt
/// slot, and although `UISearchBar` draws 64pt tall -- its 44pt text field
/// centred, 10pt of its own chrome above and below -- that overflow takes no
/// layout space and the bar's `.minimal` style paints none of it. So the
/// picker's header block is `16 + 44 + 16 = 76`pt at the default text size,
/// and taller as the field grows with the text. The sheet's collapsed stop is
/// sized to hold the block as measured; see `collapsedDetentFor`.
const SEARCH_MARGIN = 16
const SEARCH_PLACEHOLDER = 'Search for a place'

/// The group header's back button: chevron only, as Maps draws it.
export const GROUP_BACK_LABEL = 'Back'
/// The button's disc, at the 44pt minimum touch target.
const BACK_BUTTON_SIZE = 44

/// `UISearchBar` insets its own text field about 8pt from the edges it is
/// given, on top of whatever padding wraps it -- measured by comparing the
/// field's on-screen x to Apple Maps' at the same scale (see "Sizing the
/// collapsed detent" in
/// `docs/superpowers/specs/2026-09-07-map-sheet-search-bar-design.md` for the
/// numbers). Trimming the wrapper's horizontal padding by that 8 is what
/// keeps the field's visible margin at `SEARCH_MARGIN`, which the collapsed
/// detent is sized against; `SEARCH_MARGIN` itself stays untouched.
const SEARCH_BAR_HORIZONTAL_PADDING = SEARCH_MARGIN - 8

type Props = {
	campus: Campus
	/// True when the sheet is at a stop with room for the search field and
	/// nothing else. Drawing the category grid or a group's header there would
	/// not merely hide them: a `VStack` taller than the stop it is presented in
	/// is centred in it rather than clipped at the bottom, so they would take
	/// the top of the field off with them. The list stays, and compresses to
	/// nothing.
	compact: boolean
	onSelect: (id: string) => void
	/// Focus is what raises the sheet, and losing it may lower it -- but only
	/// when the field is empty, since a typed query still needs the room to
	/// show its results. The screen that owns the sheet decides; the picker
	/// only reports what happened.
	onSearchFocusChange: (focused: boolean, hasText: boolean) => void
	onSearchCancel: () => void
	/// The height of the search field and its margins, which is all the
	/// picker draws at the collapsed stop, so the screen can size that stop to
	/// hold it.
	onHeaderHeightChange: (height: number) => void
}

/// The picker's contents, as SwiftUI. The sheet that presents them, and the
/// `Host` they render into, both belong to the map screen.
///
/// A VStack rather than a List with the field inside it: a grouped List adds
/// its own section insets around anything it holds, which is what made the
/// old field's margins uneven and untunable. Out here the field's margins are
/// the padding modifier and nothing else.
export function BuildingPicker({
	campus,
	compact,
	onSelect,
	onSearchFocusChange,
	onSearchCancel,
	onHeaderHeightChange,
}: Props): React.ReactNode {
	let [typedQuery, setTypedQuery] = React.useState('')
	let query = useDebounce(typedQuery.trim(), SEARCH_DEBOUNCE_MS)

	let {data: buildings = [], error, isError, isLoading, refetch} = useQuery(mapDataOptions(campus))
	// A failed or pending fetch leaves no data; the bundled copy stands in.
	let {data: table = BUNDLED_MAP_CATEGORIES} = useQuery(mapCategoriesOptions)

	let groups = React.useMemo(() => groupsFor(table, campus, buildings), [table, campus, buildings])

	// Held with its campus, so a switch closes it; and looked up among the
	// groups that have places, so a group a refetch emptied closes too.
	let [opened, setOpened] = React.useState<{campus: Campus; label: MapGroupLabel} | null>(null)
	// Cleared during render rather than in an effect, as React recommends for
	// state that follows a prop, so a switch never draws the old group first.
	if (opened && opened.campus !== campus) {
		setOpened(null)
	}
	let openGroup =
		opened?.campus === campus ? groups.find((group) => group.label === opened.label) : undefined
	// A group a refetch emptied is closed, not just hidden, so its places
	// coming back later do not reopen it unasked. Only once groups exist:
	// while the map data loads there are none, and nothing has vanished.
	if (opened && !openGroup && groups.length > 0) {
		setOpened(null)
	}

	let searchResults = React.useMemo(
		() => (query ? searchPlaces(buildings, query) : []),
		[buildings, query],
	)
	let groupPlaces = React.useMemo(
		() => (openGroup ? placesIn(openGroup, buildings) : []),
		[openGroup, buildings],
	)

	let openFromTile = React.useCallback(
		(group: CategoryGroup) => {
			setOpened({campus, label: group.label})
			track({name: 'map.group.open', attributes: {group: group.label, campus}})
		},
		[campus],
	)

	// Counted when a search first comes up empty, not on every keystroke that
	// keeps it empty. The query itself is never sent.
	let isEmptySearch = query !== '' && !isLoading && !isError && searchResults.length === 0
	React.useEffect(() => {
		if (isEmptySearch) {
			track({name: 'map.search.empty', attributes: {}})
		}
	}, [isEmptySearch])

	let cancelSearch = React.useCallback(() => {
		setTypedQuery('')
		onSearchCancel()
	}, [onSearchCancel])

	return (
		<VStack spacing={0}>
			{/* CampusSearchBar takes no modifiers, so its margins live on the
			    stack around it. */}
			<VStack
				modifiers={[
					padding({horizontal: SEARCH_BAR_HORIZONTAL_PADDING, vertical: SEARCH_MARGIN}),
					onGeometryChange(({height}) => onHeaderHeightChange(height)),
				]}
			>
				<CampusSearchBar
					onCancel={cancelSearch}
					onFocusChange={(focused) => onSearchFocusChange(focused, typedQuery.trim() !== '')}
					onTextChange={setTypedQuery}
					placeholder={SEARCH_PLACEHOLDER}
					testID={SEARCH_PLACEHOLDER}
				/>
			</VStack>

			{/* Pinned under the field rather than scrolling with the list, so
			    the header reads as one block: grabber, field, group name. */}
			{compact || query || !openGroup ? null : (
				<GroupHeader label={openGroup.label} onBack={() => setOpened(null)} />
			)}

			<List>
				<Section>
					{isError ? (
						<Button onPress={() => void refetch()}>
							<VStack alignment="leading" spacing={2}>
								<Text>{`A problem occurred while loading: ${error}`}</Text>
								<Text>Tap to try again.</Text>
							</VStack>
						</Button>
					) : isLoading ? (
						<Text>Loading…</Text>
					) : query ? (
						searchResults.length === 0 ? (
							<Text>No buildings to show.</Text>
						) : (
							// Rendered directly, not wrapped in `List.ForEach`: that component
							// attaches `.onDelete`/`.onMove` unconditionally, which would put
							// swipe-to-delete and drag-to-reorder on this read-only picker.
							searchResults.map((building) => (
								<BuildingRow key={building.id} building={building} onSelect={onSelect} />
							))
						)
					) : openGroup ? (
						groupPlaces.map((building) => (
							<BuildingRow key={building.id} building={building} onSelect={onSelect} />
						))
					) : compact ? null : (
						// The grid is one row of the list, drawn without the row's
						// card, so Recents can later sit below it as its own section.
						<VStack
							modifiers={[
								listRowBackground('clear'),
								listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
							]}
						>
							<CategoryGrid groups={groups} onOpen={openFromTile} />
						</VStack>
					)}
				</Section>
			</List>
		</VStack>
	)
}

/// The open group's name, centered on the sheet's full width with a round
/// chevron-only back button at its leading edge, as Maps draws a category's
/// list. A ZStack rather than an HStack keeps the title centered whatever the
/// button beside it takes.
function GroupHeader({label, onBack}: {label: string; onBack: () => void}): React.ReactNode {
	return (
		<ZStack modifiers={[padding({horizontal: SEARCH_MARGIN, bottom: 8})]}>
			<Text modifiers={[font({textStyle: 'headline'}), accessibilityAddTraits(['isHeader'])]}>
				{label}
			</Text>
			<HStack>
				<Button
					modifiers={[buttonStyle('plain'), accessibilityLabel(GROUP_BACK_LABEL)]}
					onPress={onBack}
				>
					<Image
						modifiers={[
							font({textStyle: 'body', weight: 'semibold'}),
							foregroundStyle(c.secondaryLabel),
							frame({width: BACK_BUTTON_SIZE, height: BACK_BUTTON_SIZE}),
							background(c.tertiarySystemFill, shapes.circle()),
							contentShape(shapes.circle()),
						]}
						systemName="chevron.left"
					/>
				</Button>
				<Spacer />
			</HStack>
		</ZStack>
	)
}

function BuildingRow({
	building,
	onSelect,
}: {
	building: Feature<Building>
	onSelect: (id: string) => void
}): React.ReactNode {
	let {name} = building.properties
	// A house renamed each year for its residents carries every name, newest
	// first; the row shows the current one.
	let names = building.properties.nickname ?? []
	let nickname = typeof names === 'string' ? names : names[0]
	return (
		<Button
			// Without `plain`, SwiftUI tints a Button's whole label with the accent
			// colour and every building name reads as a link.
			modifiers={[buttonStyle('plain')]}
			onPress={() => onSelect(building.id)}
		>
			{/* contentShape belongs on the label (this HStack), not the Button:
			    SwiftUI derives a button's tappable region from its label, so the
			    Spacer's width -- most of the row -- was dead to taps. The same
			    note is on Settings' NavigationRow. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]} spacing={8}>
				<VStack alignment="leading" spacing={2}>
					<Text modifiers={[foregroundStyle({type: 'hierarchical', style: 'primary'})]}>
						{name}
					</Text>
					{nickname ? (
						<Text
							modifiers={[
								font({textStyle: 'footnote'}),
								foregroundStyle({type: 'hierarchical', style: 'secondary'}),
							]}
						>
							{nickname}
						</Text>
					) : null}
				</VStack>
				<Spacer />
				<RowAccessory destination="push" />
			</HStack>
		</Button>
	)
}
