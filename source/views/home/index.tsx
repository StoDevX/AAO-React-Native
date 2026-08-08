import * as React from 'react'
import {PlatformColor, StyleSheet} from 'react-native'
import {
	Grid,
	Host,
	RNHostView,
	ScrollView,
	Spacer,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	frame,
	padding,
} from '@expo/ui/swift-ui/modifiers'

import {AllViews} from '../views'
import type {ViewType} from '../views'
import {FaqBannerGroup} from '../faqs'
import {FAQ_TARGETS} from '../faqs/constants'
import {
	CELL_MARGIN,
	FILL_WIDTH,
	HomeScreenButton,
	SCREEN_MARGIN,
} from './button'
import {openUrl} from '@frogpond/open-url'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'
import {useIsDevMode} from '../../lib/use-is-dev-mode'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

const styles = StyleSheet.create({
	banner: {
		marginHorizontal: SCREEN_MARGIN,
		marginTop: CELL_MARGIN,
		marginBottom: CELL_MARGIN / 2,
	},
	host: {
		flex: 1,
	},
})

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

function HomePage(): React.ReactNode {
	let navigation = useNavigation()
	let isDev = useIsDevMode()
	let allViews = AllViews().filter(
		(view) => !view.disabled && (isDev || !view.devOnly),
	)
	let rows = inPairs(allViews)

	// SwiftUI owns the scrolling. Wrapping this in a React Native ScrollView
	// instead puts that scroll view between the touch and the SwiftUI buttons,
	// and the tiles stop responding reliably on device.
	return (
		<Host
			matchContents={false}
			modifiers={[accessibilityIdentifier('screen-homescreen')]}
			style={styles.host}
		>
			<ScrollView>
				<VStack
					modifiers={[
						padding({all: SCREEN_MARGIN}),
						frame({maxWidth: FILL_WIDTH}),
					]}
					spacing={CELL_MARGIN}
				>
					{/* The banner is still React Native, so it has to be hosted back
					    into SwiftUI to scroll with the rest of the content. */}
					<RNHostView matchContents={true}>
						<FaqBannerGroup style={styles.banner} target={FAQ_TARGETS.HOME} />
					</RNHostView>

					<Grid horizontalSpacing={CELL_MARGIN} verticalSpacing={CELL_MARGIN}>
						{rows.map((row, i) => (
							<Grid.Row key={i}>
								{row.map((view) => (
									<HomeScreenButton
										key={view.type === 'view' ? view.view : view.title}
										onPress={() => {
											if (view.type === 'url') {
												return openUrl(view.url)
											} else if (view.type === 'view') {
												return navigation.navigate(view.view)
											} else {
												throw new Error(`unexpected view type ${view.type}`)
											}
										}}
										view={view}
									/>
								))}
								{/* An odd number of views leaves the last row half empty.
								    Health leaves that slot blank rather than letting the
								    lone card run the full width. */}
								{row.length === 1 ? <Spacer /> : null}
							</Grid.Row>
						))}
					</Grid>

					<UnofficialAppNotice />
				</VStack>
			</ScrollView>
		</Host>
	)
}

export {HomePage as View}

export const NavigationKey = 'Home'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'All About Olaf',
	headerRight: (props) => <OpenSettingsButton {...props} />,
	// The cards carry their own colour and their own shadow, so the grouped grey
	// the navigation theme gives every other screen reads as a panel behind them
	// -- Shortcuts and Health both set their grid on the plain background. This
	// is scoped to this screen rather than changed in the theme, which the rest
	// of the app still wants. systemBackground rather than a literal, so it
	// follows the appearance the way the theme's own colour would.
	contentStyle: {backgroundColor: PlatformColor('systemBackground')},
	// The separator under the bar draws a line across the top of that same
	// background; neither app it copies has one.
	headerShadowVisible: false,
	// A large title that collapses as the grid scrolls, over a bar the cards
	// show through rather than disappear behind.
	//
	// There is deliberately no headerBlurEffect. It sets a UIBlurEffect material,
	// which is how a bar is blurred before iOS 26, and asking for one on 26 or
	// later replaces the glass the system puts there: the thickest material
	// leaves 11/255 of the card behind it showing and the thinnest reads plainly
	// pre-glass, against 29/255 for asking for nothing at all.
	//
	// Shortcuts manages 63/255, and the rest of that gap is not reachable from
	// here. Its bar lifts black to #1d2429 where this one leaves it at #060c0f,
	// and that luminosity is the part of glass a blur material does not have.
	// The other iOS 26 route, scrollEdgeEffects, needs a React Native ScrollView
	// among the screen's descendants, and this screen scrolls in SwiftUI.
	headerLargeTitleEnabled: true,
	headerTransparent: true,
}

export type NavigationParams = undefined
