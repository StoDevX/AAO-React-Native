// @flow
import React from 'react'
import {StyleSheet, View, ListView, Text} from 'react-native'
import {NoticeView} from '../../components/notice'
import {FoodItemRow} from './food-item-row'
import DietaryFilters from '../../../images/dietary-filters'
import * as c from '../../components/colors'
import {Separator} from '../../components/separator'
import {toLaxTitleCase} from 'titlecase'
import type {MenuItemType, ProcessedMenuPropsType} from '../types'

const rightSideSpacing = 10
const leftSideSpacing = 28
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  row: {
    minHeight: 52,
    paddingRight: rightSideSpacing,
    paddingLeft: leftSideSpacing,
  },
  separator: {
    marginLeft: leftSideSpacing,
  },
  sectionHeader: {
    backgroundColor: c.iosListSectionHeader,
    paddingVertical: 5,
    paddingLeft: leftSideSpacing,
    paddingRight: rightSideSpacing,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ebebeb',
  },
  sectionHeaderText: {
    color: 'black',
    fontWeight: 'bold',
  },
  sectionHeaderNote: {
    fontSize: 13,
    color: c.iosDisabledText,
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
    data: ProcessedMenuPropsType,
    badgeSpecials: boolean,
    stationNotes: {[key: string]: string},
  };

  renderSectionHeader = (sectionData: MenuItemType[], sectionName: string) => {
    let note = this.props.stationNotes[sectionName]

    return (
      <View style={styles.sectionHeader}>
        <Text>
          <Text style={styles.sectionHeaderText}>{toLaxTitleCase(sectionName)}</Text>
          {note ? <Text style={styles.sectionHeaderNote}> — {note}</Text> : null}
        </Text>
      </View>
    )
  }

  renderFoodItem = (rowData: MenuItemType, sectionId: string, rowId: string) => {
    return (
      <FoodItemRow
        key={`${sectionId}-${rowId}`}
        data={rowData}
        filters={DietaryFilters}
        style={styles.row}
        badgeSpecials={this.props.badgeSpecials}
      />
    )
  }

  render() {
    if (!this.state.dataSource.getRowCount()) {
      return <NoticeView style={styles.container} text='No items to show. Try changing the filters.' />
    }

    return (
      <ListView
        style={styles.container}
        initialListSize={12}
        pageSize={4}
        removeClippedSubviews={false}
        // we have to disable this here and do it manually, because there
        // appears to be a bug where the ListView fails to auto-calculate when
        // the data is loaded after the listview mounts
        automaticallyAdjustContentInsets={false}
        contentInset={{bottom: 49}}
        dataSource={this.state.dataSource}
        enableEmptySections={true}
        renderRow={this.renderFoodItem}
        renderSeparator={(sectionId, rowId) =>
          <Separator key={`${sectionId}-${rowId}`} style={styles.separator} />}
        renderSectionHeader={this.renderSectionHeader}
      />
    )
  }
}
