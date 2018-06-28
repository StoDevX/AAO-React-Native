// @flow
import * as React from 'react'
import {createStackNavigator} from 'react-navigation'
import {
	Modal,
	TouchableWithoutFeedback,
	View,
	StyleSheet,
	Text,
	Dimensions,
} from 'react-native'
import type {FilterType} from '../../components/filter'
import * as c from '../../components/colors'
import {AllFiltersView} from './filter-view'
import {FilterDetailView} from './filter-detail'

const styles = StyleSheet.create({
	card: {
		// alignItems: 'center',
		// height: 20,
	},
	header: {
		// justifyContent: 'center',
		// marginVertical: 10,
		// height: 40,
		backgroundColor: c.white,
	},
	modalContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'flex-end',
		backgroundColor: c.semitransparentGray,
	},
	modal: {
		// backgroundColor: c.olevilleGold,
	},
	upperHalf: {},
})

type Props = {
	filters: Array<FilterType>,
	onPressOutside: () => any,
	visible: boolean,
}

const MultiFilterNavigator = createStackNavigator(
	{
		AllFiltersView: {screen: AllFiltersView},
		FilterDetailView: {screen: FilterDetailView},
	},
	{
		navigationOptions: {
			headerForceInset: {top: 'never'},
			headerStyle: styles.header,
		},
	},
)

const SingleFilterNavigator = createStackNavigator(
	{
		FilterDetailView: {screen: FilterDetailView},
	},
	{
		navigationOptions: {
			headerForceInset: {top: 'never'},
			headerStyle: styles.header,
		},
	},
)

export function FilterModal({filters, onPressOutside, visible}: Props) {
	const multipleFilters = filters.length !== 1
	const {height, width} = Dimensions.get('window')
	const modalHeight = height / 2
	const emptyHeight = height - modalHeight

	return (
		<Modal animationType="fade" transparent={true} visible={visible}>
			<View style={styles.modalContainer}>
				<TouchableWithoutFeedback onPress={onPressOutside}>
					<View style={{height: emptyHeight}} />
				</TouchableWithoutFeedback>
				<View style={[styles.modal, {height: modalHeight}]}>
					{multipleFilters ? (
						<MultiFilterNavigator screenProps={{filters: filters}} />
					) : (
						<SingleFilterNavigator screenProps={{filter: filters[0]}} />
					)}
				</View>
			</View>
		</Modal>
	)
}
