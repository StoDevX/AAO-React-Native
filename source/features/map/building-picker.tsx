import * as React from 'react'
import {
	Button,
	HStack,
	Image,
	List,
	Section,
	Spacer,
	SwipeActions,
	Text,
	VStack,
	ZStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	background,
	buttonStyle,
	contentShape,
	dynamicTypeSize,
	font,
	foregroundStyle,
	frame,
	multilineTextAlignment,
	onGeometryChange,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as Sentry from '@sentry/react-native'
import {useQuery} from '@tanstack/react-query'
import {CampusSearchBar} from '@frogpond/campus-search-bar'
import * as c from '@frogpond/colors'
import {useDebounce} from '@frogpond/use-debounce'

import {LeadingImage, RowAccessory} from '../../components/rows'
import type {Campus} from '../building-hours/types'
import {CategoryGrid, ROW_ICON_WIDTH} from './category-grid'
import {mapCategoriesOptions} from './category-groups-query'
import {
	byName,
	type CategoryGroup,
	groupColor,
	groupsFor,
	type MapIconEntry,
	placeIcon,
	placesIn,
} from './lib/category-groups'
import {SEARCH_PIN_COLOR, type MapPins} from './lib/map-pins'
import {recentPlaces} from './lib/recent-places'
import {searchPlaces} from './lib/search-places'
import {mapDataOptions} from './query'
import {useRecentPlacesStore} from './store'
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
/// Finds the header's back button for a UI test. Its label alone also matches
/// the navigation bar's own Back button on iOS 27.
export const GROUP_BACK_ID = 'map-group-back'
/// The button's disc, at the 44pt minimum touch target.
const BACK_BUTTON_SIZE = 44
/// Space between the button and the title beside it.
const BACK_BUTTON_GAP = 8

/// Recents' header as Maps draws its sections: a grey title and a blue Clear
/// at headline size, and Clear tall enough to tap.
const RECENTS_TITLE_MODIFIERS = [font({textStyle: 'headline'}), foregroundStyle(c.secondaryLabel)]
const RECENTS_CLEAR_MODIFIERS = [
	buttonStyle('plain'),
	contentShape(shapes.rectangle()),
	frame({minHeight: BACK_BUTTON_SIZE}),
]
/// Clear's spoken name: "Clear" alone does not say what it empties.
export const RECENTS_CLEAR_LABEL = 'Clear Recents'

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
	/// What the sheet is listing, for the map to pin; see `MapPins`.
	onPinsChange: (pins: MapPins | null) => void
	/// A group was opened from its tile, so the screen can make room for the
	/// pins it is about to frame.
	onGroupOpen: () => void
}

/// The picker, or a row to draw it again if drawing it throws: a place or a
/// table this build cannot read then costs the sheet its contents rather
/// than taking the map down with it.
export function BuildingPicker(props: Props): React.ReactNode {
	return (
		<Sentry.ErrorBoundary
			fallback={(failed) => (
				<PickerFailed
					onHeaderHeightChange={props.onHeaderHeightChange}
					onRetry={() => failed.resetError()}
				/>
			)}
		>
			<PickerContents {...props} />
		</Sentry.ErrorBoundary>
	)
}

/// Shown in place of a picker that threw while drawing. It reports its
/// height as the search field's stack does, since the collapsed sheet is
/// sized to that height and would otherwise cut the row off.
function PickerFailed({
	onHeaderHeightChange,
	onRetry,
}: {
	onHeaderHeightChange: (height: number) => void
	onRetry: () => void
}): React.ReactNode {
	return (
		<VStack
			modifiers={[
				padding({all: SEARCH_MARGIN}),
				onGeometryChange(({height}) => onHeaderHeightChange(height)),
			]}
		>
			<Button onPress={onRetry}>
				<VStack alignment="leading" spacing={2}>
					<Text>A problem occurred while showing places.</Text>
					<Text>Tap to try again.</Text>
				</VStack>
			</Button>
		</VStack>
	)
}

