import * as React from 'react'
import {StyleSheet, useWindowDimensions} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {
	Button,
	ContextMenu,
	Host,
	List,
	ScrollView,
	Section,
	Spacer,
	Text,
	Toggle,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	background,
	contentShape,
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listRowInsets,
	listRowSeparator,
	listStyle,
	multilineTextAlignment,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {useDispatch} from 'react-redux'
import {Restart} from 'react-native-restart-newarch'

import {visibleViews, type ViewType} from '../source/features/views'
import {CAMPUSES} from '../source/campuses'
import {useCampus, useCampusSection, useCampusStore} from '../source/features/campus/store'
import {switchIconForCampus} from '../source/features/customize/use-app-icon'
import {
	FILL_WIDTH,
	homeColumnsForFontScale,
	SCREEN_MARGIN,
	TILE_SPACING,
} from '../source/components/tile-layout'
import {TileGrid, useTileWidth} from '../source/components/tile-grid'
import {HomeScreenButton} from '../source/features/home/button'
import {visibleGroups} from '../source/features/home/groups'
import {HomeListRows} from '../source/features/home/list-rows'
import {useHomeLayoutStore} from '../source/features/home/store'
import {openUrl} from '@frogpond/open-url'
import {setDevModeOverride} from '../source/redux/parts/settings'
import {useIsDevMode} from '../source/lib/use-is-dev-mode'
import {track} from '../source/features/telemetry/track'
import {FaqBannerSlot} from '../source/features/faqs/banner'
import {CUSTOMIZE_LABEL} from '../source/features/customize/labels'
import {FAQ_TARGETS} from '../source/features/faqs/constants'
import {sample} from '@frogpond/collections'
import {
	NOW_PLAYING_BAR_CLEARANCE,
	RadioNowPlayingBar,
	useRadioBarVisible,
	useRadioStore,
} from '../source/features/streaming/radio'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
	// Above the list, which insets its sections by `SCREEN_MARGIN`.
	banner: {
		marginHorizontal: SCREEN_MARGIN,
		marginTop: TILE_SPACING,
		marginBottom: TILE_SPACING * 1.5,
	},
	// Inside the scrolling layouts' own `SCREEN_MARGIN` padding, so no side margin of its own.
	paddedBanner: {
		marginTop: TILE_SPACING,
		marginBottom: TILE_SPACING * 1.5,
	},
})

const DEV_MESSAGES = [
	'made with  ⃟ in Ñ̸̞͖̘̱̰̥͇̗̂͌̇̎͊ͯ̎̓̎ͥ̋̐ͤͪͭ̚͘͢͢ø̸̛̞͊̎ͩ̍̉̑ͯͫͥ̚͟ͅ ̱̬̹̱̦®̵̬͖͙̻̩͓̖̠͉͈͍̈́̅͂͛̅̀͗ͤ̓́͡†̵̧͙̥̫̫͎̘̩̲̥̖̈̌͋̀ͨ̑̽̍̆̓̒̒̄̈́͒̓̕͜ ͍̩̫̼ͅ˙̶͕̰̗͓̯̫̲̮͕̪̝͎̩̬̺̔ͯ̌̈̽̌ͨ͊͊͐̀͆̽̐̓̃́̚͢͟ ̞̞̤ƒ͚͙̤ͭͪ͑̄͆͑ͯ̆͗̆ͨ̍̀͟͢ ̙͎̝͕͔̠͉̩̯͕͚̗̤ͅî̹̗̩̫̝̝͙̠̹̣̺̤̆ͭ̾̋ͬ̂ͫ̃̏ͥͬ́͜͠é̚ ̸͔͕̗̞̰́̅̅͒ ̪̩̞̰̫͓̞̱̫̞̭̯¬ͫ̾̆ ̍ͣ̎̀ͫͪͪ̋͌̂ ̪̘̯̝̤͌̆ͮ̕͜͜͡∂̢̛͕̻͖̈͌ͮ̂̾ͪͪ̑͋͂̂̂̂̈́̈́̓̌̍̌͜͞ ͙̫̤',
	'made with ∆ in Ñø®†˙ƒîé¬∂',
	'Made with 🤞 in ⬆️🌾',
	'⬆️🌾=🐄🏫♥️',
]

const RESTART_ACTION = 'Restart app'
const DEV_MODE_ACTION = 'Enable dev mode'
/// Offered in dev mode only; the choice outlasts dev mode.
const CAMPUS_SECTION = 'Campus'

const NOTICE_RADIUS = 7
const NOTICE_PADDING = 8
/// React Native's default iOS font size, which the old StyleSheet relied on.
const NOTICE_FONT_SIZE = 14
/// Pairs with the size so the notice scales with Dynamic Type, as the React
/// Native Text it replaced did. The style sets the scaling curve only.
const NOTICE_TEXT_STYLE = 'footnote'

const noticeShape = shapes.roundedRectangle({
	cornerRadius: NOTICE_RADIUS,
	roundedCornerStyle: 'circular',
})

