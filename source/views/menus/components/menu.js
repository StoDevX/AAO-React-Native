// @flow
import React from 'react'
import {StyleSheet} from 'react-native'
import SimpleListView from '../../components/listview'
import {NoticeView} from '../../components/notice'
import {FoodItemRow} from './food-item-row'
import size from 'lodash/size'
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

    if (!size(this.props.data)) {
      return <NoticeView style={styles.container} text='No items to show. Try changing the filters.' />
    }

    return (
      <SimpleListView
        style={styles.container}
        forceBottomInset={true}
        data={this.props.data}
        renderSeparator={this.renderSeparator}
        renderSectionHeader={this.renderSectionHeader}
      >
        {(rowData: MenuItemType) =>
          <FoodItemRow
            data={rowData}
            corIcons={this.props.corIcons}
            badgeSpecials={this.props.badgeSpecials}
            spacing={{left: leftSideSpacing}}
          />
        }
      </SimpleListView>
    )
  }
}
