// TODO Check on https://github.com/kmagiera/react-native-gesture-handler/issues/320,
// and remove this if/when it is no longer necessary
import 'react-native-gesture-handler'

// initialization
import '../init/sentry'
import '../init/constants'
import '../init/moment'
import '../init/api'
import '../init/theme'
import {queryClient, persister} from '../init/tanstack-query'

import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import {useColorScheme} from 'react-native'
import {StatusBar} from 'expo-status-bar'
import {PersistGate} from 'redux-persist/integration/react'
import {Provider as ReduxProvider} from 'react-redux'
import {Provider as PaperProvider} from 'react-native-paper'
import {ThemeProvider} from '@react-navigation/native'
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client'
import {CombinedLightTheme, CombinedDarkTheme} from '@frogpond/app-theme'
import {ActionSheetProvider} from '@expo/react-native-action-sheet'
import {Stack} from 'expo-router'
import {LoadingView} from '@frogpond/notice'

import {store, persistor} from '../redux'

function RootLayout() {
	return <Stack />
}

function App() {
	const scheme = useColorScheme()
	const theme = scheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme

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
								<RootLayout />
								<StatusBar />
							</ThemeProvider>
						</ActionSheetProvider>
					</PaperProvider>
				</PersistQueryClientProvider>
			</PersistGate>
		</ReduxProvider>
	)
}

export default Sentry.wrap(App)

// eslint-disable-next-line camelcase -- required by expo-router API
export const unstable_settings = {
	// https://docs.expo.dev/router/advanced/router-settings/#initialroutename
	// Ensure any route can link back to `/`
	initialRouteName: 'index',
}
