// @flow
import * as React from 'react'
import {type FilterType, filterListSpecs} from '../../components/filter'
import {StyleSheet, Text, View, Platform} from 'react-native'
import {Toolbar, ToolbarButton} from '../../components/toolbar'
import {formatTerms} from '../course-search/lib/format-terms'

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
	const appliedFilterCount = filters.filter(f => f.enabled).length
	const isFiltered = appliedFilterCount > 0
	const filterWord = appliedFilterCount === 1 ? 'Filter' : 'Filters'

	const termFilter = filterListSpecs(filters).find(f => f.key === 'term')

	let toolbarTitle = 'All Terms'
	if (termFilter) {
		const selectedTerms = termFilter ? termFilter.spec.selected : []
		const terms = selectedTerms.map(t => parseInt(t.title))
		if (termFilter.enabled) {
			toolbarTitle = terms.length ? formatTerms(terms) : 'No Terms'
		}
	}

	const buttonTitle = isFiltered
		? `${appliedFilterCount} ${filterWord}`
		: 'No Filters'

	return (
		<Toolbar onPress={onPress}>
			<View style={[styles.toolbarSection, styles.today]}>
				<Text ellipsizeMode="tail" numberOfLines={1}>
					{toolbarTitle}
				</Text>
			</View>

			<ToolbarButton
				iconName={Platform.OS === 'ios' ? 'ios-funnel' : 'md-funnel'}
				isActive={isFiltered}
				title={buttonTitle}
			/>
		</Toolbar>
	)
}
