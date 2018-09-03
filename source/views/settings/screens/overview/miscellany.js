// @flow
import * as React from 'react'
import {Section, PushButtonCell} from '@frogpond/tableview'
import {type NavigationScreenProp} from 'react-navigation'
import {trackedOpenUrl} from '@frogpond/open-url'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {sectionBgColor} from '@frogpond/colors'
import {GH_BASE_URL} from '../../../../lib/constants'

type Props = {navigation: NavigationScreenProp<*>}

type State = {
	canChangeIcon: boolean,
}

export class MiscellanySection extends React.Component<Props, State> {
	state = {
		canChangeIcon: false,
	}

	componentDidMount() {
		this.checkIfCustomIconsSupported()
	}

	checkIfCustomIconsSupported = async () => {
		const canChangeIcon = await Icons.isSupported()
		this.setState(() => ({canChangeIcon}))
	}

	onPressButton = (id: string) => {
		this.props.navigation.navigate(id)
	}

	onCreditsButton = () => this.onPressButton('CreditsView')
	onPrivacyButton = () => this.onPressButton('PrivacyView')
	onLegalButton = () => this.onPressButton('LegalView')
	onSourceButton = () =>
		trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})
	onAppIconButton = () => this.onPressButton('IconSettingsView')

	render() {
		return (
			<Section header="MISCELLANY" sectionTintColor={sectionBgColor}>
				{this.state.canChangeIcon ? (
					<PushButtonCell
						onPress={this.onAppIconButton}
						title="Change App Icon"
					/>
				) : null}

				<PushButtonCell onPress={this.onCreditsButton} title="Credits" />
				<PushButtonCell onPress={this.onPrivacyButton} title="Privacy Policy" />
				<PushButtonCell onPress={this.onLegalButton} title="Legal" />
				<PushButtonCell onPress={this.onSourceButton} title="Contributing" />
			</Section>
		)
	}
}
