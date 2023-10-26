import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

import * as c from '@frogpond/colors'
import {Cell} from '@frogpond/tableview'

type LeftDetailProps = {
	detail: string
	title: string
	onPress?: (() => void) | undefined
	accessory?:
		| false
		| 'DisclosureIndicator'
		| 'Detail'
		| 'DetailDisclosure'
		| 'Checkmark'
		| undefined
}

export function MultiLineLeftDetailCell(props: LeftDetailProps): JSX.Element {
	const {detail, title, onPress, accessory} = props
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
		color: c.label,
	},
	cellLeftDetail: {
		fontSize: 12,
		alignSelf: 'center',
		textAlign: 'right',
		marginRight: 5,
		width: 75,
		color: c.link,
	},
})
