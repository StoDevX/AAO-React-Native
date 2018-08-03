// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '../colors'
import NativeSearchBar from 'react-native-searchbar-controlled'
import Icon from 'react-native-vector-icons/Ionicons'
import {type Props} from './types'

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

export class SearchBar extends React.Component<Props> {
	static defaultProps = {
		active: false,
		onCancel: () => {},
		onChange: () => {},
		onFocus: () => {},
		onSubmit: () => {},
		placeholder: 'Search',
		value: '',
	}

	handleRef = (ref: NativeSearchBar) => {
		this.props.getRef && this.props.getRef(ref)
	}

	render() {
		let backButton = this.props.active ? backIcon : searchIcon

		return (
			<NativeSearchBar
				ref={this.handleRef}
				backButton={backButton}
				closeButton={this.props.active ? closeIcon : null}
				focusOnLayout={false}
				handleChangeText={this.props.onChange}
				hideClose={!this.props.active}
				input={this.props.value}
				onBack={this.props.onCancel}
				onFocus={this.props.onFocus}
				onSubmitEditing={this.props.onSubmit}
				placeholder={this.props.placeholder}
				showOnLoad={true}
				style={[styles.searchbar, this.props.style]}
			/>
		)
	}
}
