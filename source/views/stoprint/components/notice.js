// @flow

import React from 'react'
import {Platform, View, StyleSheet} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {NoticeView} from '../../components/notice'
import * as c from '../../components/colors'

type Props = {
	buttonText: string,
	header: string,
	onPress: () => any,
	refresh?: () => any,
	text: string,
}

export class StoprintNoticeView extends React.PureComponent<Props> {
	_timer: any

	componentDidMount() {
		if (this.props.refresh) {
			this._timer = setInterval(this.props.refresh, 5000)
		}
	}

	componentWillUnmount() {
		if (this.props.refresh) {
			clearInterval(this._timer)
		}
	}

	render() {
		const {buttonText, header, onPress, text} = this.props
		return (
			<View style={styles.container}>
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