function UnofficialAppNotice(): React.ReactNode {
	const dispatch = useDispatch()
	const isDev = useIsDevMode()
	const {notices} = useCampusSection('branding')
	const campusId = useCampusStore((state) => state.campus)
	const setCampus = useCampusStore((state) => state.setCampus)

	const message = React.useMemo(() => {
		const messages = isDev ? [...notices, ...DEV_MESSAGES] : notices
		return sample(messages)
	}, [notices, isDev])

	return (
		<ContextMenu>
			<ContextMenu.Trigger>
				<Text
					modifiers={[
						font({size: NOTICE_FONT_SIZE, textStyle: NOTICE_TEXT_STYLE}),
						foregroundStyle(c.secondaryLabel),
						multilineTextAlignment('center'),
						padding({all: NOTICE_PADDING}),
						frame({maxWidth: FILL_WIDTH}),
						background(c.secondarySystemFill, noticeShape),
						// without this the long-press only lands on the glyphs
						// themselves; the fill is painted behind, not hit-tested
						contentShape(noticeShape),
						accessibilityIdentifier('home-notice'),
					]}
				>
					{message}
				</Text>
			</ContextMenu.Trigger>
			<ContextMenu.Items>
				<Button
					label={RESTART_ACTION}
					onPress={() => {
						Restart()
					}}
				/>
				<Button
					label={DEV_MODE_ACTION}
					onPress={() => {
						dispatch(setDevModeOverride(!isDev))
					}}
					systemImage={isDev ? 'checkmark' : undefined}
				/>
				{isDev ? (
					<Section title={CAMPUS_SECTION}>
						{/* A Toggle, which a menu draws with the platform's own checkmark. */}
						{CAMPUSES.map((option) => (
							<Toggle
								key={option.id}
								isOn={option.id === campusId}
								label={option.name}
								onIsOnChange={() => {
									setCampus(option.id)
									switchIconForCampus(option)
								}}
							/>
						))}
					</Section>
				) : null}
			</ContextMenu.Items>
		</ContextMenu>
	)
}

/// A list row with nothing of a row's own: no fill, margins or divider, so the
/// spacer sits on the list's background rather than in a cell.
const BARE_ROW_MODIFIERS = [
	listRowBackground('clear'),
	listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
	listRowSeparator('hidden'),
]
/// The notice as the list's footer: as wide as the card above it rather than
/// indented to its text, and a little way below it.
const NOTICE_FOOTER_MODIFIERS = [
	listRowInsets({top: TILE_SPACING * 2, leading: 0, bottom: 0, trailing: 0}),
]

/** The inset of a tile group's heading on the tiled Home, as a list's section header has. */
const GROUP_HEADING_INSET = 16

/**
 * A tile group's heading on the tiled Home, styled like the section headers of
 * an inset-grouped list, as Menus has them: headline, semibold, secondary,
 * inset from the grid's edge.
 */
function GroupHeading({title}: {title: string}): React.ReactNode {
	return (
		<Text
			modifiers={[
				font({textStyle: 'headline', weight: 'semibold'}),
				foregroundStyle(c.secondaryLabel),
				padding({horizontal: GROUP_HEADING_INSET, top: TILE_SPACING}),
				accessibilityLabel(title),
				accessibilityAddTraits(['isHeader']),
			]}
		>
			{title}
		</Text>
	)
}

/// Names the home's tile grid.
const HOME_GRID_ID = 'home-tile-grid'
/// The menu in the navigation bar's corner, which `TestIdentifiers.Navigation.homeMenu` finds by name.
const HOME_MENU_LABEL = 'Home menu'

/** A tile's destination: a screen in the app, or a page opened outside it. */
function useOpenView(): (view: ViewType) => void {
	let router = useRouter()
	return React.useCallback(
		(view: ViewType) => {
			if (view.type === 'url') {
				openUrl(view.url)
			} else if (view.type === 'view') {
				router.navigate(view.view)
			} else if (view.type === 'radio') {
				useRadioStore.getState().openSheet(view.station)
			} else {
				throw new Error(`unexpected view type ${view.type}`)
			}
		},
		[router],
	)
}

