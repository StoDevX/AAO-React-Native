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

import * as React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {Provider as PaperProvider} from 'react-native-paper'
import {makeStore, initRedux} from './redux'
import * as navigation from './navigation'
import {ThemeProvider, CombinedDefaultTheme} from '@frogpond/app-theme'
import {ActionSheetProvider} from '@expo/react-native-action-sheet'
import {NavigationContainer} from '@react-navigation/native'

import {RootStack} from './navigation'

const store = makeStore()
initRedux(store)

export default class App extends React.Component {
	render(): JSX.Element {
		return (
			<ReduxProvider store={store}>
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
			</ReduxProvider>
		)
	}
}
