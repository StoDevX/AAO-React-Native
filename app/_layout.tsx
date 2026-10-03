// First, so a chaos run wraps fetch before anything can fetch.
import '../source/init/chaos'

// initialization
import '../source/init/constants'
import '../source/init/logbox'
import '../source/init/moment'
import * as sentryInit from '../source/init/sentry'
import '../source/init/api'
import {queryClient, persistOptions} from '../source/init/tanstack-query'
import {useScreenViews} from '../source/features/telemetry/use-screen-views'
import {watchQueryFailures} from '../source/features/telemetry/query-failures'
import {track} from '../source/features/telemetry/track'
import {startQuickActionSync} from '../source/features/quick-actions/sync'

import * as React from 'react'
import {PersistGate} from 'redux-persist/integration/react'
import {Provider as ReduxProvider} from 'react-redux'
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client'
import {store, persistor} from '../source/redux'
import {ChaosGuard} from '../source/chaos/guard'
import {navigationGuard} from '../source/lib/navigation-guard-install'
import {LightTheme, DarkTheme} from '@frogpond/app-theme'
import {ThemeProvider} from 'expo-router/react-navigation'
import {Stack, useNavigationContainerRef} from 'expo-router'
import * as Sentry from '@sentry/react-native'

import {LoadingView} from '@frogpond/notice'
import {IS_PRODUCTION} from '@frogpond/constants'
import {StatusBar, useColorScheme} from 'react-native'

import {SHEET_RESTING_FRACTION} from '../source/lib/constants'
import {RadioHost, RadioNowPlayingSheet} from '../source/features/streaming/radio'

/**
 * How every detail sheet in the app presents: a building's hours, a dictionary
 * entry, an Important Contact, a dish's nutrition, an event. One object rather
 * than one per route, so the screens cannot drift apart — two sheets stopping
 * at different heights, or dimming differently, reads as an accident rather
 * than a decision.
 *
 * `headerShown: false` because each of these routes nests a stack of its own
 * to draw its header inside the sheet. A header drawn by this stack instead is
 * a translucent large title with no opaque backing, so within a form sheet its
 * blur samples through and paints whatever sits behind the sheet across the
 * title.
 *
 * `sheetLargestUndimmedDetentIndex: 'none'` rather than `'last'`: whatever is
 * behind has nothing worth touching while a sheet is up, and an undimmed
 * detent lets UIKit pass taps through to it — a second tap on another row or
 * tile would push a second sheet on top of the first.
 *
 * The upper detent is a shade under 1 so the sheet keeps the inset that tells
 * a reader it is a sheet at all.
 */
const DETAIL_SHEET: React.ComponentProps<typeof Stack.Screen>['options'] = {
	presentation: 'formSheet',
	headerShown: false,
	sheetAllowedDetents: [SHEET_RESTING_FRACTION, 0.999],
	sheetGrabberVisible: true,
	sheetLargestUndimmedDetentIndex: 'none',
}

/**
 * Customize opens at half height: its rows fit there, and Home stays in view
 * above it. Otherwise it is a detail sheet: a stack of its own, a grabber, and
 * a dimmed Home that takes no taps.
 */
const CUSTOMIZE_SHEET: React.ComponentProps<typeof Stack.Screen>['options'] = {
	...DETAIL_SHEET,
	sheetAllowedDetents: [0.5, 0.999],
}

/**
 * Keeps the home screen beneath whatever a cold-start deep link opens, so
 * Back from, say, `/calendar` lands on Home rather than on nothing.
 */
export const unstable_settings = {
	anchor: 'index',
}