export default function HomePage(): React.ReactNode {
	let router = useRouter()
	let isDev = useIsDevMode()
	let openView = useOpenView()
	let {fontScale} = useWindowDimensions()
	let tileWidth = useTileWidth(homeColumnsForFontScale(fontScale))
	let layout = useHomeLayoutStore((state) => state.layout)
	// The saved layout loads after the first render. Drawing before then would
	// draw the default and jump.
	let layoutHydrated = useHomeLayoutStore((state) => state.hydrated)
	// The saved campus loads after the first render too, and drawing St. Olaf's
	// tiles before it would jump on a Carleton install.
	let campusHydrated = useCampusStore((state) => state.hydrated)
	let hydrated = layoutHydrated && campusHydrated
	let {branding, home, id: campusId} = useCampus()
	let barVisible = useRadioBarVisible()
	let views = visibleViews(home.tiles, {isDev})
	let groups = visibleGroups(home.groups, {isDev})
	let openGroupView = (view: ViewType) => {
		track({name: 'home.group.open', attributes: {campus: campusId}})
		openView(view)
	}
	// Under the last section of the list, whichever that is.
	let notice = (
		<VStack modifiers={NOTICE_FOOTER_MODIFIERS}>
			<UnofficialAppNotice />
		</VStack>
	)

	return (
		<>
			<Stack.Title>{branding.appName}</Stack.Title>
			<Stack.Toolbar placement="left">
				<Stack.Toolbar.Button
					accessibilityLabel={CUSTOMIZE_LABEL}
					icon="paintbrush"
					onPress={() => router.navigate('/customize')}
				/>
			</Stack.Toolbar>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu accessibilityLabel={HOME_MENU_LABEL} icon="ellipsis">
					<Stack.Toolbar.Menu inline={true}>
						<Stack.Toolbar.MenuAction
							icon="lifepreserver"
							onPress={() => router.navigate('/support')}
						>
							Support
						</Stack.Toolbar.MenuAction>
						<Stack.Toolbar.MenuAction icon="info.circle" onPress={() => router.navigate('/about')}>
							About
						</Stack.Toolbar.MenuAction>
						<Stack.Toolbar.MenuAction
							icon="curlybraces"
							onPress={() => router.navigate('/contributing')}
						>
							Contributing
						</Stack.Toolbar.MenuAction>
					</Stack.Toolbar.Menu>
					<Stack.Toolbar.Menu inline={true}>
						<Stack.Toolbar.MenuAction
							icon="exclamationmark.bubble"
							onPress={() => router.navigate('/report-problem')}
						>
							Feedback
						</Stack.Toolbar.MenuAction>
					</Stack.Toolbar.Menu>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>
			<Host
				matchContents={false}
				modifiers={[accessibilityIdentifier('screen-homescreen')]}
				style={styles.host}
			>
				{!hydrated ? null : layout === 'list' ? (
					<VStack spacing={0}>
						{/* Above the list rather than a row in it: a row with nothing
						    in it, as when there is no banner, still takes a row's
						    minimum height. */}
						<FaqBannerSlot
							onPressFaq={(faqId) => router.navigate({pathname: '/faq', params: {faqId}})}
							style={styles.banner}
							target={FAQ_TARGETS.HOME}
						/>
						<List modifiers={[listStyle('insetGrouped')]}>
							<HomeListRows
								footer={groups.length === 0 ? notice : undefined}
								onOpen={openView}
								views={views}
							/>
							{groups.map((group, index) => (
								<HomeListRows
									key={group.title}
									footer={index === groups.length - 1 ? notice : undefined}
									onOpen={openGroupView}
									title={group.title}
									views={group.tiles}
								/>
							))}
							{/* Room to scroll the last of the list clear of the Now Playing bar. */}
							{barVisible ? (
								<Spacer
									modifiers={[...BARE_ROW_MODIFIERS, frame({height: NOW_PLAYING_BAR_CLEARANCE})]}
								/>
							) : null}
						</List>
					</VStack>
				) : (
					<ScrollView>
						<VStack
							modifiers={[
								padding({all: SCREEN_MARGIN}),
								// Room to scroll the last of Home clear of the Now Playing bar.
								padding({bottom: barVisible ? NOW_PLAYING_BAR_CLEARANCE : 0}),
								frame({maxWidth: FILL_WIDTH}),
							]}
							spacing={0}
						>
							{/* The banner is its own child, not one of the spaced groups
						    below: when there is no banner its slot is empty, and
						    spacing around an empty slot is a gap above the first group. */}
							<FaqBannerSlot
								onPressFaq={(faqId) => router.navigate({pathname: '/faq', params: {faqId}})}
								style={styles.paddedBanner}
								target={FAQ_TARGETS.HOME}
							/>

							<VStack spacing={TILE_SPACING}>
								<TileGrid
									accessibilityId={HOME_GRID_ID}
									columns={homeColumnsForFontScale(fontScale)}
									items={views}
									keyForItem={(view) => view.title}
									renderItem={(view) => (
										<HomeScreenButton
											width={tileWidth}
											onPress={() => openView(view)}
											view={view}
										/>
									)}
								/>

								{groups.map((group) => (
									<VStack key={group.title} alignment="leading" spacing={TILE_SPACING / 2}>
										<GroupHeading title={group.title} />
										<TileGrid
											accessibilityId={`home-group-${group.title}`}
											columns={homeColumnsForFontScale(fontScale)}
											items={group.tiles}
											keyForItem={(view) => view.title}
											renderItem={(view) => (
												<HomeScreenButton
													label={`${view.title}, ${group.title}`}
													onPress={() => openGroupView(view)}
													view={view}
													width={tileWidth}
												/>
											)}
										/>
									</VStack>
								))}

								<UnofficialAppNotice />
							</VStack>
						</VStack>
					</ScrollView>
				)}
			</Host>
			<RadioNowPlayingBar />
		</>
	)
}
