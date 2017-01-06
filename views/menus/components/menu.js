// @flow
import React from 'react'
import {StyleSheet, ListView} from 'react-native'
import {NoticeView} from '../../components/notice'
import {FoodItemRow} from './food-item-row'
import DietaryFilters from '../../../images/dietary-filters'
import {ListSeparator} from '../../components/list-separator'
import {ListSectionHeader} from '../../components/list-section-header'
import {ListRow} from '../../components/list-row'
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
    paddingLeft: leftSideSpacing,
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
    message?: string,
    stationNotes: {[key: string]: string},
  };

  renderSectionHeader = (sectionData: MenuItemType[], sectionName: string) => {
    let note = this.props.stationNotes[sectionName]

    return (
      <ListSectionHeader
        style={styles.sectionHeader}
        title={sectionName}
        subtitle={note}
      />
    )
  }

  renderFoodItem = (rowData: MenuItemType, sectionId: string, rowId: string) => {
    return (
      <ListRow
        key={`${sectionId}-${rowId}`}
        style={styles.row}
        arrowPosition='none'
      >
        <FoodItemRow
          data={rowData}
          filters={DietaryFilters}
          badgeSpecials={this.props.badgeSpecials}
        />
      </ListRow>
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
        // we have to disable this here and do it manually, because there
        // appears to be a bug where the ListView fails to auto-calculate when
        // the data is loaded after the listview mounts
        automaticallyAdjustContentInsets={false}
        contentInset={{bottom: 49}}
        dataSource={this.state.dataSource}
        enableEmptySections={true}
        renderRow={this.renderFoodItem}
        renderSeparator={(sectionId, rowId) =>
          <ListSeparator key={`${sectionId}-${rowId}`} style={styles.separator} />}
        renderSectionHeader={this.renderSectionHeader}
      />
    )
  }
}
