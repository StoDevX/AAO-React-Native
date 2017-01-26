// @flow
import React from 'react'
import {StyleSheet, ListView} from 'react-native'
import {NoticeView} from '../../components/notice'
import {FoodItemRow} from './food-item-row'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import type {MenuItemType, ProcessedMenuPropsType, MasterCorIconMapType} from '../types'

const leftSideSpacing = 28
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
})

export class MenuListView extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (row1, row2) => row1 !== row2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
    }),
  }

  componentWillMount() {
    this.load(this.props.data)
  }

  componentWillReceiveProps(newProps: {data: ProcessedMenuPropsType}) {
    this.load(newProps.data)
  }

  load(data: ProcessedMenuPropsType) {
    this.setState({
      dataSource: this.state.dataSource.cloneWithRowsAndSections(data),
    })
  }

  props: {
    badgeSpecials: boolean,
    data: ProcessedMenuPropsType,
    corIcons: MasterCorIconMapType,
    message?: string,
    stationNotes: {[key: string]: string},
  };

  renderSectionHeader = (sectionData: MenuItemType[], sectionName: string) => {
    let note = this.props.stationNotes[sectionName]

    return (
      <ListSectionHeader
        title={sectionName}
        subtitle={note}
        spacing={{left: leftSideSpacing}}
      />
    )
  }

  renderRow = (rowData: MenuItemType) => {
    return (
      <FoodItemRow
        data={rowData}
        corIcons={this.props.corIcons}
        badgeSpecials={this.props.badgeSpecials}
        spacing={{left: leftSideSpacing}}
      />
    )
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return (
      <ListSeparator
        spacing={{left: leftSideSpacing}}
        key={`${sectionId}-${rowId}`}
        style={styles.separator}
      />
    )
  }

  render() {
    if (this.props.message) {
      return <NoticeView style={styles.container} text={this.props.message} />
    }

    if (!this.state.dataSource.getRowCount()) {
      return <NoticeView style={styles.container} text='No items to show. Try changing the filters.' />
    }

    return (
      <ListView
        style={styles.container}
        initialListSize={12}
        pageSize={4}
        removeClippedSubviews={false}
        // we have to disable the automatic content-inset calc here and do it
        // manually, because there appears to be a bug where the ListView
        // fails to auto-calculate when the data is loaded after the listview
        // mounts
        automaticallyAdjustContentInsets={false}
        contentInset={{bottom: 49}}
        dataSource={this.state.dataSource}
        enableEmptySections={true}
        renderRow={this.renderRow}
        renderSeparator={this.renderSeparator}
        renderSectionHeader={this.renderSectionHeader}
      />
    )
  }
}
