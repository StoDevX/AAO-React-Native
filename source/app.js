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
import {ThemeProvider} from '@callstack/react-theme-provider'
import {getTheme} from '@frogpond/app-theme'

const store = makeStore()
initRedux(store)

type Props = {}

export default class App extends React.Component<Props> {
	render() {
		let theme = getTheme()

		return (
			<ReduxProvider store={store}>
				<PaperProvider>
					<ThemeProvider theme={theme}>
						<navigation.AppNavigator
							onNavigationStateChange={navigation.trackScreenChanges}
							persistenceKey={navigation.persistenceKey}
						/>
					</ThemeProvider>
				</PaperProvider>
			</ReduxProvider>
		)
	}
}
