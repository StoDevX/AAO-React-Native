import * as React from 'react'
import {Cell} from '@frogpond/tableview'

interface Props {
	data: {key: string | number; value: unknown}
	onPress: (key: string | number) => void
}

export const DebugRow = (props: Props): React.JSX.Element => {
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
			rowDetail = `"${data.value.substring(0, 20)}…"`
		} else {
			rowDetail = JSON.stringify(data.value)
		}
	} else {
		rowDetail = JSON.stringify(data.value)
	}

	let onPress = (): void => {
		arrowPosition === 'none' ? undefined : props.onPress(data.key);
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
