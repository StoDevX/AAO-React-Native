// @flow

import React from 'react'
import {Dimensions, StyleSheet} from 'react-native'

import {saveHomescreenOrder} from '../../../flux/parts/homescreen'
import {connect} from 'react-redux'
import * as c from '../../components/colors'
import fromPairs from 'lodash/fromPairs'
import sortBy from 'lodash/sortBy'

import type {ViewType} from '../../views'
import {allViews} from '../../views'
import {EditHomeRow} from './row'

const styles = StyleSheet.create({
  contentContainer: {
    backgroundColor: c.androidLightBackground,
    paddingTop: 10,
    paddingBottom: 20,
  },
})

type Props = {
  onSaveOrder: (ViewType[]) => any,
  order: string[],
}
;[]

type State = {
  width: number,
}
;[]

class EditHomeView extends React.PureComponent<void, Props, State> {
  static navigationOptions = {
    title: 'Edit Home',
  }

  renderRow = ({data, active}: {data: ViewType, active: boolean}) => (
    <EditHomeRow data={data} active={active} width={this.state.width} />
  )

  onChangeOrder = (order: ViewType[]) => this.props.onSaveOrder(order)

  keyExtractor = (item: ViewType) => view.view

  render() {
    const data = sortBy(allViews, (item: ViewType) =>
      this.props.order.indexOf(item.view),
    )

    return (
      <FlatList
        contentContainerStyle={styles.contentContainer}
        data={allViews}
        keyExtractor={this.keyExtractor}
        onChangeOrder={this.onChangeOrder}
        renderRow={this.renderRow}
      />
    )
  }
}

function mapState(state) {
  return {
    order: state.homescreen.order,
  }
}

function mapDispatch(dispatch) {
  return {
    onSaveOrder: newOrder => dispatch(saveHomescreenOrder(newOrder)),
  }
}

export const ConnectedEditHomeView = connect(mapState, mapDispatch)(
  EditHomeView,
)
