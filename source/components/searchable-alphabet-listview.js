// @flow

import * as React from 'react'
import {StyleSheet, Platform, View} from 'react-native'
import {StyledAlphabetListView} from './alphabet-listview'
import debounce from 'lodash/debounce'
import {SearchBar} from './searchbar/index'

export const LIST_HEADER_HEIGHT = Platform.OS === 'ios' ? 42 : 0

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
})

type Props = any & {query: string}

export class SearchableAlphabetListView extends React.Component<Props> {
	_performSearch = (text: string) => this.props.onSearch(text)

	// We don't need to search as-you-type; slightly delayed is more
	// efficient and nearly as effective
	performSearch = debounce(this._performSearch, 200)

	render() {
		return (
			<View style={styles.wrapper}>
				<SearchBar onChange={this.performSearch} value={this.props.query} />
				<StyledAlphabetListView
					headerHeight={
						Platform.OS === 'ios'
							? LIST_HEADER_HEIGHT + StyleSheet.hairlineWidth * 12
							: 0
					}
					keyboardDismissMode="on-drag"
					keyboardShouldPersistTaps="never"
					showsVerticalScrollIndicator={false}
					{...this.props}
				/>
			</View>
		)
	}
}
