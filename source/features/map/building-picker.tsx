import * as React from 'react'
import {Button, HStack, Image, List, Section, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {CampusSearchBar} from '@frogpond/campus-search-bar'
import {useDebounce} from '@frogpond/use-debounce'
import fuzzyfind from 'fuzzyfind'

import type {Campus} from '../building-hours/query'
import {CategoryPicker, LABEL_TO_CATEGORY, type CategoryLabel} from './category-picker'
import {mapDataOptions} from './query'
import type {Building, Feature} from './types'

/// Matches the debounce every other search screen in the app uses.
const SEARCH_DEBOUNCE_MS = 200

/// The picker lays the search bar out with this margin above and below it, in
/// LAYOUT space. `UISearchBar` is 64pt tall and centres its 44pt text field in
/// itself, so the space around the visible field is this plus the bar's own
/// 10pt -- 26pt, where Apple Maps has 16. The sheet's collapsed detent
/// (`SHEET_COLLAPSED_HEIGHT` in `Map/index.tsx`) is a SCREEN-space number
/// UIKit's presentation shrink sits between, not a multiple of this one; see
/// that constant's own comment for the numbers.
const SEARCH_MARGIN = 16
const SEARCH_PLACEHOLDER = 'Search for a place'

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
	onSelect: (id: string) => void
	/// Focus is what raises the sheet, and losing it may lower it -- but only
	/// when the field is empty, since a typed query still needs the room to
	/// show its results. The screen that owns the sheet decides; the picker
	/// only reports what happened.
	onSearchFocusChange: (focused: boolean, hasText: boolean) => void
	onSearchCancel: () => void
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
	onSelect,
	onSearchFocusChange,
	onSearchCancel,
}: Props): React.ReactNode {
	let [category, setCategory] = React.useState<CategoryLabel>('Buildings')
	let [typedQuery, setTypedQuery] = React.useState('')
	let query = useDebounce(typedQuery.trim(), SEARCH_DEBOUNCE_MS)

	let {data: buildings = [], error, isError, isLoading, refetch} = useQuery(mapDataOptions(campus))

	let visible = React.useMemo(() => {
		// fuzzyfind is subsequence-based and lowercases both sides itself, so
		// the needle only has to be trimmed -- a leading space would otherwise
		// have to appear in the name before any of the typed letters.
		if (query) {
			return fuzzyfind(query, buildings, {
				accessor: (b: Feature<Building>) => `${b.properties.name} ${b.properties.nickname ?? ''}`,
			})
		}
		let key = LABEL_TO_CATEGORY[category]
		return buildings.filter((b) => b.properties.categories?.includes(key))
	}, [buildings, category, query])

	let cancelSearch = React.useCallback(() => {
		setTypedQuery('')
		onSearchCancel()
	}, [onSearchCancel])

	return (
		<VStack spacing={0}>
			{/* CampusSearchBar takes no modifiers, so its margins live on the
			    stack around it. */}
			<VStack
				modifiers={[padding({horizontal: SEARCH_BAR_HORIZONTAL_PADDING, vertical: SEARCH_MARGIN})]}
			>
				<CampusSearchBar
					onCancel={cancelSearch}
					onFocusChange={(focused) => onSearchFocusChange(focused, typedQuery.trim() !== '')}
					onTextChange={setTypedQuery}
					placeholder={SEARCH_PLACEHOLDER}
					testID={SEARCH_PLACEHOLDER}
					text={typedQuery}
				/>
			</VStack>

			{/* Pinned under the field rather than scrolling with the list, so
			    the header reads as one block: grabber, field, segments. */}
			{query ? null : (
				<VStack modifiers={[padding({horizontal: SEARCH_MARGIN, bottom: 8})]}>
					<CategoryPicker onChange={setCategory} selected={category} />
				</VStack>
			)}

			<List>
				<Section>
					{isError ? (
						<Button onPress={() => void refetch()}>
							<VStack alignment="leading" spacing={2}>
								<Text>{`A problem occured while loading: ${error}`}</Text>
								<Text>Tap to try again.</Text>
							</VStack>
						</Button>
					) : isLoading ? (
						<Text>Loading…</Text>
					) : visible.length === 0 ? (
						<Text>No buildings to show.</Text>
					) : (
						// Rendered directly, not wrapped in `List.ForEach`: that component
						// attaches `.onDelete`/`.onMove` unconditionally, which would put
						// swipe-to-delete and drag-to-reorder on this read-only picker.
						visible.map((building) => (
							<BuildingRow key={building.id} building={building} onSelect={onSelect} />
						))
					)}
				</Section>
			</List>
		</VStack>
	)
}

function BuildingRow({
	building,
	onSelect,
}: {
	building: Feature<Building>
	onSelect: (id: string) => void
}): React.ReactNode {
	let {name, nickname} = building.properties
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
				{/* A Button is not a NavigationLink, so the disclosure chevron the
				    rest of the app's rows get from the platform has to be drawn. */}
				<Image
					modifiers={[foregroundStyle({type: 'hierarchical', style: 'tertiary'})]}
					size={13}
					systemName="chevron.right"
				/>
			</HStack>
		</Button>
	)
}
