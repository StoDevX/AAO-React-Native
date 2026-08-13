// initialization
import '../source/init/constants'
import '../source/init/moment'
import * as sentryInit from '../source/init/sentry'
import '../source/init/api'
import '../source/init/theme'
import {queryClient, persister} from '../source/init/tanstack-query'

import * as React from 'react'
import {PersistGate} from 'redux-persist/integration/react'
import {Provider as ReduxProvider} from 'react-redux'
import {Provider as PaperProvider} from 'react-native-paper'
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client'
import {store, persistor} from '../source/redux'
import {CombinedLightTheme, CombinedDarkTheme} from '@frogpond/app-theme'
import {ActionSheetProvider} from '@expo/react-native-action-sheet'
import {ThemeProvider} from 'expo-router/react-navigation'
import {Stack, useNavigationContainerRef} from 'expo-router'
import * as Sentry from '@sentry/react-native'

import {LoadingView} from '@frogpond/notice'
import {IS_PRODUCTION} from '@frogpond/constants'
import {StatusBar, useColorScheme} from 'react-native'

// Without an anchor, a cold-start deep link into (settings) or
// (component-library) -- both modal groups, siblings of (home) -- mounts
// the root stack with nothing beneath the sheet: no Home to dismiss back
// to. (home) is the app's real entry point regardless of which route a
// deep link targets.
// eslint-disable-next-line camelcase -- expo-router's own required export name
export const unstable_settings = {
	anchor: '(home)',
}

function RootLayout(): React.ReactNode {
	const scheme = useColorScheme()
	const theme = scheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme
	const statusBarStyle = scheme === 'dark' ? 'light-content' : 'dark-content'
	const navigationContainerRef = useNavigationContainerRef()

	React.useEffect(() => {
		if (!IS_PRODUCTION) {
			return
		}

		sentryInit.navigationIntegration.registerNavigationContainer(
			navigationContainerRef,
		)
		Sentry.appLoaded()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<ReduxProvider store={store}>
			<PersistGate
				loading={<LoadingView text="Loading App..." />}
				persistor={persistor}
			>
				<PersistQueryClientProvider
					client={queryClient}
					persistOptions={{persister}}
				>
					<PaperProvider theme={theme}>
						<ActionSheetProvider>
							<ThemeProvider value={theme}>
								<StatusBar barStyle={statusBarStyle} />
								<Stack>
									<Stack.Screen name="(home)" options={{headerShown: false}} />
									<Stack.Screen
										name="(settings)"
										options={{headerShown: false, presentation: 'modal'}}
									/>
									<Stack.Screen
										name="(component-library)"
										options={{headerShown: false, presentation: 'modal'}}
									/>
								</Stack>
							</ThemeProvider>
						</ActionSheetProvider>
					</PaperProvider>
				</PersistQueryClientProvider>
			</PersistGate>
		</ReduxProvider>
	)
}

export default Sentry.wrap(RootLayout)