/// The picker's contents, as SwiftUI. The sheet that presents them, and the
/// `Host` they render into, both belong to the map screen.
///
/// A VStack rather than a List with the field inside it: a grouped List adds
/// its own section insets around anything it holds, which is what made the
/// old field's margins uneven and untunable. Out here the field's margins are
/// the padding modifier and nothing else.
function PickerContents({
	campus,
	compact,
	onSelect,
	onSearchFocusChange,
	onSearchCancel,
	onHeaderHeightChange,
	onPinsChange,
	onGroupOpen,
}: Props): React.ReactNode {
	let [typedQuery, setTypedQuery] = React.useState('')
	let query = useDebounce(typedQuery.trim(), SEARCH_DEBOUNCE_MS)

	let {data: buildings = [], error, isError, isLoading, refetch} = useQuery(mapDataOptions(campus))
	// Starts as the bundled copy, and keeps it through a failed fetch.
	let {data: table} = useQuery(mapCategoriesOptions)

	let groups = React.useMemo(() => groupsFor(table, campus, buildings), [table, campus, buildings])
	let icons = table?.[campus]?.icons ?? []

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
	// coming back later do not reopen it unasked -- even when the refetch
	// emptied every group at once. Nothing can be open before the map data
	// first loads, since the tiles to open it from come from that data.
	if (opened && !openGroup) {
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
	let allPlaces = React.useMemo(() => byName(buildings), [buildings])
	// With no group to open -- a feed whose values the groups file does not
	// name -- every place is listed, so the sheet is never empty of rows.
	let listedPlaces = openGroup ? groupPlaces : groups.length === 0 ? allPlaces : []

	// Bumped when the camera should frame the pins: a tile tap, or a search
	// that ended with text once its results have caught up with the typing,
	// so pressing Search inside the debounce frames what was typed.
	let [frameKey, setFrameKey] = React.useState(0)
	let [searchEnded, setSearchEnded] = React.useState(false)
	if (searchEnded && query === typedQuery.trim()) {
		setSearchEnded(false)
		setFrameKey((key) => key + 1)
	}

	let openFromTile = React.useCallback(
		(group: CategoryGroup) => {
			setOpened({campus, label: group.label})
			setFrameKey((key) => key + 1)
			onGroupOpen()
			track({name: 'map.group.open', attributes: {group: group.label, campus}})
		},
		[campus, onGroupOpen],
	)

	// The fallback list of every place is not pinned: it is a list to scroll,
	// not a set of places someone asked to see.
	// The places opened on this campus's map, shown under the grid on the root
	// view alone -- not inside a group, not while searching.
	let recentIds = useRecentPlacesStore((state) => state.recent[campus])
	let forgetRecent = useRecentPlacesStore((state) => state.forget)
	let clearRecents = useRecentPlacesStore((state) => state.clear)
	let remembered = React.useMemo(() => recentPlaces(recentIds, buildings), [recentIds, buildings])
	let showsRecents =
		!compact &&
		!query &&
		!openGroup &&
		!isLoading &&
		!isError &&
		groups.length > 0 &&
		remembered.length > 0

	let pins = React.useMemo((): MapPins | null => {
		if (isLoading || isError) {
			return null
		}
		if (query) {
			return searchResults.length > 0
				? {places: searchResults, color: SEARCH_PIN_COLOR, frameKey}
				: null
		}
		if (openGroup) {
			return {places: groupPlaces, color: groupColor(openGroup.gradient), frameKey}
		}
		return null
	}, [isLoading, isError, query, searchResults, openGroup, groupPlaces, frameKey])

	React.useEffect(() => {
		onPinsChange(pins)
	}, [pins, onPinsChange])

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
					onFocusChange={(focused, fieldHasText) => {
						// A field of only spaces searches nothing, so ending it is
						// not a search that ended with text.
						let hasText = fieldHasText && typedQuery.trim() !== ''
						if (!focused && hasText) {
							setSearchEnded(true)
						}
						onSearchFocusChange(focused, hasText)
					}}
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
							<Text>{`No places match “${query}”.`}</Text>
						) : (
							// Rendered directly, not wrapped in `List.ForEach`: that component
							// attaches `.onDelete`/`.onMove` unconditionally, which would put
							// swipe-to-delete and drag-to-reorder on this read-only picker.
							searchResults.map((building) => (
								<BuildingRow
									key={building.id}
									building={building}
									icons={icons}
									onSelect={onSelect}
								/>
							))
						)
					) : buildings.length === 0 ? (
						<Text>No places to show.</Text>
					) : openGroup || groups.length === 0 ? (
						listedPlaces.map((building) => (
							<BuildingRow
								key={building.id}
								building={building}
								icons={icons}
								onSelect={onSelect}
							/>
						))
					) : compact ? null : (
						<CategoryGrid groups={groups} onOpen={openFromTile} />
					)}
				</Section>
				{showsRecents ? (
					<RecentsSection
						icons={icons}
						onClear={() => clearRecents(campus)}
						onForget={(id) => forgetRecent(campus, id)}
						onSelect={onSelect}
						places={remembered}
					/>
				) : null}
			</List>
		</VStack>
	)
}

