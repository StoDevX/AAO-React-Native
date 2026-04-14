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
import {ScrollView, StatusBar, Text, useColorScheme} from 'react-native'

type DiagnosticErrorBoundaryState = {
	error: Error | null
}

class DiagnosticErrorBoundary extends React.Component<
	React.PropsWithChildren<object>,
	DiagnosticErrorBoundaryState
> {
	static getDerivedStateFromError(error: Error): DiagnosticErrorBoundaryState {
		return {error}
	}

	state: DiagnosticErrorBoundaryState = {error: null}

	render(): React.ReactNode {
		if (this.state.error) {
			const {message, stack} = this.state.error
			return (
				<ScrollView
					accessibilityLabel="diagnostic-error"
					style={{flex: 1, backgroundColor: 'white', padding: 24}}
					testID="diagnostic-error"
				>
					<Text
						accessibilityLabel="diagnostic-error-title"
						style={{fontSize: 18, fontWeight: 'bold', marginBottom: 12}}
					>
						App crashed during render
					</Text>
					<Text
						accessibilityLabel="diagnostic-error-message"
						selectable={true}
						style={{fontSize: 14, marginBottom: 12}}
					>
						{message}
					</Text>
					<Text
						accessibilityLabel="diagnostic-error-stack"
						selectable={true}
						style={{fontSize: 11, fontFamily: 'Menlo'}}
					>
						{stack ?? '(no stack)'}
					</Text>
				</ScrollView>
			)
		}
		return this.props.children
	}
}

export default function App(): JSX.Element {
	// Create a ref for the navigation container
	const navigationRef = React.useRef()
	const scheme = useColorScheme()
	const theme = scheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme
	const statusBarStyle = scheme === 'dark' ? 'light-content' : 'dark-content'

	const registerContainer = () => {
		if (!IS_PRODUCTION) {
			return
		}

		// Register the navigation container with the integration
		sentryInit.navigationIntegration.registerNavigationContainer(navigationRef)
	}

	return (
		<DiagnosticErrorBoundary>
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
		</DiagnosticErrorBoundary>
	)
}
