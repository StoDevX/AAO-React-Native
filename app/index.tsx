import * as React from 'react'
import {StyleSheet, useWindowDimensions} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {
	Button,
	ContextMenu,
	Host,
	List,
	RNHostView,
	ScrollView,
	Section,
	Spacer,
	Text,
	Toggle,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
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
import {useDispatch, useSelector} from 'react-redux'
import {Restart} from 'react-native-restart-newarch'

import {
	AllViews,
	homeSections,
	TiledViews,
	visibleViews,
	type HomeSection,
	type ViewType,
} from '../source/features/views'
import {HomeGroupHeader} from '../source/features/home/group-header'
import {
	FILL_WIDTH,
	homeColumnsForFontScale,
	SCREEN_MARGIN,
	TILE_SPACING,
} from '../source/components/tile-layout'
import {TileGrid} from '../source/components/tile-grid'
import {HomeScreenButton} from '../source/features/home/button'
import {HomeListSections} from '../source/features/home/list-sections'
import {useCollapsedGroupsStore, useHomeLayoutStore} from '../source/features/home/store'
import {openUrl} from '@frogpond/open-url'
import {selectDevModeOverride, setDevModeOverride} from '../source/redux/parts/settings'
import {useIsDevMode} from '../source/lib/use-is-dev-mode'
import {FaqBannerGroup} from '../source/features/faqs/banner'
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
	banner: {
		marginHorizontal: SCREEN_MARGIN,
		marginTop: TILE_SPACING,
		marginBottom: TILE_SPACING * 1.5,
	},
})

const BASE_MESSAGES = [
	'☃️ An Unofficial App Project ☃️',
	'For students, by students',
	'By students, for students',
	'An unofficial St. Olaf app',
	'For Oles, by Oles',
	'☃️',
	'🦁',
	'Made with ❤️ in Northfield, MN',
]

const DEV_MESSAGES = [
	'made with  ⃟ in Ñ̸̞͖̘̱̰̥͇̗̂͌̇̎͊ͯ̎̓̎ͥ̋̐ͤͪͭ̚͘͢͢ø̸̛̞͊̎ͩ̍̉̑ͯͫͥ̚͟ͅ ̱̬̹̱̦®̵̬͖͙̻̩͓̖̠͉͈͍̈́̅͂͛̅̀͗ͤ̓́͡†̵̧͙̥̫̫͎̘̩̲̥̖̈̌͋̀ͨ̑̽̍̆̓̒̒̄̈́͒̓̕͜ ͍̩̫̼ͅ˙̶͕̰̗͓̯̫̲̮͕̪̝͎̩̬̺̔ͯ̌̈̽̌ͨ͊͊͐̀͆̽̐̓̃́̚͢͟ ̞̞̤ƒ͚͙̤ͭͪ͑̄͆͑ͯ̆͗̆ͨ̍̀͟͢ ̙͎̝͕͔̠͉̩̯͕͚̗̤ͅî̹̗̩̫̝̝͙̠̹̣̺̤̆ͭ̾̋ͬ̂ͫ̃̏ͥͬ́͜͠é̚ ̸͔͕̗̞̰́̅̅͒ ̪̩̞̰̫͓̞̱̫̞̭̯¬ͫ̾̆ ̍ͣ̎̀ͫͪͪ̋͌̂ ̪̘̯̝̤͌̆ͮ̕͜͜͡∂̢̛͕̻͖̈͌ͮ̂̾ͪͪ̑͋͂̂̂̂̈́̈́̓̌̍̌͜͞ ͙̫̤',
	'made with ∆ in Ñø®†˙ƒîé¬∂',
	'Made with 🤞 in ⬆️🌾',
	'⬆️🌾=🐄🏫♥️',
]

const RESTART_ACTION = 'Restart app'
const DEV_MODE_ACTION = 'Enable dev mode'

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
	const devModeOverride = useSelector(selectDevModeOverride)
	const isDev = useIsDevMode()

	const message = React.useMemo(() => {
		const messages = isDev ? [...BASE_MESSAGES, ...DEV_MESSAGES] : BASE_MESSAGES
		return sample(messages)
	}, [isDev])

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
						dispatch(setDevModeOverride(!devModeOverride))
					}}
					systemImage={devModeOverride ? 'checkmark' : undefined}
				/>
			</ContextMenu.Items>
		</ContextMenu>
	)
}

