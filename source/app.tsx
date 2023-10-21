// TODO Check on https://github.com/kmagiera/react-native-gesture-handler/issues/320,
// and remove this if/when it is no longer necessary
import * as React from 'react'
import {StatusBar, useColorScheme} from 'react-native'
import {Provider as ReduxProvider} from 'react-redux'

import {Provider as PaperProvider} from 'react-native-paper'

import {NavigationContainer} from '@react-navigation/native'

import {CombinedDarkTheme, CombinedLightTheme} from '@frogpond/app-theme'
import {LoadingView} from '@frogpond/notice'

import 'react-native-gesture-handler'
// initialization
import './init/constants'
import './init/moment'
import './init/api'
import './init/theme'
import * as sentryInit from './init/sentry'
import {persister, queryClient} from './init/tanstack-query'
import {RootStack} from './navigation'
import {persistor, store} from './redux'
import {ActionSheetProvider} from '@expo/react-native-action-sheet'
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client'
import {PersistGate} from 'redux-persist/integration/react'

export default function App(): JSX.Element {
	// Create a ref for the navigation container
	const navigationRef = React.useRef()
	const scheme = useColorScheme()
	const theme = scheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme
	const statusBarStyle = scheme === 'dark' ? 'light-content' : 'dark-content'

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
							<NavigationContainer
								onReady={() => {
									// Register the navigation container with the instrumentation
									sentryInit.routingInstrumentation.registerNavigationContainer(
										navigationRef,
									)
								}}
								theme={theme}
							>
								<StatusBar barStyle={statusBarStyle} />
								<RootStack />
							</NavigationContainer>
						</ActionSheetProvider>
					</PaperProvider>
				</PersistQueryClientProvider>
			</PersistGate>
		</ReduxProvider>
	)
}
