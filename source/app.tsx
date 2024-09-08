import 'react-native-gesture-handler'

import './init/constants'
import './init/moment'
import * as sentryInit from './init/sentry'
import './init/api'
import './init/theme'
import {queryClient, persister} from './init/tanstack-query'

import * as React from 'react'
import {PersistGate} from 'redux-persist/integration/react'
import {Provider as ReduxProvider} from 'react-redux'
import {Provider as PaperProvider} from 'react-native-paper'
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client'
import {store, persistor} from './redux'
import {CombinedLightTheme, CombinedDarkTheme} from '@frogpond/app-theme'
import {ActionSheetProvider} from '@expo/react-native-action-sheet'
import {NavigationContainer} from '@react-navigation/native'

import {RootStack} from './navigation'
import {LoadingView} from '@frogpond/notice'
import {IS_PRODUCTION} from '@frogpond/constants'
import {StatusBar, useColorScheme} from 'react-native'

export default function App(): JSX.Element {
	const navigationRef = React.useRef()
	const scheme = useColorScheme()
	const theme = scheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme
	const statusBarStyle = scheme === 'dark' ? 'light-content' : 'dark-content'

	const registerContainer = () => {
		if (!IS_PRODUCTION) {
			return
		}

		sentryInit.routingInstrumentation.registerNavigationContainer(navigationRef)
	}

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
							<NavigationContainer onReady={registerContainer} theme={theme}>
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
