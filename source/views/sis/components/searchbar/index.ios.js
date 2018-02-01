// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import NativeSearchBar from 'react-native-search-bar'
import * as c from '../../../components/colors'

const styles = StyleSheet.create({
	searchbar: {
		backgroundColor: c.white,
		height: 44,
	},
})

type Props = {
	getRef?: any,
	style?: any,
	placeholder?: string,
	onSearchButtonPress: string => any,
	onFocus: () => any,
	onCancel: () => any,
}

export class CourseSearchBar extends React.PureComponent<Props> {
	render() {
		return (
			<NativeSearchBar
				ref={this.props.getRef}
				hideBackground={true}
				onCancelButtonPress={this.props.onCancel}
				onFocus={this.props.onFocus}
				onSearchButtonPress={this.props.onSearchButtonPress || null}
				placeholder={this.props.placeholder || 'Search'}
				style={[styles.searchbar, this.props.style]}
				textFieldBackgroundColor={c.sto.lightGray}
			/>
		)
	}
}
