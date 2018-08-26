// @flow

import React from 'react'
import {
	Platform,
	Text,
	ScrollView,
	StyleSheet,
	RefreshControl,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {NoticeView} from '../../../components/notice'
import * as c from '../../../components/colors'
import delay from 'delay'

type Props = {
	buttonText: string,
	description?: string,
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
		const {buttonText, description, header, onPress, text} = this.props
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
				{description ? (
					<Text style={styles.description}>{description}</Text>
				) : null}
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
	description: {
		marginHorizontal: 30,
		marginVertical: 20,
		textAlign: 'center',
	},
	notice: {
		flex: 0,
	},
})
