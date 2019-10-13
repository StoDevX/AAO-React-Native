// @flow

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
							<navigation.AppNavigator
								onNavigationStateChange={navigation.trackScreenChanges}
								persistenceKey={navigation.persistenceKey}
							/>
						</ActionSheetProvider>
					</ThemeProvider>
				</PaperProvider>
			</ReduxProvider>
		)
	}
}
