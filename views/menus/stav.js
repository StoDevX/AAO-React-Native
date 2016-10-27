// @flow

import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
  Text,
  ActivityIndicator,
} from 'react-native'

import FoodItem from './foodItem'

import moment from 'moment-timezone'
const CENTRAL_TZ = 'America/Winnipeg'

import DietaryFilters from './dietaryFilters'
const dietaryFilters = DietaryFilters()

import buildingHours from '../../data/building-hours.json'


export default class StavMenuView extends React.Component {
  constructor(props){
    super(props)
    let getSectionData = (dataBlob, sectionID) => {
      return dataBlob[sectionID]
    }

    let getRowData = (dataBlob, sectionID, rowID) => {
      return dataBlob[rowID]
    }

    this.state = {
      loaded: false,
      dataSource: new ListView.DataSource({
        getSectionData: getSectionData,
        getRowData: getRowData,
        rowHasChanged: (row1, row2) => row1 !== row2,
        sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
      }),
    }
  }

  componentDidMount(){
    this.fetchData()
  }

  getTodaysLunchHours(currentDay){
    for (let i = 0; i < buildingHours.length; i++){
      if (buildingHours[i].name=='Stav Hall Lunch'){
        return buildingHours[i].times.hours[currentDay][1]
      }
    }
  }

  whichMeal(){
    let current = moment().tz(CENTRAL_TZ)
    let currentTime = current.format('H:mm')
    let lunchClose = this.getTodaysLunchHours(current.format('ddd'))

    if (currentTime < lunchClose){
      return 1
    } else {
      return 2
    }
  }

  buildStation(station, items){
    let stationItems = []
    for (let i = 0; i < station.items.length; i++){
      let food = items[station.items[i]]
      if (food.special == 1){
        let temp = {
          name: food.label,
          dietary: food.cor_icon,
        }

        stationItems.push(temp)
      }
    }
    return stationItems
  }


  fetchData () {
    fetch('http://legacy.cafebonappetit.com/api/2/menus?cafe=261').then(response => response.json()).then(responseData => {
      let items = responseData.items   

      const dataBlob = {}
      const sectionIDs = []
      const rowIDs = []

      let meal = responseData.days[0].cafes[261].dayparts[0][this.whichMeal()]

      let stations = meal.stations

      for (let sectionId = 0; sectionId < stations.length; sectionId++){
        let stationItems = this.buildStation(stations[sectionId], items)

        if (stationItems.length > 0) {
          sectionIDs.push(sectionId)


          dataBlob[sectionId] = { station: stations[sectionId].label }

          rowIDs.push([])

          for (let j = 0; j < stationItems.length; j++) {

            const rowId = `${sectionId}:${j}`

            rowIDs[rowIDs.length - 1].push(rowId)

            dataBlob[rowId] = stationItems[j]
          }
        }
      }

      this.setState({
        dataSource: this.state.dataSource.cloneWithRowsAndSections(dataBlob, sectionIDs, rowIDs),
        loaded: true,
      })

    }).done()
  }

  renderLoadingView() {
    return (
      <View style={styles.header}>
      <View style={styles.container}>
      <ActivityIndicator
        animating={!this.state.loaded}
        style={[styles.activityIndicator, {height: 80}]}
        size='large'
      />
      </View>
      </View>
      )
  }

  renderSectionHeader(sectionData){
    return (
      <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{sectionData.station}</Text>
      </View>
      )
  }

  renderFoodItem(rowData){
    return (
      <FoodItem data={rowData} filters={dietaryFilters} />
      )
  }
  renderListView() {
    return (
      <View style={styles.container}>
      <ListView
        style={styles.container}
        dataSource={this.state.dataSource}
        renderRow={this.renderFoodItem}
        renderSeparator={(sectionId, rowId) => <View key={rowId} style={styles.separator} />}
        renderSectionHeader={this.renderSectionHeader}
      />
      </View>
      )
  }

  render() {
    if (!this.state.loaded) {
      return this.renderLoadingView()
    }

    return this.renderListView()
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 50,
  },
  sectionHeader: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    backgroundColor: '#EAEAEA',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#8E8E8E',
  },
})