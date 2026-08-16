import * as React from 'react'
import {PlatformColor, StyleSheet} from 'react-native'
import {Stack, useRouter} from 'expo-router'
import {
	Button,
	ContextMenu,
	Grid,
	Host,
	RNHostView,
	ScrollView,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	background,
	contentShape,
	font,
	foregroundColor,
	frame,
	multilineTextAlignment,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import sample from 'lodash/sample'
import {useDispatch, useSelector} from 'react-redux'
import {Restart} from 'react-native-restart-newarch'

import {AllViews} from '../../source/features/views'
import type {ViewType} from '../../source/features/views'
import {
	CELL_MARGIN,
	FILL_WIDTH,
	HomeScreenButton,
	SCREEN_MARGIN,
} from '../../source/features/home/button'
import {openUrl} from '@frogpond/open-url'
import {selectDevModeOverride, setDevModeOverride} from '../../source/redux/parts/settings'
import {useIsDevMode} from '../../source/lib/use-is-dev-mode'
import {FaqBannerGroup} from '../../source/features/faqs/banner'
import {FAQ_TARGETS} from '../../source/features/faqs/constants'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
	banner: {
		marginHorizontal: SCREEN_MARGIN,
		marginTop: CELL_MARGIN,
		marginBottom: CELL_MARGIN / 2,
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
						foregroundColor(c.secondaryLabel),
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

/// Health lays its cards out as a grid, not as two columns: both cards in a row
/// share a height, so a two-line title on one side lifts the card beside it too.
/// Independent columns can't express that -- each card sizes to its own content
/// and the two sides drift out of step as the taller ones accumulate -- so the
/// views are grouped into rows and handed to a real Grid.
function inPairs(views: ViewType[]): ViewType[][] {
	let rows: ViewType[][] = []
	for (let i = 0; i < views.length; i += 2) {
		rows.push(views.slice(i, i + 2))
	}
	return rows
}

export default function HomePage(): React.ReactNode {
	let router = useRouter()
	let isDev = useIsDevMode()
	let allViews = AllViews().filter((view) => !view.disabled && (isDev || !view.devOnly))
	let rows = inPairs(allViews)

	return (
		<>
			<Stack.Screen
				options={{
					contentStyle: {backgroundColor: PlatformColor('systemBackground')},
					headerShadowVisible: false,
					headerLargeTitleEnabled: true,
					headerTransparent: true,
				}}
			/>
			<Stack.Title>All About Olaf</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Open Settings"
					icon="gear"
					onPress={() => router.push('/SettingsRoot')}
				/>
			</Stack.Toolbar>
			<Host
				matchContents={false}
				modifiers={[accessibilityIdentifier('screen-homescreen')]}
				style={styles.host}
			>
				<ScrollView>
					<VStack
						modifiers={[padding({all: SCREEN_MARGIN}), frame({maxWidth: FILL_WIDTH})]}
						spacing={CELL_MARGIN}
					>
						<RNHostView matchContents={true}>
							<FaqBannerGroup
								onPressFaq={(faqId) => router.push({pathname: '/Faq', params: {faqId}})}
								style={styles.banner}
								target={FAQ_TARGETS.HOME}
							/>
						</RNHostView>

						<Grid horizontalSpacing={CELL_MARGIN} verticalSpacing={CELL_MARGIN}>
							{rows.map((row, i) => (
								<Grid.Row key={i}>
									{row.map((view) => (
										<HomeScreenButton
											key={view.title}
											onPress={() => {
												if (view.type === 'url') {
													return openUrl(view.url)
												} else if (view.type === 'view') {
													return router.push(view.view)
												} else {
													throw new Error(`unexpected view type ${view.type}`)
												}
											}}
											view={view}
										/>
									))}
									{row.length === 1 ? <Spacer /> : null}
								</Grid.Row>
							))}
						</Grid>

						<UnofficialAppNotice />
					</VStack>
				</ScrollView>
			</Host>
		</>
	)
}
