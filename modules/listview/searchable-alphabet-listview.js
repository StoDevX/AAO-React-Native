// @flow

import * as React from 'react'
import {StyleSheet, Platform, View} from 'react-native'
import {StyledAlphabetListView} from './alphabet-listview'
import {SearchBar} from '@frogpond/searchbar'
import {white} from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'

export const LIST_HEADER_HEIGHT =
	Platform.OS === 'ios' ? 42 + StyleSheet.hairlineWidth * 12 : 0

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: white,
	},
})

type Props = $PropertyType<StyledAlphabetListView, 'props'> & {
	data: Object,
	query: string,
	onSearch: string => mixed,
}

export class SearchableAlphabetListView extends React.Component<Props> {
	render() {
		let {data} = this.props

		let content = null

		if (!Object.keys(data).length) {
			content = (
				<NoticeView text={`No results found for "${this.props.query}"`} />
			)
		} else {
			content = (
				<StyledAlphabetListView
					headerHeight={LIST_HEADER_HEIGHT}
					keyboardDismissMode="on-drag"
					keyboardShouldPersistTaps="never"
					showsVerticalScrollIndicator={false}
					{...this.props}
				/>
			)
		}

		return (
			<View style={styles.wrapper}>
				<SearchBar onChange={this.props.onSearch} value={this.props.query} />

				{content}
			</View>
		)
	}
}
