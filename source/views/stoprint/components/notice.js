// @flow

import React from 'react'
import {Platform, ScrollView, StyleSheet, RefreshControl} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {NoticeView} from '../../components/notice'
import * as c from '../../components/colors'

type Props = {
	buttonText: string,
	header: string,
	onPress: () => any,
	refresh: () => any,
	text: string,
}

type State = {
	refreshing: boolean,
}

export class StoPrintNoticeView extends React.PureComponent<Props, State> {
	_timer: ?IntervalID

	state = {
		refreshing: false,
	}

	componentDidMount() {
		if (this._timer) {
			this._timer = setInterval(this.props.refresh, 5000)
		}
	}

	componentWillUnmount() {
		if (this._timer) {
			clearInterval(this._timer)
		}
	}

	_refresh = () => {
		this.setState(() => ({refreshing: true}))
		this.props.refresh()
		this.setState(() => ({refreshing: false}))
	}

	render() {
		const {buttonText, header, onPress, text} = this.props
		return (
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						onRefresh={this._refresh}
						refreshing={this.state.refreshing}
					/>
				}
				style={styles.container}
			>
				<Icon
					color={c.sto.black}
					name={Platform.OS === 'ios' ? 'ios-print' : 'md-print'}
					size={100}
				/>
				<NoticeView
					buttonText={buttonText}
					header={header}
					onPress={onPress}
					style={styles.notice}
					text={text}
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
