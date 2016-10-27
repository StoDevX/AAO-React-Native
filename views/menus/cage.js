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

import DietaryFilters from './dietaryFilters'
const dietaryFilters = DietaryFilters()


export default class CageMenuView extends React.Component {
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

  filterItems(data, currentStation){
    let stationItems = []
    for (let key in data){
      if (data.hasOwnProperty(key)){
        let item = data[key]
        if (item.station.includes(currentStation) && item.special == 1){
          let temp = {
            name: item.label,
            dietary: item.cor_icon,
          }

          stationItems.push(temp)
        }
      }
    }
    return stationItems
  }

  buildStationList(items){
    let stationList = []
    for (let item in items){
      if (items.hasOwnProperty(item)){
        let station = items[item].station
        station = station.substring(station.indexOf('@')+1, station.lastIndexOf('<'))
        if (stationList.indexOf(station) < 0){
          stationList.push(station)
        }
      }
    }
    return stationList
  }

  fetchData () {
    fetch('http://legacy.cafebonappetit.com/api/2/menus?cafe=262').then(response => response.json()).then(responseData => {
      let items = responseData.items

      let stations = this.buildStationList(items)

      const dataBlob = {}
      const sectionIDs = []
      const rowIDs = []


      for (let sectionId = 0; sectionId < stations.length; sectionId++) {
        let currentStation = stations[sectionId]
        let stationItems = this.filterItems(items, currentStation)

        if (stationItems.length > 0) {
          sectionIDs.push(sectionId)

          dataBlob[sectionId] = { station: currentStation }

          rowIDs.push([])

          for (let i = 0; i < stationItems.length; i++) {

            const rowId = `${sectionId}:${i}`

            rowIDs[rowIDs.length - 1].push(rowId)

            dataBlob[rowId] = stationItems[i]
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