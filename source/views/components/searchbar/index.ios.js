// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import NativeSearchBar from 'react-native-search-bar'
import * as c from '../colors'
import {type Props} from './types'

const styles = StyleSheet.create({
	searchbar: {
		height: 44,
	},
})

export class SearchBar extends React.Component<Props> {
	static defaultProps = {
		backgroundColor: c.iosGray,
		onCancel: () => {},
		onChange: () => {},
		onFocus: () => {},
		onSubmit: () => {},
		placeholder: 'Search',
		textFieldBackgroundColor: c.white,
		value: '',
	}

	_ref: ?NativeSearchBar = null

	handleSearchButtonPress = () => {
		this._ref && this._ref.blur()
		this.props.onSubmit()
	}

	handleRef = (ref: NativeSearchBar) => {
		this._ref = ref
		this.props.getRef && this.props.getRef(ref)
	}

	render() {
		return (
			<NativeSearchBar
				ref={this.handleRef}
				autoCorrect={false}
				barTintColor={this.props.backgroundColor}
				hideBackground={true}
				onCancelButtonPress={this.props.onCancel}
				onChangeText={this.props.onChange}
				onFocus={this.props.onFocus}
				onSearchButtonPress={this.handleSearchButtonPress}
				placeholder={this.props.placeholder}
				style={styles.searchbar}
				text={this.props.value}
				textFieldBackgroundColor={this.props.textFieldBackgroundColor}
			/>
		)
	}
}
