// @flow
import * as React from 'react'
import {Cell, Section} from '@frogpond/tableview'
import {appVersion, appBuild} from '@frogpond/constants'
import {type NavigationScreenProp} from 'react-navigation'

type Props = {
	navigation: NavigationScreenProp<*>,
}

export class OddsAndEndsSection extends React.Component<Props> {
	onNotificationsButton = () => {
		this.props.navigation.navigate('PushNotificationsSettingsView')
	}

	render() {
		let version = appVersion()
		let build = appBuild()

		return (
			<Section header="ODDS &amp; ENDS">
				<Cell cellStyle="RightDetail" detail={version} title="Version" />
				{build && (
					<Cell cellStyle="RightDetail" detail={build} title="Build Number" />
				)}
			</Section>
		)
	}
}
