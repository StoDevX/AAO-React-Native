import * as React from 'react'
import {LabeledContent, Text} from '@expo/ui/swift-ui'
import {foregroundStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {DisclosureRow} from '../../../../components/rows'
import {describeValue} from './lib'

type Props = {
	data: {key: string | number; value: unknown}
	onPress?: (key: string | number) => void
}

export const DebugRow = (props: Props): React.ReactNode => {
	let {data, onPress} = props
	let {detail, isDrillable} = describeValue(data.value)

	// Only a value with something inside it, and a handler to open it, is worth
	// drawing as something you can tap.
	if (isDrillable && onPress) {
		return (
			<DisclosureRow detail={detail} onPress={() => onPress(data.key)} title={String(data.key)} />
		)
	}

	return (
		<LabeledContent label={String(data.key)}>
			<Text modifiers={[foregroundStyle(c.secondaryLabel)]}>{detail}</Text>
		</LabeledContent>
	)
}
