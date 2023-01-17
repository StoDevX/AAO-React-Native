// TODO Check on https://github.com/kmagiera/react-native-gesture-handler/issues/320,
// and remove this if/when it is no longer necessary
import 'react-native-gesture-handler'

// initialization
import './init/constants'
import './init/moment'
import './init/sentry'
import './init/api'
import './init/theme'
import './init/data'
import {queryClient, persister} from './init/tanstack-query'

import * as React from 'react'
import {PersistGate} from 'redux-persist/integration/react'
import {Provider as ReduxProvider} from 'react-redux'
import {Provider as PaperProvider} from 'react-native-paper'
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client'
import {store, persistor} from './redux'
import * as navigation from './navigation'
import {ThemeProvider, CombinedDefaultTheme} from '@frogpond/app-theme'
import {ActionSheetProvider} from '@expo/react-native-action-sheet'
import {NavigationContainer} from '@react-navigation/native'

import {RootStack} from './navigation'
import {LoadingView} from '@frogpond/notice'

export default class App extends React.Component {
	render(): JSX.Element {
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
						<PaperProvider theme={CombinedDefaultTheme}>
							<ThemeProvider>
								<ActionSheetProvider>
									<NavigationContainer
										onStateChange={navigation.trackScreenChanges}
										persistenceKey={navigation.persistenceKey}
									>
										<RootStack />
									</NavigationContainer>
								</ActionSheetProvider>
							</ThemeProvider>
						</PaperProvider>
					</PersistQueryClientProvider>
				</PersistGate>
			</ReduxProvider>
		)
	}
}
