// @flow
import * as React from 'react'
import type {FilterType} from '../course-search/filters/types'
import {StyleSheet, Text, View, Platform} from 'react-native'
import {Toolbar, ToolbarButton} from '../../components/toolbar'

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

type Props = {
  filters: Array<FilterType>,
  onPress: () => any,
}

export function FilterToolbar({filters, onPress}: Props) {
  const appliedFilterCount = filters.length
  const isFiltered = appliedFilterCount > 0
  const filterWord = appliedFilterCount === 1 ? 'Filter' : 'Filters'

  return (
    <Toolbar onPress={onPress}>
			<View style={[styles.toolbarSection, styles.today]}>
				<Text>
					<Text>Course Filters</Text>
				</Text>
			</View>

			<ToolbarButton
				iconName={Platform.OS === 'ios' ? 'ios-funnel' : 'md-funnel'}
				isActive={isFiltered}
				title={
					isFiltered ? `${appliedFilterCount} ${filterWord}` : 'No Filters'
				}
			/>
		</Toolbar>
  )
}
