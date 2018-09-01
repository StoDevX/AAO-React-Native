// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import NativeSearchBar from 'react-native-search-bar'
import * as c from '@frogpond/colors'
import {type Props} from './types'

const styles = StyleSheet.create({
	searchbar: {
		height: 44,
	},
})

export class SearchBar extends React.Component<Props> {
	static defaultProps = {
		onCancel: () => {},
		onChange: () => {},
		onFocus: () => {},
		onSubmit: () => {},
		placeholder: 'Search',
		textFieldBackgroundColor: null,
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
