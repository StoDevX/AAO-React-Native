// @flow

import * as React from 'react'
import {AppState} from 'react-native'
import {connect} from 'react-redux'
import {refreshPushStatus} from '../../../../redux/parts/notifications'

type Props = {
	refreshPushStatus: () => any,
}

type State = {
	appState: ?string,
}

class _CheckForPushSettingsOnResume extends React.Component<Props, State> {
	state = {
		appState: AppState.currentState,
	}

	componentDidMount() {
		AppState.addEventListener('change', this.handleAppStateChange)
	}

	componentWillUnmount() {
		AppState.removeEventListener('change', this.handleAppStateChange)
	}

	handleAppStateChange = (nextAppState: string) => {
		let {appState: currentAppState} = this.state

		let shouldRehydrate =
			currentAppState !== 'active' && nextAppState === 'active'

		if (shouldRehydrate) {
			this.props.refreshPushStatus()
		}

		this.setState(() => ({appState: nextAppState}))
	}

	render() {
		return null
	}
}

export const CheckForPushSettingsOnResume = connect(
	null,
	(dispatch): Props => ({
		refreshPushStatus: () => dispatch(refreshPushStatus()),
	}),
)(_CheckForPushSettingsOnResume)
