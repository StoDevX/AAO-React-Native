// @flow
import * as React from 'react'
import {StyleSheet, View, Text} from 'react-native'
import type momentT from 'moment'
import type {FilterType} from '../../components/filter'
import {FilterToolbar} from '../../components/filter'
import {Toolbar} from '../../components/toolbar'

const styles = StyleSheet.create({
	today: {
		flex: 1,
		paddingLeft: 12,
		paddingVertical: 14,
	},
	toolbarSection: {
		flexDirection: 'row',
	},
})

type PropsType = {
	date: momentT,
	title?: string,
	onPopoverDismiss: (filter: FilterType) => any,
	filters: FilterType[],
}

export function FilterMenuToolbar({
	date,
	title,
	filters,
	onPopoverDismiss,
}: PropsType) {
	return (
		<View>
			<Toolbar>
				<View style={[styles.toolbarSection, styles.today]}>
					<Text>
						<Text>{date.format('MMM. Do')}</Text>
						{title ? <Text> — {title}</Text> : null}
					</Text>
				</View>
			</Toolbar>
			<FilterToolbar filters={filters} onPopoverDismiss={onPopoverDismiss} />
		</View>
	)
}
