// @flow

import * as React from 'react'
import {StyleSheet, Platform} from 'react-native'
import * as c from '@frogpond/colors'
import {SearchBar} from '@frogpond/searchbar'
import type {Building, Feature} from './types'
import {CategoryPicker} from './category-picker'
import {BuildingList} from './building-list'
import fuzzyfind from 'fuzzyfind'

type Props = {
	features: Array<Feature<Building>>,
	onSelect: string => any,
	overlaySize: 'min' | 'mid' | 'max',
	onFocus: () => any,
	onCancel: () => any,
	onCategoryChange: string => any,
	category: string,
}

type State = {
	searchQuery: string,
}

export class BuildingPicker extends React.Component<Props, State> {
	state = {
		searchQuery: '',
	}

	componentDidUpdate(prevProps: Props) {
		const lastSize = prevProps.overlaySize
		const thisSize = this.props.overlaySize

		if (lastSize !== thisSize && lastSize === 'max') {
			this.dismissKeyboard()
		}
	}

	searchBar: any = null

	dismissKeyboard = () => {
		this.searchBar.blur()
	}

	performSearch = (text: string) => {
		// Android clear button returns an object
		if (typeof text !== 'string') {
			return this.handleSearchSubmit('')
		}

		return this.handleSearchSubmit(text)
	}

	onSelectBuilding = (id: string) => this.props.onSelect(id)

	onFocus = () => {
		this.props.onFocus()
	}

	onCancel = () => {
		this.dismissKeyboard()
		this.props.onCancel()
	}

	onOverlaySizeChange = (size: 'min' | 'mid' | 'max') => {
		this.setState(state => {
			if (state.size === 'max' && state.size !== size) {
				this.dismissKeyboard()
			}
		})
	}

	handleSearchSubmit = (query: string) => {
		this.setState(() => ({searchQuery: query}))
	}

	allCategories = ['Buildings', 'Outdoors', 'Parking', 'Athletics']
	categoryLookup = {
		Buildings: 'building',
		Outdoors: 'outdoors',
		Parking: 'parking',
		Athletics: 'athletics',
	}

	render() {
		// I don't inject the search query into the Search box because
		// it manages its text separately from RN, so you get jumpy editing.
		// Unfortunately, you also lose your search query when it unmounts and remounts.
		const search =
			Platform.OS === 'android' ? (
				<SearchBar
					ref={ref => (this.searchBar = ref)}
					onCancel={this.onCancel}
					onChangeText={this.performSearch}
					onFocus={this.onFocus}
					onSearchButtonPress={this.dismissKeyboard}
					placeholder="Search for a place"
					style={styles.searchBox}
					value={this.state.searchQuery}
				/>
			) : (
				<SearchBar
					getRef={ref => (this.searchBar = ref)}
					onCancel={this.onCancel}
					onChangeText={this.performSearch}
					onFocus={this.onFocus}
					onSearchButtonPress={this.dismissKeyboard}
					placeholder="Search for a place"
					style={styles.searchBox}
					textFieldBackgroundColor={c.iosGray}
				/>
			)

		const picker = !this.state.searchQuery ? (
			<CategoryPicker
				categories={this.allCategories}
				onChange={this.props.onCategoryChange}
				selected={this.props.category}
			/>
		) : null

		let matches = this.props.features

		if (this.state.searchQuery) {
			let query = this.state.searchQuery.toLowerCase()
			matches = fuzzyfind(query, matches, {
				accessor: b => {
					let name = b.properties.name.toLowerCase()
					let nickname = (b.properties.nickname || '').toLowerCase()
					return `${name} ${nickname}`
				},
			})
		} else {
			const selectedCategory = this.categoryLookup[this.props.category]
			matches = matches.filter(b =>
				b.properties.categories.includes(selectedCategory),
			)
		}

		return (
			<React.Fragment>
				{search}
				{picker}
				<BuildingList
					buildings={matches}
					onSelect={this.onSelectBuilding}
					scrollEnabled={this.props.overlaySize === 'max'}
				/>
			</React.Fragment>
		)
	}
}

const styles = StyleSheet.create({
	searchBox: {
		marginHorizontal: 6,
	},
})
