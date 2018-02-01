// @flow

import * as React from 'react'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import glamorous from 'glamorous-native'

import {lookup as getAppIcon} from '../../../images/icon-images'

const LogoImage = glamorous.image({
	width: 100,
	height: 100,
	alignSelf: 'center',
})

type Props = {
	style?: StyleSheet,
}

type State = {
	icon: number,
}

export class AppLogo extends React.Component<Props, State> {
	state = {
		icon: getAppIcon('default'),
	}

	async componentWillMount() {
		const name = await Icons.getIconName()
		this.setState(() => ({icon: getAppIcon(name)}))
	}

	render() {
		return <LogoImage source={this.state.icon} style={this.props.style} />
	}
}
