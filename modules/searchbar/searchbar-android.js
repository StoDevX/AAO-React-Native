// @flow

import * as React from 'react'
import {Searchbar as NativeSearchBar} from 'react-native-paper'
import {type Props} from './types'

export class SearchBar extends React.Component<Props> {
	static defaultProps = {
		onCancel: () => {},
		onChange: () => {},
		onFocus: () => {},
		onSubmit: () => {},
		placeholder: 'Search',
		value: '',
	}

	render() {
		return (
			<NativeSearchBar
				onChangeText={this.props.onChange}
				onIconPress={this.props.onCancel}
				placeholder={this.props.placeholder}
				style={this.props.style}
				value={this.props.value}
			/>
		)
	}
}
