// @flow

import React from 'react'
import type {TopLevelViewPropsType} from '../../types'
import {View, StyleSheet, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {NoticeView} from '../../components/notice'
import * as c from '../../components/colors'

const ERROR_MESSAGE =
	"Make sure you are connected to the St. Olaf WiFi \
 Network via eduroam or VPN. If you are, please report this so we can make\
 sure it doesn't happen again."

type Props = TopLevelViewPropsType & {
	refresh: () => any,
}

export class StoPrintErrorView extends React.PureComponent<Props> {
	_timer: any

	componentDidMount() {
		this._timer = setInterval(this.props.refresh, 5000)
	}

	componentWillUnmount() {
		clearInterval(this._timer)
	}

	render() {
		const iconName = Platform.select({
			ios: 'ios-bug',
			android: 'md-bug',
		})
		return (
			<View style={styles.container}>
				<Icon color={c.sto.black} name={iconName} size={100} />
				<NoticeView
					buttonText="Report"
					header="Connection Issue"
					onPress={() => this.props.navigation.navigate('HelpView')}
					style={styles.notice}
					text={ERROR_MESSAGE}
				/>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: c.sto.white,
	},
	notice: {
		flex: 0,
	},
})
