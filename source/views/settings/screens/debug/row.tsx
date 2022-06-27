import * as React from 'react'
import {Cell} from '@frogpond/tableview'
import type {TopLevelViewPropsType} from '../../../types'

type Props = TopLevelViewPropsType & {
	data: {key: string; value: any}
	onPress: (key: string) => void
}

export const DebugRow = (props: Props): JSX.Element => {
	let {data} = props

	let rowDetail = '<unknown>'
	let arrowPosition = 'none'

	if (Array.isArray(data.value)) {
		// Array(0), Array(100), etc
		rowDetail = `Array(${data.value.length})`
		arrowPosition = 'center'
	} else if (typeof data.value === 'object' && data.value !== null) {
		// [object Object], [object Symbol], etc
		rowDetail = data.value.toString()
		arrowPosition = 'center'
	} else if (typeof data.value === 'string') {
		if (data.value.length > 20) {
			rowDetail = `"${data.value.substr(0, 20)}…"`
		} else {
			rowDetail = JSON.stringify(data.value)
		}
	} else {
		rowDetail = JSON.stringify(data.value)
	}

	let onPress = (): void => {
		return arrowPosition === 'none' ? undefined : props.onPress(data.key)
	}

	return (
		<Cell
			accessory={arrowPosition === 'none' ? false : 'DisclosureIndicator'}
			cellStyle="RightDetail"
			detail={rowDetail}
			onPress={onPress}
			title={data.key}
		/>
	)
}
