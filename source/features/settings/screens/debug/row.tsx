import * as React from 'react'
import {Cell} from '@frogpond/tableview'

type Props = {
	data: {key: string | number; value: unknown}
	onPress?: (key: string | number) => void
}

export const DebugRow = (props: Props): React.ReactNode => {
	let {data, onPress} = props

	let rowDetail = '<unknown>'
	let isDrillable = false

	if (Array.isArray(data.value)) {
		// Array(0), Array(100), etc
		rowDetail = `Array(${data.value.length})`
		isDrillable = true
	} else if (typeof data.value === 'object' && data.value !== null) {
		// [object Object], [object Symbol], etc
		// eslint-disable-next-line @typescript-eslint/no-base-to-string
		rowDetail = data.value.toString()
		isDrillable = true
	} else if (typeof data.value === 'string') {
		if (data.value.length > 20) {
			rowDetail = `"${data.value.substring(0, 20)}…"`
		} else {
			rowDetail = JSON.stringify(data.value)
		}
	} else {
		rowDetail = JSON.stringify(data.value)
	}

	let showArrow = isDrillable && onPress != null

	return (
		<Cell
			accessory={showArrow ? 'DisclosureIndicator' : false}
			cellStyle="RightDetail"
			detail={rowDetail}
			onPress={showArrow ? () => onPress?.(data.key) : undefined}
			title={data.key}
		/>
	)
}