/// Names a group's tile grid.
const groupGridId = (group: string): string => `home-group-grid-${group}`
/// A list row with nothing of a row's own: no fill, margins or divider, so the
/// banner and the notice sit on the list's background rather than in a cell.
const BARE_ROW_MODIFIERS = [
	listRowBackground('clear'),
	listRowInsets({top: 0, leading: 0, bottom: 0, trailing: 0}),
	listRowSeparator('hidden'),
]

/** The inset-grouped row's corner radius, as a Settings section's. */
const SWITCH_ROW_RADIUS = 26

const switchRowShape = shapes.roundedRectangle({
	cornerRadius: SWITCH_ROW_RADIUS,
	roundedCornerStyle: 'continuous',
})

/**
 * Lets someone who never listens take the radio's bar off Home. Turning it
 * off also stops the radio. Streaming Media keeps its bar, so the radio is
 * still a tap away there, and a station started from it brings Home's bar
 * back while it plays.
 *
 * A row of a list is already a row, so there it draws as a bare switch rather
 * than inside a rounded row of its own.
 */
function RadioPlayerSwitch({inList = false}: {inList?: boolean}): React.ReactNode {
	let on = useRadioStore((state) => state.showOnHome)
	let setOn = useRadioStore((state) => state.setShowOnHome)
	return (
		<Toggle
			isOn={on}
			label="Show Radio Player on Home"
			modifiers={[
				...(inList
					? []
					: [
							padding({horizontal: 16, vertical: 11}),
							background(c.secondarySystemGroupedBackground, switchRowShape),
						]),
				accessibilityIdentifier('show-radio-player'),
			]}
			onIsOnChange={setOn}
		/>
	)
}

/// Names the tiled home's tile grid.
const HOME_GRID_ID = 'home-tile-grid'
/// The menu in the navigation bar's corner, which `TestIdentifiers.Navigation.homeMenu` finds by name.
const HOME_MENU_LABEL = 'Home menu'
/// Names a group's header, for a UI test.
const groupHeaderId = (group: string): string => `home-group-header-${group}`

/** A tile's destination: a screen in the app, or a page opened outside it. */
function useOpenView(): (view: ViewType) => void {
	let router = useRouter()
	return React.useCallback(
		(view: ViewType) => {
			if (view.type === 'url') {
				openUrl(view.url)
			} else if (view.type === 'view') {
				router.navigate(view.view)
			} else {
				throw new Error(`unexpected view type ${view.type}`)
			}
		},
		[router],
	)
}

/// One group: its header, then its tiles two abreast unless it is collapsed.
function HomeGroupView({
	section,
	collapsed,
	onToggle,
	onOpen,
}: {
	section: HomeSection
	collapsed: boolean
	onToggle: () => void
	onOpen: (view: ViewType) => void
}): React.ReactNode {
	let {fontScale} = useWindowDimensions()

	return (
		<VStack
			alignment="leading"
			modifiers={[frame({maxWidth: FILL_WIDTH})]}
			spacing={TILE_SPACING / 2}
		>
			<HomeGroupHeader
				accessibilityId={groupHeaderId(section.id)}
				collapsed={collapsed}
				onToggle={section.collapsible ? onToggle : undefined}
				title={section.title}
			/>
			{collapsed ? null : (
				<TileGrid
					accessibilityId={groupGridId(section.id)}
					columns={homeColumnsForFontScale(fontScale)}
					items={section.views}
					keyForItem={(view) => view.id}
					renderItem={(view) => <HomeScreenButton onPress={() => onOpen(view)} view={view} />}
				/>
			)}
		</VStack>
	)
}