/// The places opened most recently, under the grid, as Maps lists them. A row
/// swipes away on its own; Clear empties the section.
function RecentsSection({
	places,
	icons,
	onSelect,
	onForget,
	onClear,
}: {
	places: Array<Feature<Building>>
	icons: MapIconEntry[]
	onSelect: (id: string) => void
	onForget: (id: string) => void
	onClear: () => void
}): React.ReactNode {
	return (
		<Section
			header={
				<HStack>
					<Text modifiers={RECENTS_TITLE_MODIFIERS}>Recents</Text>
					<Spacer />
					<Button
						modifiers={[...RECENTS_CLEAR_MODIFIERS, accessibilityLabel(RECENTS_CLEAR_LABEL)]}
						onPress={onClear}
					>
						<Text modifiers={[font({textStyle: 'headline'}), foregroundStyle(c.systemBlue)]}>
							Clear
						</Text>
					</Button>
				</HStack>
			}
		>
			{/* Swipe actions per row rather than `List.ForEach`, whose `.onMove`
			    would offer to reorder a list whose order is when each was opened. */}
			{places.map((building) => (
				<SwipeActions key={building.id}>
					<BuildingRow building={building} icons={icons} onSelect={onSelect} />
					<SwipeActions.Actions allowsFullSwipe={true} edge="trailing">
						<Button
							label="Remove"
							onPress={() => onForget(building.id)}
							role="destructive"
							systemImage="trash"
						/>
					</SwipeActions.Actions>
				</SwipeActions>
			))}
		</Section>
	)
}

/// The open group's name, centered on the sheet's full width with a round
/// chevron-only back button at its leading edge, as Maps draws a category's
/// list. A ZStack rather than an HStack keeps the title centered whatever the
/// button beside it takes.
function GroupHeader({label, onBack}: {label: string; onBack: () => void}): React.ReactNode {
	return (
		<ZStack modifiers={[padding({horizontal: SEARCH_MARGIN, bottom: 8})]}>
			{/* Inset by the button on both sides, so a long title wraps beside it
			    instead of running under it, and stays centered on the sheet. */}
			<Text
				modifiers={[
					font({textStyle: 'headline'}),
					multilineTextAlignment('center'),
					padding({horizontal: BACK_BUTTON_SIZE + BACK_BUTTON_GAP}),
					accessibilityAddTraits(['isHeader']),
				]}
			>
				{label}
			</Text>
			<HStack>
				<Button
					modifiers={[
						buttonStyle('plain'),
						accessibilityLabel(GROUP_BACK_LABEL),
						accessibilityIdentifier(GROUP_BACK_ID),
					]}
					onPress={onBack}
				>
					<Image
						modifiers={[
							font({textStyle: 'body', weight: 'semibold'}),
							// The disc keeps its size at every text size, so the chevron
							// in it has to as well.
							dynamicTypeSize({max: 'large'}),
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
	icons,
	onSelect,
}: {
	building: Feature<Building>
	icons: MapIconEntry[]
	onSelect: (id: string) => void
}): React.ReactNode {
	let {name} = building.properties
	// Drawn as the category list draws its groups, so a pond reads as water
	// and a lot as parking before its name does.
	let {icon, gradient} = placeIcon(building.properties.categories, icons)
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
			<HStack modifiers={[contentShape(shapes.rectangle())]} spacing={12}>
				<LeadingImage
					image={{systemName: icon, tint: groupColor(gradient), width: ROW_ICON_WIDTH}}
				/>
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
