// @flow
import React, {Component} from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import {LicenseItem} from './item'
import {type NavigationScreenProp} from 'react-navigation'
import {type LicenseType} from './types'
import {type SortedLicenseType} from './types'

type Props = {
	licenses: Array<LicenseType>,
	navigation: NavigationScreenProp<*>,
}

export class LicensesList extends Component<Props> {
	renderItem = ({item}: {item: LicenseType}) => (
		<LicenseItem item={item} navigation={this.props.navigation} />
	)

	renderSectionHeader = ({section: {title}}: any) => (
		// the proper type is ({section: {title}}: {section: {title: string}})
		<ListSectionHeader title={title} />
	)

	keyExtractor = (item: LicenseType, index: number) => index.toString()

	sortAndGroupResults = (licenses: Array<LicenseType>) => {
		let sorted: Array<LicenseType> = sortBy(licenses, license =>
			license.name.toLowerCase(),
		)
		let byTerm = groupBy(sorted, r => r.username && r.username.toLowerCase())

		let forSectionList = toPairs(byTerm).map(([key, value]) => ({
			title: key,
			data: value,
		}))

		let sortedAgain: Array<{title: string, data: Array<LicenseType>}> = sortBy(
			forSectionList,
			license => license.title,
		)

		return sortedAgain
	}

	render() {
		let {licenses} = this.props
		let sortedGroupedLicenses: Array<SortedLicenseType> = this.sortAndGroupResults(
			licenses,
		)

		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<NoticeView text="No licenses." />}
				contentContainerStyle={styles.contentContainer}
				keyExtractor={this.keyExtractor}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={sortedGroupedLicenses}
				style={styles.list}
			/>
		)
	}
}

const styles = StyleSheet.create({
	list: {
		flex: 1,
	},
	contentContainer: {
		flexGrow: 1,
	},
})
