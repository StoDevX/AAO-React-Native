// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '../../../components/colors'
// import SearchBar from 'react-native-material-design-searchbar'
import SearchBar from 'react-native-searchbar'
import Icon from 'react-native-vector-icons/Ionicons'

const iconStyles = StyleSheet.create({
	icon: {
		color: c.gray,
	},
})

const searchIcon = <Icon name="md-search" size={28} style={iconStyles.icon} />
const backIcon = <Icon name="md-arrow-back" size={28} style={iconStyles.icon} />
const closeIcon = <Icon name="md-close" size={28} style={iconStyles.icon} />

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
	searchActive: boolean,
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
	}

	render() {
		const backButton = this.props.searchActive ? backIcon : searchIcon
		return (
			<SearchBar
				ref={this.props.getRef}
				backButton={backButton}
				closeButton={this.props.searchActive ? closeIcon : null}
				focusOnLayout={false}
				handleChangeText={this.updateText}
				hideX={!this.props.searchActive}
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
