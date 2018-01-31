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

type PropsType = {
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
				onFocus={this.props.onFocus}
				onCancelButtonPress={this.props.onCancel}
				onSearchButtonPress={this.props.onSearchButtonPress || null}
				placeholder={this.props.placeholder || 'Search'}
				style={[styles.searchbar, this.props.style]}
				textFieldBackgroundColor={c.sto.lightGray}
			/>
		)
	}
}
