import {StyleSheet, Text} from 'react-native'
import type {ListType} from './types'
import {Cell, Section} from '@frogpond/tableview'
import {Column} from '@frogpond/layout'
import * as c from '@frogpond/colors'
import {toggleAll, toggleOption} from './lib/select-options'

import isEqual from 'lodash/isEqual'
import * as React from 'react'
import {useCallback} from 'react'

type Props<T extends object> = {
	filter: ListType<T>
	onChange: (filter: ListType<T>) => void
}

export function ListSection<T extends object>({filter, onChange}: Props<T>): React.ReactNode {
	let {spec} = filter
	let {title, options, selected, mode} = spec
	let quantifier = mode === 'AND' ? 'all' : 'any'
	let {caption = `Show items with ${quantifier} of these options.`} = spec

	let buttonPushed = useCallback(
		(tappedValue: (typeof options)[number]) => {
			onChange(toggleOption(filter, tappedValue))
		},
		[filter, onChange],
	)

	let showAll = useCallback(() => {
		onChange(toggleAll(filter))
	}, [filter, onChange])

	let buttons = options.map((val) => (
		<Cell
			key={val.title}
			accessory={selected.some((s) => isEqual(s, val)) ? 'Checkmark' : undefined}
			cellContentView={
				<Column style={styles.content}>
					<Text style={styles.title}>{spec.displayTitle ? val.title : val.label}</Text>
					{val.detail ? <Text style={styles.detail}>{val.detail}</Text> : null}
				</Column>
			}
			cellStyle="RightDetail"
			disableImageResize={true}
			onPress={() => buttonPushed(val)}
		/>
	))

	if (mode === 'OR') {
		let showAllButton = (
			<Cell
				key="__show_all"
				accessory={selected.length === options.length ? 'Checkmark' : undefined}
				onPress={showAll}
				title="Show All"
			/>
		)
		buttons = [showAllButton].concat(buttons)
	}

	return (
		<Section footer={caption} header={title.toUpperCase()}>
			{buttons}
		</Section>
	)
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		flexShrink: 1,
		paddingVertical: 10,
	},
	title: {
		color: c.label,
		fontSize: 16,
	},
	detail: {
		color: c.label,
		fontSize: 11,
	},
	icon: {
		width: 16,
		height: 16,
	},
})
