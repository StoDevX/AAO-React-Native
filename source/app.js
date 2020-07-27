// @flow

// TODO Check on https://github.com/kmagiera/react-native-gesture-handler/issues/320,
// and remove this if/when it is no longer necessary
import 'react-native-gesture-handler'

// Before rendering any navigation stack
import {enableScreens} from 'react-native-screens'
enableScreens()

// initialization
import './init/constants'
import './init/moment'
import './init/sentry'
import './init/api'
import './init/theme'
import './init/data'
// import './init/navigation'

import * as React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {Provider as PaperProvider} from 'react-native-paper'
import {makeStore, initRedux} from './redux'
import * as navigation from './navigation'
import {ThemeProvider} from '@frogpond/app-theme'
import {ActionSheetProvider} from '@expo/react-native-action-sheet'
import {NavigationContainer} from '@react-navigation/native'

const store = makeStore()
initRedux(store)

type Props = {}

export default class App extends React.Component<Props> {
	render() {
		return (
			<ReduxProvider store={store}>
				<PaperProvider>
					<ThemeProvider>
						<ActionSheetProvider>
							<NavigationContainer>
								<navigation.AppNavigator
									onNavigationStateChange={navigation.trackScreenChanges}
									persistenceKey={navigation.persistenceKey}
								/>
							</NavigationContainer>
						</ActionSheetProvider>
					</ThemeProvider>
				</PaperProvider>
			</ReduxProvider>
		)
	}
}
