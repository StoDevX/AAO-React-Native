// TODO Check on https://github.com/kmagiera/react-native-gesture-handler/issues/320,
// and remove this if/when it is no longer necessary
import 'react-native-gesture-handler'

// initialization
import './init/constants'
import './init/moment'
import * as sentryInit from './init/sentry'
import './init/api'
import './init/theme'
import {queryClient, persister} from './init/tanstack-query'

import * as React from 'react'
import {Provider as PaperProvider} from 'react-native-paper'
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client'
import {CombinedLightTheme, CombinedDarkTheme} from './modules/app-theme'
import {ActionSheetProvider} from '@expo/react-native-action-sheet'
import {NavigationContainer} from 'expo-router'

import {RootStack} from './navigation'
import {IS_PRODUCTION} from './modules/constants'
import {StatusBar, useColorScheme} from 'react-native'

export default function App(): React.JSX.Element {
	// Create a ref for the navigation container
	const navigationRef = React.useRef()
	const scheme = useColorScheme()
	const theme = scheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme
	const statusBarStyle = scheme === 'dark' ? 'light-content' : 'dark-content'

	const registerContainer = () => {
		if (!IS_PRODUCTION) {
			return
		}

		// Register the navigation container with the instrumentation
		sentryInit.routingInstrumentation.registerNavigationContainer(navigationRef)
	}

	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{persister}}
		>
			<PaperProvider theme={theme}>
				<ActionSheetProvider>
					<NavigationContainer onReady={registerContainer} theme={theme}>
						<StatusBar barStyle={statusBarStyle} />
						<RootStack />
					</NavigationContainer>
				</ActionSheetProvider>
			</PaperProvider>
		</PersistQueryClientProvider>
	)
}
