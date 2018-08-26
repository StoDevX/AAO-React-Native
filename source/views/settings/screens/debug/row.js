// @flow

import * as React from 'react'
import {Cell} from 'react-native-tableview-simple'
import isObject from 'lodash/isObject'
import isArray from 'lodash/isArray'
import type {TopLevelViewPropsType} from '../../types'

type Props = TopLevelViewPropsType & {
	data: any,
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
		const _onPress = arrowPosition === 'none' ? null : this.props.onPress

		return (
			<Cell
				accessory={arrowStyle}
				cellStyle="RightDetail"
				detail={rowDetail}
				onPress={_onPress}
				title={data.key}
			/>
		)
	}
}
