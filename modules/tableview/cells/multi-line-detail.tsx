import * as React from 'react'
import {Cell} from 'react-native-tableview-simple'
import {StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'

type Props = {
	title: string
	leftDetail?: string
	rightDetail: string
}

export function MultiLineDetailCell(props: Props): JSX.Element {
	let {title, rightDetail, leftDetail} = props
	let cellContent = (
		<View style={styles.cellContentView}>
			<View style={styles.leftContainer}>
				<Text allowFontScaling={true} style={styles.cellTitle}>
					{title}
				</Text>
				{Boolean(leftDetail) && (
					<Text allowFontScaling={true} style={styles.cellLeftDetail}>
						{leftDetail}
					</Text>
				)}
			</View>
			<View style={styles.cellRightDetail}>{rightDetail}</View>
		</View>
	)
	return <Cell cellContentView={cellContent} />
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
		alignSelf: 'center',
	},
	leftContainer: {
		flex: 1,
	},
})
