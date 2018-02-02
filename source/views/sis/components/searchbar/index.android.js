// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '../../../components/colors'
// import SearchBar from 'react-native-material-design-searchbar'
import SearchBar from 'react-native-searchbar'

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
	onCancel: () => any,
	onFocus: () => any,
	onSearchButtonPress: string => any,
}

type State = {
	input: string,
}

export class CourseSearchBar extends React.PureComponent<Props, State> {
	state = {
		input: '',
	}

	updateText = input => {
		this.setState({input: input})
		console.log(input)
	}

	render() {
		return (
			<SearchBar
				ref={this.props.getRef}
				handleChangeText={this.updateText}
				onBack={this.props.onCancel}
				onFocus={this.props.onFocus}
				onHide={text => console.log(text)}
				onSubmitEditing={() => {
					this.props.onSearchButtonPress(this.state.input)
				}}
				placeholder={this.props.placeholder || 'Search'}
				showOnLoad={true}
				style={[styles.searchbar, this.props.style]}
			/>
		)
	}
}
