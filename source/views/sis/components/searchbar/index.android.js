// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '../../../components/colors'
import SearchBar from 'react-native-material-design-searchbar'

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
	onChangeText: string => any,
	onSearchButtonPress: string => any,
}

export class CourseSearchBar extends React.PureComponent<Props> {
	render() {
		return (
			<SearchBar
				autoCorrect={false}
				height={50}
				onBlur={() => console.log('On Blur')}
				onFocus={() => console.log('On Focus')}
				onSearchChange={this.props.onChangeText || null}
				padding={5}
				placeholder={this.props.placeholder || 'Search'}
				returnKeyType="search"
				style={styles.searchbar}
			/>
		)
	}
}
