// @flow
import * as React from 'react'
import {Section, PushButtonCell} from '@frogpond/tableview'
import type {TopLevelViewPropsType} from '../../types'
import {trackedOpenUrl} from '@frogpond/open-url'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {sectionBgColor} from '@frogpond/colors'
import {GH_BASE_URL} from '@app/lib/constants'

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
