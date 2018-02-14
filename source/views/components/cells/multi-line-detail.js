// @flow

import React from 'react'
import {Cell} from 'react-native-tableview-simple'
import {StyleSheet, Text, View} from 'react-native'
import * as c from '../../components/colors'

type Props = {
	title: string,
	leftDetail: string,
	rightDetail: string,
}

export class MultiLineDetailCell extends React.PureComponent<Props> {
	render() {
		const {title, rightDetail, leftDetail} = this.props
		const cellContent = (
			<View style={styles.cellContentView}>
				<View style={styles.leftContainer}>
					<Text allowFontScaling={true} style={styles.cellTitle}>
						{title}
					</Text>
					<Text allowFontScaling={true} style={styles.cellLeftDetail}>
						{leftDetail}
					</Text>
				</View>
				<Text allowFontScaling={true} style={styles.cellRightDetail}>
					{rightDetail}
				</Text>
			</View>
		)
		return <Cell cellContentView={cellContent} />
	}
}

const styles = StyleSheet.create({
	cellContentView: {
		alignItems: 'center',
		flexDirection: 'row',
		flex: 1,
		justifyContent: 'center',
		// independent from other cellViews
		paddingVertical: 10,
	},
	cellTitle: {
		fontSize: 16,
		letterSpacing: -0.32,
		color: c.black,
	},
	cellLeftDetail: {
		fontSize: 16,
		letterSpacing: -0.32,
		color: c.iosDisabledText,
	},
	cellRightDetail: {
		fontSize: 16,
		letterSpacing: -0.32,
		alignSelf: 'center',
		color: c.iosDisabledText,
	},
	leftContainer: {
		flex: 1,
	},
})
