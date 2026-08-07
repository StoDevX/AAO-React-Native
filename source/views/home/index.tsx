import * as React from 'react'
import {StyleSheet} from 'react-native'
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
}

export type NavigationParams = undefined
