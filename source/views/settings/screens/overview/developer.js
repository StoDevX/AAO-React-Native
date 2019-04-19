// @flow
import * as React from 'react'
import {Section, PushButtonCell} from '@frogpond/tableview'
import {type NavigationScreenProp} from 'react-navigation'

type Props = {navigation: NavigationScreenProp<*>}

export class DeveloperSection extends React.Component<Props> {
	onAPIButton = () => this.props.navigation.navigate('APITestView')
	onBonAppButton = () => this.props.navigation.navigate('BonAppPickerView')
	onDebugButton = () => this.props.navigation.navigate('DebugView')

	render() {
		return (
			<Section header="DEVELOPER">
				<PushButtonCell onPress={this.onAPIButton} title="API Tester" />
				<PushButtonCell
					onPress={this.onBonAppButton}
					title="Bon Appetit Picker"
				/>
				<PushButtonCell onPress={this.onDebugButton} title="Debug" />
			</Section>
		)
	}
}
