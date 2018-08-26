// @flow

import * as React from 'react'
import {Cell} from 'react-native-tableview-simple'
import type {TopLevelViewPropsType} from '../../types'

type Props = TopLevelViewPropsType & {
	data: {key: string, value: any},
	onPress: string => any,
}

export class DebugRow extends React.PureComponent<Props> {
	render() {
		const {data} = this.props

		let rowDetail =
			typeof data.value === 'object' ? null : JSON.stringify(data.value)

		if (data.value === null) {
			rowDetail = 'Object[0]'
		} else if (Array.isArray(data.value) && data.value.length === 0) {
			rowDetail = 'Array(0)'
		}

		const arrowPosition = rowDetail === null ? 'center' : 'none'
		const arrowStyle = arrowPosition !== 'none' ? 'DisclosureIndicator' : false
		const onPress = arrowPosition === 'none' ? null : this.props.onPress

		return (
			<Cell
				accessory={arrowStyle}
				cellStyle="RightDetail"
				detail={rowDetail}
				onPress={onPress}
				title={data.key}
			/>
		)
	}
}
