// @flow

import React from 'react'
import type {TopLevelViewPropsType} from '../../types'
import {ScrollView, RefreshControl, StyleSheet, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {NoticeView} from '../../../components/notice'
import * as c from '../../../components/colors'
import delay from 'delay'

const ERROR_MESSAGE =
	"Make sure you are connected to the St. Olaf Network via eduroam or the VPN. If you are, please report this so we can make sure it doesn't happen again."

type Props = TopLevelViewPropsType & {
	refresh: () => any,
	statusMessage: string,
}

type State = {
	refreshing: boolean,
}

export class StoPrintErrorView extends React.PureComponent<Props, State> {
	_timer: ?IntervalID

	state = {
		refreshing: false,
	}

	componentDidMount() {
		this._timer = setInterval(this.props.refresh, 5000)
	}

	componentWillUnmount() {
		if (this._timer) {
			clearInterval(this._timer)
		}
	}

	_refresh = async () => {
		this.setState(() => ({refreshing: true}))
		let start = Date.now()

		await this.props.refresh()

		let elapsed = start - Date.now()
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
		this.setState(() => ({refreshing: false}))
	}

	render() {
		const iconName = Platform.select({
			ios: 'ios-bug',
			android: 'md-bug',
		})
		return (
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						onRefresh={this._refresh}
						refreshing={this.state.refreshing}
					/>
				}
				showsVerticalScrollIndicator={false}
				style={styles.container}
			>
				<Icon color={c.sto.black} name={iconName} size={100} />
				<NoticeView
					buttonText="Report"
					header="Connection Issue"
					onPress={() => this.props.navigation.navigate('HelpView')}
					style={styles.notice}
					text={`${this.props.statusMessage} ${ERROR_MESSAGE}`}
				/>
			</ScrollView>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.sto.white,
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	notice: {
		flex: 0,
	},
})
