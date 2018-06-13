// @flow
import * as React from 'react'
import {createStackNavigator} from 'react-navigation'
import {Modal, TouchableWithoutFeedback, View, StyleSheet, Text, Dimensions} from 'react-native'
import type {FilterType} from '../../components/filter'
import * as c from '../../components/colors'
import {AllFiltersView} from './filter-view'
import {FilterDetailView} from './filter-detail'

type Props = {
  filters: Array<FilterType>,
  onPressOutside: () => any,
  visible: boolean,
}

const FilterNavigator = createStackNavigator({
  AllFiltersView: { screen: AllFiltersView },
  FilterDetailView: { screen: FilterDetailView },
}, {
  navigationOptions: {
    // headerStyle: styles.header,
    // headerTintColor: c.black,
  },
})

export function FilterModal({filters, onPressOutside, visible}: Props) {
  const multipleFilters = filters.length !== 1
  const {height, width} = Dimensions.get('window')
  const modalHeight = 300
  const emptyHeight = height - modalHeight
  // const content = multipleFilters ?

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
    >
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onPressOutside}>
          <View style={{height: emptyHeight}}/>
        </TouchableWithoutFeedback>
        <View style={[styles.modal, {height: modalHeight}]}>
          <FilterNavigator />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'flex-end',
		backgroundColor: c.semitransparentGray,
	},
	modal: {
		// backgroundColor: c.olevilleGold,
	},
  upperHalf: {

  },
})