function RootLayout(): React.ReactNode {
	const scheme = useColorScheme()
	const theme = scheme === 'dark' ? DarkTheme : LightTheme
	const statusBarStyle = scheme === 'dark' ? 'light-content' : 'dark-content'
	const navigationContainerRef = useNavigationContainerRef()
	useScreenViews()
	React.useEffect(
		() => navigationContainerRef.addListener('state', navigationGuard.stateChanged),
		[navigationContainerRef],
	)
	React.useEffect(() => watchQueryFailures(queryClient.getQueryCache(), track), [])
	React.useEffect(() => startQuickActionSync(), [])

	React.useEffect(() => {
		if (!IS_PRODUCTION) {
			return
		}

		sentryInit.navigationIntegration.registerNavigationContainer(navigationContainerRef)
		Sentry.appLoaded()
		// oxlint-disable-next-line react/exhaustive-deps
	}, [])

	return (
		<ReduxProvider store={store}>
			<PersistGate loading={<LoadingView text="Loading App..." />} persistor={persistor}>
				<PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
					<ThemeProvider value={theme}>
						<StatusBar barStyle={statusBarStyle} />
						<ChaosGuard>
							{/* Before the stack, so its hidden player sits beneath every screen. */}
							<RadioHost />
							<RadioNowPlayingSheet />
							<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
								<Stack.Screen name="menus" options={{title: 'Menus'}} />
								<Stack.Screen name="menu-item-detail" options={DETAIL_SHEET} />
								<Stack.Screen name="streaming-media" options={{title: 'Streaming Media'}} />
								{/* No large title: the front page draws the paper's name in the bar, in its serif,
								    and a large title would show the plain name until the page scrolled. */}
								<Stack.Screen name="messenger/index" options={{title: 'The Olaf Messenger'}} />
								{/* A series thumbnail opens another story over the one being read.
								    Keyed by the story and the row that opened it, a tap always opens
								    a fresh screen: an unkeyed route would swap the params of the
								    story on top, and one keyed by story alone would move a story
								    already open further down to the top, and either way Back would
								    not retrace the reader's steps. A second tap on the same thumbnail
								    finds the screen the first one opened, so it adds no duplicate. */}
								<Stack.Screen
									dangerouslySingular={(_name, params) => `${params.id ?? ''}:${params.from ?? ''}`}
									name="messenger/story"
									options={{title: ''}}
								/>
								{/* Over the story, not in place of it, so a drag that closes the viewer
								    shows the story through its fading black. */}
								<Stack.Screen
									name="messenger/image"
									options={{presentation: 'transparentModal', headerShown: false}}
								/>
								<Stack.Screen
									name="st-olaf-news"
									options={{title: 'St. Olaf News', headerLargeTitleEnabled: true}}
								/>
								<Stack.Screen name="transit" options={{title: 'Transit'}} />
								<Stack.Screen name="transit/line" options={DETAIL_SHEET} />
								<Stack.Screen name="hours" />
								<Stack.Screen name="hours/all-spaces" />
								<Stack.Screen name="hours/detail" options={DETAIL_SHEET} />
								<Stack.Screen name="dictionary/entry" options={DETAIL_SHEET} />
								{/* A department opens a fresh copy of the Directory over the landing.
								    Keyed by the search it shows, navigating to a different one pushes
								    it, where an unkeyed route would only swap the params of the
								    Directory already on top; navigating to the same one still
								    refuses a duplicate. */}
								<Stack.Screen
									dangerouslySingular={(_name, params) =>
										`${params.queryType ?? ''}:${params.queryParam ?? ''}`
									}
									name="directory/index"
								/>
								{/* Keyed by the contact, so a tap on another contact's tile opens a sheet of
								    its own. Unkeyed, the tap reuses a sheet still on its way out, and the
								    new contact leaves with it. */}
								<Stack.Screen
									dangerouslySingular={(_name, params) => String(params.title ?? '')}
									name="directory/named"
									options={DETAIL_SHEET}
								/>
								<Stack.Screen name="map" />
								<Stack.Screen name="balances/index" options={{title: 'Balances'}} />
								<Stack.Screen name="calendar/event" options={DETAIL_SHEET} />
								<Stack.Screen
									name="calendar"
									options={{title: 'Calendar', headerLargeTitleEnabled: true}}
								/>
								<Stack.Screen name="customize" options={CUSTOMIZE_SHEET} />
								<Stack.Screen
									name="settings"
									options={{headerShown: false, presentation: 'modal'}}
								/>
							</Stack>
						</ChaosGuard>
					</ThemeProvider>
				</PersistQueryClientProvider>
			</PersistGate>
		</ReduxProvider>
	)
}

export default Sentry.wrap(RootLayout)
