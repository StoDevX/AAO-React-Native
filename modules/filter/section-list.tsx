import {Image, StyleSheet, Text} from 'react-native'
import type {ListItemSpecType, ListType} from './types'
import {Cell, Section} from '@frogpond/tableview'
import {Column} from '@frogpond/layout'
import concat from 'lodash/concat'
import isEqual from 'lodash/isEqual'
import reject from 'lodash/reject'
import * as React from 'react'
import {useCallback} from 'react'

type PropsType = {
	filter: ListType
	onChange: (filter: ListType) => void
}

export function ListSection({filter, onChange}: PropsType): JSX.Element {
	let {spec} = filter
	let {title = '', options, selected, mode} = spec
	let quantifier = mode === 'AND' ? 'all' : 'any'
	let {caption = `Show items with ${quantifier} of these options.`} = spec

	let buttonPushed = useCallback(
		(tappedValue: ListItemSpecType) => {
			let result

			if (mode === 'OR' && selected.length === options.length) {
				// if all options of an OR filter are selected and a user selects
				// an option, make that the only selected option
				result = [tappedValue]
			} else if (selected.some((val) => isEqual(val, tappedValue))) {
				// if the user has tapped an item, and it's already in the list of
				// things they've tapped, we want to _remove_ it from that list.
				result = reject(selected, (val) => isEqual(val, tappedValue))
			} else {
				// otherwise, we need to add it to the list
				result = concat(selected, tappedValue)
			}

			let enabled = false
			if (mode === 'OR') {
				enabled = result.length !== options.length
			} else if (mode === 'AND') {
				enabled = result.length > 0
			}

			onChange({
				...filter,
				enabled: enabled,
				spec: {...spec, selected: result},
			})
		},
		[filter, mode, onChange, options.length, selected, spec],
	)

	let showAll = useCallback(() => {
		let result: ListItemSpecType[]

		if (selected.length === options.length) {
			// when all items are selected: uncheck them all
			result = []
		} else {
			// when one or more items are not checked: check them all
			result = options
		}

		onChange({
			...filter,
			enabled: result.length !== options.length,
			spec: {...spec, selected: result},
		})
	}, [filter, onChange, options, selected.length, spec])

	let hasImageColumn = options.some((val) => Boolean(val.image))
	let buttons = options.map((val) => (
		<Cell
			key={val.title}
			accessory={
				selected.some((s) => isEqual(s, val)) ? 'Checkmark' : undefined
			}
			cellContentView={
				<Column style={styles.content}>
					<Text style={styles.title}>
						{spec.displayTitle ? val.title : val.label}
					</Text>
					{val.detail ? <Text style={styles.detail}>{val.detail}</Text> : null}
				</Column>
			}
			cellStyle="RightDetail"
			disableImageResize={true}
			image={
				spec.showImages && val.image ? (
					<Image source={val.image} style={styles.icon} />
				) : undefined
			}
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
		<Section
			footer={caption}
			header={title.toUpperCase()}
			separatorInsetLeft={hasImageColumn ? 45 : undefined}
		>
			{buttons}
		</Section>
	)
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingVertical: 10,
	},
	title: {
		fontSize: 16,
	},
	detail: {
		fontSize: 11,
	},
	icon: {
		width: 16,
		height: 16,
	},
})