export default function HomePage(): React.ReactNode {
	let router = useRouter()
	let isDev = useIsDevMode()
	let collapsedGroups = useCollapsedGroupsStore((state) => state.collapsedGroups)
	let toggleGroup = useCollapsedGroupsStore((state) => state.toggleGroup)
	let openView = useOpenView()
	let {fontScale} = useWindowDimensions()
	let layout = useHomeLayoutStore((state) => state.layout)
	// The saved layout and collapsed groups load after the first render. Drawing
	// before then would draw the defaults and jump.
	let hydrated = useHomeLayoutStore((state) => state.hydrated)
	let groupsHydrated = useCollapsedGroupsStore((state) => state.hydrated)
	let setLayout = useHomeLayoutStore((state) => state.setLayout)
	let barVisible = useRadioBarVisible()
	let sections = homeSections(AllViews(), {isDev})
	let tiledViews = visibleViews(TiledViews(), {isDev})

	return (
		<>
			<Stack.Title>All About Olaf</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu accessibilityLabel={HOME_MENU_LABEL} icon="ellipsis">
					<Stack.Toolbar.Menu inline={true} palette={true} title="Layout">
						<Stack.Toolbar.MenuAction
							icon="square.grid.2x2"
							isOn={layout === 'tiled'}
							onPress={() => setLayout('tiled')}
						>
							Tiled
						</Stack.Toolbar.MenuAction>
						<Stack.Toolbar.MenuAction
							icon="rectangle.grid.1x2"
							isOn={layout === 'grouped'}
							onPress={() => setLayout('grouped')}
						>
							Grouped
						</Stack.Toolbar.MenuAction>
						<Stack.Toolbar.MenuAction
							icon="list.bullet"
							isOn={layout === 'list'}
							onPress={() => setLayout('list')}
						>
							List
						</Stack.Toolbar.MenuAction>
					</Stack.Toolbar.Menu>
					<Stack.Toolbar.MenuAction icon="gear" onPress={() => router.navigate('/settings')}>
						Settings
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>
			<Host
				matchContents={false}
				modifiers={[accessibilityIdentifier('screen-homescreen')]}
				style={styles.host}
			>
				{!hydrated || !groupsHydrated ? null : layout === 'list' ? (
					<VStack spacing={0}>
						{/* Above the list rather than a row in it: a row with nothing
						    in it, as when there is no banner, still takes a row's
						    minimum height. */}
						<RNHostView matchContents={true}>
							<FaqBannerGroup
								onPressFaq={(faqId) => router.navigate({pathname: '/faq', params: {faqId}})}
								style={styles.banner}
								target={FAQ_TARGETS.HOME}
							/>
						</RNHostView>
						<List modifiers={[listStyle('insetGrouped')]}>
							<HomeListSections onOpen={openView} sections={sections} />
							<VStack modifiers={BARE_ROW_MODIFIERS}>
								<UnofficialAppNotice />
							</VStack>
							<Section>
								<RadioPlayerSwitch inList={true} />
							</Section>
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
							<RNHostView matchContents={true}>
								<FaqBannerGroup
									onPressFaq={(faqId) => router.navigate({pathname: '/faq', params: {faqId}})}
									style={styles.banner}
									target={FAQ_TARGETS.HOME}
								/>
							</RNHostView>

							<VStack spacing={layout === 'tiled' ? TILE_SPACING : TILE_SPACING * 2}>
								{layout === 'tiled' ? (
									<TileGrid
										accessibilityId={HOME_GRID_ID}
										columns={homeColumnsForFontScale(fontScale)}
										items={tiledViews}
										keyForItem={(view) => view.title}
										renderItem={(view) => (
											<HomeScreenButton onPress={() => openView(view)} view={view} />
										)}
									/>
								) : (
									sections.map((section) => (
										<HomeGroupView
											collapsed={section.collapsible && collapsedGroups.includes(section.id)}
											key={section.id}
											onOpen={openView}
											onToggle={() => toggleGroup(section.id)}
											section={section}
										/>
									))
								)}

								<UnofficialAppNotice />

								<RadioPlayerSwitch />
							</VStack>
						</VStack>
					</ScrollView>
				)}
			</Host>
			<RadioNowPlayingBar />
		</>
	)
}
