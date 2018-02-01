// @flow

import React from 'react'
import {Cell} from 'react-native-tableview-simple'
import {StyleSheet, Text, View} from 'react-native'
import * as c from '../../components/colors'

type Props = {
	title: string,
	detail: string,
}

export class MultiLineDetailCell extends React.PureComponent<Props> {
	render() {
		const {title, detail} = this.props
		return (
			<Cell
				cellContentView={
					<View style={styles.cellContentView}>
						<Text
							allowFontScaling={true}
							numberOfLines={1}
							style={styles.cellTitle}
						>
							{title}
						</Text>
						<Text
							allowFontScaling={true}
							numberOfLines={3}
							style={styles.cellRightDetail}
						>
							{detail}
						</Text>
					</View>
				}
			/>
		)
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
		flex: 1,
	},
	cellRightDetail: {
		fontSize: 16,
		letterSpacing: -0.32,
		alignSelf: 'center',
		color: c.lightGray,
	},
})
