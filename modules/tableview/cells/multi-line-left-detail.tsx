import React from 'react'
import {Cell} from 'react-native-tableview-simple'
import {StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'

type LeftDetailProps = {
	detail: string
	title: string
	onPress?: (() => any) | undefined
	accessory?:
		| false
		| 'DisclosureIndicator'
		| 'Detail'
		| 'DetailDisclosure'
		| 'Checkmark'
		| undefined
}

export class MultiLineLeftDetailCell extends React.PureComponent<LeftDetailProps> {
	render(): JSX.Element {
		const {detail, title, onPress, accessory} = this.props
		const cellContent = (
			<View style={styles.cellContentView}>
				<Text allowFontScaling={true} style={styles.cellLeftDetail}>
					{detail}
				</Text>
				<Text allowFontScaling={true} style={styles.cellLeftDetailTitle}>
					{title}
				</Text>
			</View>
		)
		return (
			<Cell
				accessory={accessory}
				cellContentView={cellContent}
				onPress={onPress}
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
	cellLeftDetailTitle: {
		fontSize: 12,
		flex: 1,
		color: c.black,
	},
	cellLeftDetail: {
		fontSize: 12,
		alignSelf: 'center',
		textAlign: 'right',
		marginRight: 5,
		width: 75,
		color: c.infoBlue,
	},
})
