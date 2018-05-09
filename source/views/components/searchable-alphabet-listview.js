// @flow

import * as React from 'react'
import {StyleSheet, Platform, View} from 'react-native'
import {StyledAlphabetListView} from '../components/alphabet-listview'
import debounce from 'lodash/debounce'
import {SearchBar} from '../components/searchbar'
import {Searchbar as PaperSearchBar} from 'react-native-paper'

export const LIST_HEADER_HEIGHT = Platform.OS === 'ios' ? 42 : 60

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
})

type SearchProps = {
	getRef?: any,
	placeholder?: string,
	onChangeText: string => any,
}

type SearchState = {
	input: string,
}

class AndroidSearchBar extends React.PureComponent<SearchProps, SearchState> {
	state = {
		input: '',
	}

	updateText = (input: string) => {
		this.setState(() => ({input: input}), () => this.props.onChangeText(this.state.input))
	}

	render() {
		return (
			<PaperSearchBar
				ref={this.props.getRef}
				onChangeText={this.updateText}
				onIconPress={() => {}}
				placeholder={this.props.placeholder || 'Search'}
				value={this.state.input}
			/>
		)
	}
}


type Props = any

export class SearchableAlphabetListView extends React.PureComponent<Props> {
	searchBar: any = null

	performSearch = (text: string) => {
		this.props.onSearch(text)
	}

	onSearchButtonPress = () => {
		this.searchBar.blur()
	}

	render() {
		let search = Platform.OS === 'ios' ? (
			<SearchBar
					getRef={ref => (this.searchBar = ref)}
					onChangeText={this.performSearch}
					onSearchButtonPress={this.onSearchButtonPress}
				/>
			) : (
				<AndroidSearchBar
					getRef={ref => (this.searchBar = ref)}
					onChangeText={this.performSearch}
					onSearchButtonPress={this.onSearchButtonPress}
				/>
			)

		return (
			<View style={styles.wrapper}>
				{search}
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
