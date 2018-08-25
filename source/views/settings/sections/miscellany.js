// @flow
import * as React from 'react'
import {Section} from 'react-native-tableview-simple'
import type {TopLevelViewPropsType} from '../../types'
import {PushButtonCell} from '../../../components/cells/push-button'
import {trackedOpenUrl} from '../../../components/open-url'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {sectionBgColor} from '../../../components/colors'
import {GH_BASE_URL} from '../../../globals'

type Props = TopLevelViewPropsType

type State = {
	supported: boolean,
}

export default class MiscellanySection extends React.PureComponent<
	Props,
	State,
> {
	state = {
		supported: false,
	}

	componentDidMount() {
		this.checkIfCustomIconsSupported()
	}

	checkIfCustomIconsSupported = async () => {
		const supported = await Icons.isSupported()
		this.setState(() => ({supported}))
	}

	onPressButton = (id: string) => {
		this.props.navigation.navigate(id)
	}

	onCreditsButton = () => this.onPressButton('CreditsView')
	onPrivacyButton = () => this.onPressButton('PrivacyView')
	onLegalButton = () => this.onPressButton('LegalView')
	onSourceButton = () =>
		trackedOpenUrl({
			url: GH_BASE_URL,
			id: 'ContributingView',
		})
	onAppIconButton = () => this.onPressButton('IconSettingsView')

	render() {
		return (
			<React.Fragment>
				<Section header="MISCELLANY" sectionTintColor={sectionBgColor}>
					{this.state.supported ? (
						<PushButtonCell
							onPress={this.onAppIconButton}
							title="Change App Icon"
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
			</React.Fragment>
		)
	}
}
