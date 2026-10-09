import * as React from 'react'
import {
	StyleSheet,
	Text,
	useColorScheme,
	useWindowDimensions,
	View,
	type NativeSyntheticEvent,
} from 'react-native'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import {BottomSheet, Group, Host, ZStack} from '@expo/ui/swift-ui'
import {
	accessibilityHidden,
	background,
	disabled,
	frame,
	interactiveDismissDisabled,
	opacity,
	presentationBackgroundInteraction,
	presentationDetents,
	presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers'
import {
	Camera,
	GeoJSONSource,
	Layer,
	Map,
	UserLocation,
	type CameraRef,
	type GeoJSONSourceRef,
	type MapRef,
	type PressEvent,
	type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native'
import {useQuery} from '@tanstack/react-query'
import {Stack, useIsFocused, useLocalSearchParams} from 'expo-router'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'

import {campusById, type CampusId} from '../../source/campuses'
import type {MapSection} from '../../source/features/map/campus-section'
import {useCampusParam} from '../../source/features/campus/campus-param'
import {NoticeView} from '@frogpond/notice'
import {cardVenuesOptions} from '../../source/features/map/card-queries'
import {PlaceStackCard} from '../../source/features/map/place-stack-card'
import {highlightedFeatureId, placeStack} from '../../source/features/map/lib/place-stack'
import {BuildingPicker} from '../../source/features/map/building-picker'
import {framingFor, type Framing, type MapPins} from '../../source/features/map/lib/map-pins'
import {placeForTap, tapCandidates} from '../../source/features/map/lib/place-for-tap'
import {
	highlightedFootprint,
	selectionFor,
	selectionFraming,
} from '../../source/features/map/lib/selection'
import {MapPinImages, MapPinsLayer} from '../../source/features/map/map-pins-layer'
import {linkedPlace} from '../../source/features/map/lib/linked-place'
import {MapSelectionLayer} from '../../source/features/map/map-selection-layer'
import {useFrameRequests} from '../../source/features/map/use-frame-requests'
import {SELECTED, useFootprintHighlight} from '../../source/features/map/use-footprint-highlight'
import {sheetHeightFor} from '../../source/features/map/lib/sheet-height'
import {toBuildingFootprints} from '../../source/features/map/lib/building-footprints'
import {
	nextSheetDetent,
	type SheetEvent,
	type SheetState,
} from '../../source/features/map/lib/sheet-moves'
import {collapsedDetentFor, detentsFor, nameOf} from '../../source/features/map/lib/sheet-detents'
import {mapDataOptions} from '../../source/features/map/query'
import {useRecentPlacesStore} from '../../source/features/map/store'
import type {Building, Feature} from '../../source/features/map/types'
import {useMapStyleUrl} from '../../source/features/map/style-query'
import {mapCredits} from '../../source/features/map/urls'

const DEFAULT_ZOOM = 15
const SELECTION_ZOOM = 17
const CAMERA_ANIMATION_MS = 500
const MIN_TOUCH_TARGET = 44
/// How far from a touch a place's drawn name still counts as tapped: half
/// the minimum touch target, so the name's box need not be hit exactly.
const LABEL_TOUCH_RADIUS = MIN_TOUCH_TARGET / 2
/// How far from a touch a trail's line still counts as tapped: about the line's
/// own width at campus zooms, so a tap in the pond a loop circles opens the pond.
const LINE_TOUCH_RADIUS = 8
/// Room kept around framed pins, and above them for the floating header.
const PIN_MARGIN = 40
const HEADER_CLEARANCE = 44

/// The footprints are drawn by the tileset, so this layer paints only the open
/// place's building, tinted under its dot. It stays for every building
/// because it is the tap target, and the source's only child: MapLibre
/// resolves a source press against a *rendered* layer. Zero opacity still
/// hit-tests, since it is `visibility: none` rather than opacity that drops a
/// layer from the tree.
const SELECTED_FOOTPRINT_OPACITY = 0.3

export default function MapPage(): React.ReactNode {
	// A link with no campus, or one this build doesn't know -- `?campus=carleton`
	// from a 2.9 Home Screen quick action -- opens the active campus's map.
	// Every link the app draws names its campus.
	let {campus: campusParam, place} = useLocalSearchParams<{campus?: string; place?: string}>()
	let campus = useCampusParam(campusParam)
	let map = campusById(campus).map
	if (!map) {
		return (
			<>
				<Stack.Screen options={{title: 'Map'}} />
				<NoticeView description="This campus has no map." systemImage="map" title="No Map" />
			</>
		)
	}
	return <CampusMap campus={campus} map={map} placeParam={place} />
}

type CampusMapProps = {campus: CampusId; map: MapSection; placeParam: string | undefined}

function CampusMap({campus, map, placeParam}: CampusMapProps): React.ReactNode {
	let scheme = useColorScheme()
	let mapStyleUrl = useMapStyleUrl(campus, map, scheme)
	let cameraRef = React.useRef<CameraRef>(null)
	let mapRef = React.useRef<MapRef>(null)
	let footprintsRef = React.useRef<GeoJSONSourceRef>(null)
	// The sheet is the map's, not a route's, so its selection is the map's too.
	// The places open on the map, bottom to top: the sheet's card, then each
	// stacked over it.
	let [stack, dispatchStack] = React.useReducer(placeStack, [])
	let {data: buildings = [], error} = useQuery(mapDataOptions(campus))
	// For which feature a venue on top of the stack highlights.
	let {data: venues = []} = useQuery(cardVenuesOptions(campus))
	let {height: windowHeight} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	// A card covers the picker while any place is open.
	let covered = stack.length > 0
	let [sheetPresented, setSheetPresented] = React.useState(true)
	// The sheet is presented in a window of its own, above the whole
	// navigation stack, so a screen pushed over the map -- by a deep link or a
	// Home Screen quick action -- would sit under it. It is presented only
	// while the map is the screen showing.
	let isFocused = useIsFocused()
	// Where the sheet rests, and where a search focus lifted it from. Every
	// move goes through `nextSheetDetent`, including the user's own drags.
	let [sheet, setSheet] = React.useState<SheetState>({current: 'collapsed', previous: null})
	let dispatchSheet = React.useCallback((event: SheetEvent) => {
		setSheet((state) => nextSheetDetent(event, state))
	}, [])

	// The sheet has no dismissed state. `interactiveDismissDisabled` should keep
	// it up, but if the system ever reports otherwise, present it again rather
	// than leaving the user on a bare map with no way to search.
	//
	// Storing the dismissal and undoing it here is the mechanism, not an
	// oversight: `isPresented` has to actually change for the native view to
	// hear about it, so re-presenting takes a render at `false` first. This is
	// the external-system case the rule carves out.
	React.useEffect(() => {
		if (!sheetPresented) {
			// oxlint-disable-next-line react/set-state-in-effect
			setSheetPresented(true)
		}
	}, [sheetPresented])

	// How much of the map the sheet is covering right now, which is what the
	// camera has to keep clear.
	// A fraction is measured against the window less the top inset, so the
	// camera is padded against the same thing rather than the whole window.
	// The picker's search field grows with the text size, and the collapsed
	// stop grows to hold it. A card keeps the default stop, as Apple Maps'
	// does: at large text sizes its header keeps its top in view and runs off
	// the bottom.
	let [pickerHeaderHeight, setPickerHeaderHeight] = React.useState<number | null>(null)
	let collapsedHeight = covered ? null : pickerHeaderHeight
	let detents = React.useMemo(
		() => detentsFor(collapsedDetentFor(collapsedHeight)),
		[collapsedHeight],
	)
	let sheetHeight = sheetHeightFor(detents[sheet.current], windowHeight - insets.top)

	let footprints = React.useMemo(() => toBuildingFootprints(buildings), [buildings])

	// One sheet, whose contents swap. Tapping a second place while cards are
	// up starts afresh from it, as Maps does.
	let openPlace = React.useCallback(
		(id: string) => {
			dispatchStack({type: 'start', id})
			dispatchSheet({type: 'footprint-tapped'})
		},
		[dispatchSheet],
	)

	// A link can open a place by its feature id: `/map?campus=edu.stolaf&place=toh`.
	// It opens once its places have loaded, and only once per link, so closing
	// its card leaves the map as the user left it.
	let opened = React.useRef<string | null>(null)
	let linked = linkedPlace(placeParam, buildings)
	React.useEffect(() => {
		if (linked && opened.current !== linked) {
			opened.current = linked
			openPlace(linked)
		}
	}, [linked, openPlace])

	// A tap opens the place whose name is drawn under it -- The Cage, inside
	// Buntrock -- or the trail drawn under it, before the building it landed
	// in. Anything the style draws with a `buildingId` counts, whichever layer
	// draws it, so the style can be restyled from the server without the app
	// knowing its layer names.
	let openPlaceAt = React.useCallback(
		async (pressed: PressEvent, building: string | null) => {
			let [x, y] = pressed.point
			let drawnWithin = (radius: number) =>
				mapRef.current
					?.queryRenderedFeatures(
						[
							[x - radius, y - radius],
							[x + radius, y + radius],
						],
						{filter: ['has', 'buildingId']},
					)
					.catch(() => [])
			let [near, close, under] = await Promise.all([
				drawnWithin(LABEL_TOUCH_RADIUS),
				drawnWithin(LINE_TOUCH_RADIUS),
				// A point's worth of box: what is drawn at the touch itself.
				drawnWithin(1),
			])
			let id = placeForTap(
				tapCandidates(near ?? [], close ?? [], under ?? []),
				[pressed.lngLat[0], pressed.lngLat[1]],
				building,
			)
			if (id) {
				openPlace(id)
			}
		},
		[openPlace],
	)

	// The source hands back whichever footprint was under the touch, so the
	// tap resolves against exactly the geometry the user can see. MapLibre also
	// applies a 44pt hitbox to it by default. Stopped here, so the map's own
	// handler does not open the place a second time.
	let handleBuildingPress = React.useCallback(
		(event: NativeSyntheticEvent<PressEventWithFeatures>) => {
			event.stopPropagation()
			// GeoJSON properties are typed as `any` by the spec's types, so this
			// is the boundary where that gets narrowed back to something real.
			let id: unknown = event.nativeEvent.features[0]?.properties?.buildingId
			let {point, lngLat} = event.nativeEvent
			void openPlaceAt({point, lngLat}, typeof id === 'string' ? id : null)
		},
		[openPlaceAt],
	)

	// A tap on no building can still land on a place's name: the Windmill and
	// the Chime Tower stand outside every footprint.
	let handleMapPress = React.useCallback(
		(event: NativeSyntheticEvent<PressEvent>) => {
			let {point, lngLat} = event.nativeEvent
			void openPlaceAt({point, lngLat}, null)
		},
		[openPlaceAt],
	)

	// The place at the bottom of the stack is the one opened from the map
	// itself -- a row, a pin, a building or a name -- and so the one Recents
	// keeps; places stacked over it from its card are not.
	let rememberPlace = useRecentPlacesStore((state) => state.remember)
	let openedId = stack[0]?.kind === 'feature' ? stack[0].id : undefined
	React.useEffect(() => {
		if (openedId) {
			rememberPlace(campus, openedId)
		}
	}, [openedId, campus, rememberPlace])

	// Opening a group frames its pins above the sheet, which a full sheet
	// would leave no room for.
	let makeRoomForGroup = React.useCallback(() => {
		dispatchSheet({type: 'group-opened'})
	}, [dispatchSheet])

	// What the sheet is listing, pinned. The picker stays mounted under a
	// card, so these persist while a card is open.
	let [pins, setPins] = React.useState<MapPins | null>(null)

	// Frames what a Framing asks for in the map above the sheet and below the
	// header: a box fitted, one place eased to at the selection zoom.
	let applyFraming = (framing: Framing) => {
		if (framing?.kind === 'fit') {
			cameraRef.current?.fitBounds(framing.bounds, {
				padding: {
					top: insets.top + HEADER_CLEARANCE,
					bottom: sheetHeight + PIN_MARGIN,
					left: PIN_MARGIN,
					right: PIN_MARGIN,
				},
				duration: CAMERA_ANIMATION_MS,
			})
		} else if (framing?.kind === 'ease') {
			cameraRef.current?.easeTo({
				center: framing.center,
				duration: CAMERA_ANIMATION_MS,
				// The sheet sits over the bottom of the map, so centring on the
				// place put it underneath. Pad by where the sheet actually is: a
				// hardcoded half-screen lifted it far too high whenever the sheet
				// was resting collapsed.
				padding: {bottom: sheetHeight},
				zoom: SELECTION_ZOOM,
			})
		}
	}

	// Frames places above the sheet: several fit, one eased to.
	let frameOn = (places: Array<Feature<Building>>) => applyFraming(framingFor(places))

	// The map follows the top of the stack.
	let highlightedId = highlightedFeatureId(stack, venues)
	let selectedPlace = React.useMemo(
		() => (highlightedId ? buildings.find((b) => b.id === highlightedId) : undefined),
		[highlightedId, buildings],
	)
	let selection = React.useMemo(
		() => (selectedPlace ? selectionFor(selectedPlace) : null),
		[selectedPlace],
	)
	let footprintIds = React.useMemo(
		() => new Set(footprints.features.map((footprint) => footprint.id)),
		[footprints],
	)
	// A source takes no feature state until its style has loaded, so each load
	// sets the highlight again, as new footprints do.
	let [styleLoads, countStyleLoad] = React.useReducer((count: number) => count + 1, 0)
	let footprintsResetKey = React.useMemo(() => ({footprints, styleLoads}), [footprints, styleLoads])
	useFootprintHighlight(
		footprintsRef,
		selectedPlace ? highlightedFootprint(selectedPlace, footprintIds) : null,
		footprintsResetKey,
	)

	// Reads the sheet's height at the moment of selection without depending on
	// it: Apple Maps leaves the map where it is when its sheet changes stop, so
	// only a new selection moves the camera. A trail is framed whole; anything
	// else is eased to.
	let frameSelection = React.useEffectEvent((place: Feature<Building>) => {
		applyFraming(selectionFraming(place))
	})

	React.useEffect(() => {
		if (selectedPlace) {
			frameSelection(selectedPlace)
		}
	}, [selectedPlace])

	// Framed only when the picker asks -- a tile tap or a finished search --
	// never as results change while typing, and never over an open card.
	useFrameRequests(pins, covered, (requested) => frameOn(requested.places))

	// A cluster frames the places it holds, so it opens up in the map above
	// the sheet rather than around the middle of the screen, which at the
	// middle stop is the sheet's edge.
	let frameCluster = (ids: string[]) => {
		let held = new Set(ids)
		frameOn(buildings.filter((building) => held.has(building.id)))
	}

	return (
		<View style={StyleSheet.absoluteFill}>
			{/* The map runs up under a clear header, as Maps' does: only the Back
			    button and the About menu float over it. The title stays for the
			    next screen's Back button, but the header draws none. */}
			<Stack.Screen options={{title: map.title, headerTitle: '', headerTransparent: true}} />
			{/* The credits the tiles' licence requires, in place of MapLibre's own
			    button, which would sit loose on the map beside Back. */}
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu accessibilityLabel="About this map" icon="info.circle">
					{mapCredits(map).map((credit) => (
						// The compass says the item opens a site, as Safari's own icon does.
						<Stack.Toolbar.MenuAction
							key={credit.url}
							icon="safari"
							onPress={() => openUrl(credit.url)}
						>
							{credit.label}
						</Stack.Toolbar.MenuAction>
					))}
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>
			<Map
				ref={mapRef}
				attribution={false}
				logo={false}
				onDidFinishLoadingStyle={countStyleLoad}
				onPress={handleMapPress}
				mapStyle={mapStyleUrl}
				style={StyleSheet.absoluteFill}
			>
				<Camera
					ref={cameraRef}
					initialViewState={{center: [map.center[0], map.center[1]], zoom: DEFAULT_ZOOM}}
				/>
				<UserLocation />

				{/* carls-app/map-tiles serves the footprints and their labels as
				    `campus_buildings`, so this source no longer draws them -- a
				    second copy on top would double every outline. What it still
				    owns is the tap target. Keeping both here also keeps three tile-query
				    quirks out of the tap path: features repeat across tile
				    boundaries, the 28 places with no polygon are absent, and the
				    layer floors out at z14. A GeoJSON source has none of those. */}
				<GeoJSONSource
					data={footprints}
					id="campus-buildings"
					onPress={handleBuildingPress}
					ref={footprintsRef}
				>
					<Layer
						id="campus-buildings-hit"
						paint={{
							'fill-color': c.gold,
							'fill-opacity': [
								'case',
								['boolean', ['feature-state', SELECTED], false],
								SELECTED_FOOTPRINT_OPACITY,
								0,
							],
						}}
						type="fill"
					/>
				</GeoJSONSource>

				<MapPinImages />
				<MapPinsLayer onCluster={frameCluster} onSelect={openPlace} pins={pins} />

				<MapSelectionLayer selection={selection} />
			</Map>
			{/* Covers the map, and lets every touch through. The sheet is
			    presented rather than laid out, so the Host needs no size of its
			    own -- but the info card hosts a React Native image through
			    RNHostView, and a zero-sized Host gives that image no bounds to
			    draw into, so the photo came out blank. Full-bleed and
			    `pointerEvents="none"` satisfies both: the image gets a box, and
			    the taps that select a building still reach the map. The sheet is
			    presented in its own window, so it stays interactive. */}
			<Host pointerEvents="none" style={StyleSheet.absoluteFill}>
				<BottomSheet
					isPresented={sheetPresented && isFocused}
					onIsPresentedChange={setSheetPresented}
				>
					<Group
						modifiers={[
							// The sheet's own chrome is a translucent material, and the
							// map read straight through the list. A PlatformColor rather
							// than the hex `presentationBackground` wants, so the sheet
							// still follows the system appearance.
							background(c.systemGroupedBackground),
							presentationDetents([detents.collapsed, detents.medium, detents.large], {
								selection: detents[sheet.current],
								onSelectionChange: (to) => dispatchSheet({type: 'dragged', to: nameOf(to)}),
							}),
							presentationDragIndicator('visible'),
							// The map behind the sheet stays live at every stop, which is
							// the whole point of a sheet rather than a pushed screen.
							presentationBackgroundInteraction('enabled'),
							// Apple Maps' sheet has no dismissed state, and neither has
							// this one: the collapsed stop is as small as it goes.
							interactiveDismissDisabled(true),
						]}
					>
						{/* The picker stays mounted under a card, so closing the card
						    returns to the list as it was left: the same category, query
						    and scroll. Hidden by opacity rather than `hidden()`, which
						    @expo/ui applies in an if/else -- a new view identity each time
						    it flips, and a list scrolled back to the top.

						    A ZStack is as tall as its tallest child, and at the largest
						    text size the picker's header is taller than the collapsed
						    stop. The sheet would then centre the stack and cut off the
						    card's header, so a covered picker takes no height -- at the
						    collapsed stop only. Elsewhere it keeps its height: a list
						    squeezed to nothing lays its rows out again from estimates
						    when it returns, and where rows above wrap, the rows in view
						    jump. Always the flexible frame: @expo/ui switches to a fixed
						    one, and a new identity, once `height` is set. */}
						<ZStack alignment="top">
							<Group
								modifiers={[
									frame({
										maxHeight: covered && sheet.current === 'collapsed' ? 0 : undefined,
										alignment: 'top',
									}),
									opacity(covered ? 0 : 1),
									disabled(covered),
									accessibilityHidden(covered),
								]}
							>
								<BuildingPicker
									campus={campus}
									compact={sheet.current === 'collapsed'}
									onHeaderHeightChange={setPickerHeaderHeight}
									onGroupOpen={makeRoomForGroup}
									onPinsChange={setPins}
									onSearchCancel={() => dispatchSheet({type: 'search-cancelled'})}
									onSearchFocusChange={(focused, hasText) =>
										dispatchSheet(
											focused ? {type: 'search-focused'} : {type: 'search-blurred', hasText},
										)
									}
									onSelect={(id) => {
										dispatchStack({type: 'start', id})
										dispatchSheet({type: 'row-tapped'})
									}}
								/>
							</Group>
							{covered ? (
								<PlaceStackCard
									campus={campus}
									depth={0}
									dispatch={dispatchStack}
									stack={stack}
									stop={sheet.current}
								/>
							) : null}
						</ZStack>
					</Group>
				</BottomSheet>
			</Host>

			{error ? (
				<SafeAreaView edges={['left', 'right']} style={styles.banner}>
					<Text style={styles.bannerText}>
						Couldn’t load building data. Pan around the map; some features won’t work.
					</Text>
				</SafeAreaView>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	banner: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: c.systemBackground,
	},
	bannerText: {
		color: c.label,
		paddingHorizontal: 30,
		paddingVertical: 16,
		textAlign: 'center',
	},
})
