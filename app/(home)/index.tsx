import * as React from 'react'
import {PlatformColor, StyleSheet} from 'react-native'
import {Stack, useRouter} from 'expo-router'
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

import {AllViews} from '../../source/views/views'
import type {ViewType} from '../../source/views/views'
import {
	CELL_MARGIN,
	FILL_WIDTH,
	HomeScreenButton,
	SCREEN_MARGIN,
} from '../../source/views/home/button'
import {openUrl} from '@frogpond/open-url'
import {UnofficialAppNotice} from '../../source/views/home/notice'
import {useIsDevMode} from '../../source/lib/use-is-dev-mode'
import {FaqBannerGroup} from '../../source/views/faqs'
import {FAQ_TARGETS} from '../../source/views/faqs/constants'

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
	let allViews = AllViews().filter(
		(view) => !view.disabled && (isDev || !view.devOnly),
	)
	let rows = inPairs(allViews)

	return (
		<>
			<Stack.Screen
				options={{
					title: 'All About Olaf',
					contentStyle: {backgroundColor: PlatformColor('systemBackground')},
					headerShadowVisible: false,
					headerLargeTitleEnabled: true,
					headerTransparent: true,
				}}
			/>
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
						modifiers={[
							padding({all: SCREEN_MARGIN}),
							frame({maxWidth: FILL_WIDTH}),
						]}
						spacing={CELL_MARGIN}
					>
						<RNHostView matchContents={true}>
							<FaqBannerGroup
								onPressFaq={(faqId) =>
									router.push({pathname: '/Faq', params: {faqId}})
								}
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
