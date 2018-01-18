// @flow
import * as React from 'react'
import {View} from 'react-native'
import {Cell, Section} from 'react-native-tableview-simple'
import {version} from '../../../../package.json'
import type {TopLevelViewPropsType} from '../../types'
import {setFeedbackStatus, setTouchIDStatus} from '../../../flux/parts/settings'
import {connect} from 'react-redux'
import {CellToggle} from '../../components/cells/toggle'
import {PushButtonCell} from '../../components/cells/push-button'
import {trackedOpenUrl} from '../../components/open-url'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import TouchID from 'react-native-touch-id'

type Props = TopLevelViewPropsType & {
	onChangeFeedbackToggle: (feedbackDisabled: boolean) => any,
	feedbackDisabled: boolean,
	touchIDEnabled: boolean,
	onChangeTouchIDToggle: boolean => any,
}

type State = {
	supported: boolean,
	touchIDSupported: boolean,
}

class OddsAndEndsSection extends React.PureComponent<Props, State> {
	state = {
		supported: false,
		touchIDSupported: false,
	}

	componentWillMount() {
		this.checkIfCustomIconsSupported()
		this.checkIfTouchIDSupported()
	}

	checkIfCustomIconsSupported = async () => {
		const supported = await Icons.isSupported()
		this.setState(() => ({supported}))
	}

	checkIfTouchIDSupported = () => {
		TouchID.isSupported()
			.then(() => {
				this.setState(() => ({touchIDSupported: true}))
			})
			.catch(() => {
				this.setState(() => ({touchIDSupported: false}))
			})
	}

	onPressButton = (id: string) => {
		this.props.navigation.navigate(id)
	}

	onCreditsButton = () => this.onPressButton('CreditsView')
	onPrivacyButton = () => this.onPressButton('PrivacyView')
	onLegalButton = () => this.onPressButton('LegalView')
	onSourceButton = () =>
		trackedOpenUrl({
			url: 'https://github.com/StoDevX/AAO-React-Native',
			id: 'ContributingView',
		})
	onAppIconButton = () => this.onPressButton('IconSettingsView')

	render() {
		return (
			<View>
				<Section header="MISCELLANY">
					{this.state.supported ? (
						<PushButtonCell
							onPress={this.onAppIconButton}
							title="Change App Icon"
						/>
					) : null}
					{this.state.touchIDSupported ? (
						<CellToggle
							label="Use TouchID/FaceID Protection"
							onChange={val => this.props.onChangeTouchIDToggle(val)}
							value={this.props.touchIDEnabled}
						/>
					) : null}
					<PushButtonCell onPress={this.onCreditsButton} title="Credits" />
					<PushButtonCell
						onPress={this.onPrivacyButton}
						title="Privacy Policy"
					/>
					<PushButtonCell onPress={this.onLegalButton} title="Legal" />
					<PushButtonCell onPress={this.onSourceButton} title="Contributing" />
				</Section>

				<Section header="ODDS &amp; ENDS">
					<Cell cellStyle="RightDetail" detail={version} title="Version" />

					<CellToggle
						label="Share Analytics"
						// These are both inverted because the toggle makes more sense as
						// optout/optin, but the code works better as optin/optout.
						onChange={val => this.props.onChangeFeedbackToggle(!val)}
						value={!this.props.feedbackDisabled}
					/>
				</Section>
			</View>
		)
	}
}

function mapStateToProps(state) {
	return {
		feedbackDisabled: state.settings.feedbackDisabled,
		touchIDEnabled: state.settings.touchIDEnabled,
	}
}

function mapDispatchToProps(dispatch) {
	return {
		onChangeFeedbackToggle: s => dispatch(setFeedbackStatus(s)),
		onChangeTouchIDToggle: status => dispatch(setTouchIDStatus(status)),
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(OddsAndEndsSection)
