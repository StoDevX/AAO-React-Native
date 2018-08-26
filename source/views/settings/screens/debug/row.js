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

		let rowDetail = isObject(data.value) ? null : JSON.stringify(data.value)
		if (isArray(data.value) && data.value.length === 0) {
			rowDetail = data.value.length
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
