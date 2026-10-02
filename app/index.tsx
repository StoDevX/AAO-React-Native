import * as React from 'react'
import {StyleSheet, useWindowDimensions} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {Button, ContextMenu, Host, RNHostView, ScrollView, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	background,
	contentShape,
	font,
	foregroundStyle,
	frame,
	multilineTextAlignment,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {useDispatch, useSelector} from 'react-redux'
import {Restart} from 'react-native-restart-newarch'

import {AllViews, homeSections, type HomeSection, type ViewType} from '../source/features/views'
import {HomeGroupHeader} from '../source/features/home/group-header'
import {
	FILL_WIDTH,
	homeColumnsForFontScale,
	SCREEN_MARGIN,
	TILE_SPACING,
} from '../source/components/tile-layout'
import {TileGrid} from '../source/components/tile-grid'
import {HomeScreenButton} from '../source/features/home/button'
import {openUrl} from '@frogpond/open-url'
import {selectDevModeOverride, setDevModeOverride} from '../source/redux/parts/settings'
import {selectCollapsedHomeGroups, toggleHomeGroup} from '../source/redux/parts/home'
import {useIsDevMode} from '../source/lib/use-is-dev-mode'
import {FaqBannerGroup} from '../source/features/faqs/banner'
import {FAQ_TARGETS} from '../source/features/faqs/constants'
import {sample} from '@frogpond/collections'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
	banner: {
		marginHorizontal: SCREEN_MARGIN,
		marginTop: TILE_SPACING,
		marginBottom: TILE_SPACING * 2,
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

/// Mirrored by TestIdentifiers.Home.groupGrid.
const groupGridId = (group: string): string => `home-group-grid-${group}`
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
	let dispatch = useDispatch()
	let isDev = useIsDevMode()
	let collapsedGroups = useSelector(selectCollapsedHomeGroups)
	let openView = useOpenView()
	let sections = homeSections(AllViews(), {isDev})
	let {width: screenWidth} = useWindowDimensions()

	return (
		<>
			<Stack.Title>All About Olaf</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Open Settings"
					icon="gear"
					onPress={() => router.navigate('/settings')}
				/>
			</Stack.Toolbar>
			<Host
				matchContents={false}
				modifiers={[accessibilityIdentifier('screen-homescreen')]}
				style={styles.host}
			>
				<ScrollView>
					<VStack
						modifiers={[
							frame({width: screenWidth - 2 * SCREEN_MARGIN}),
							padding({all: SCREEN_MARGIN}),
						]}
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

						<VStack spacing={TILE_SPACING * 2}>
							{sections.map((section) => (
								<HomeGroupView
									collapsed={section.collapsible && collapsedGroups.includes(section.id)}
									key={section.id}
									onOpen={openView}
									onToggle={() => dispatch(toggleHomeGroup(section.id))}
									section={section}
								/>
							))}

							<UnofficialAppNotice />
						</VStack>
					</VStack>
				</ScrollView>
			</Host>
		</>
	)
}
