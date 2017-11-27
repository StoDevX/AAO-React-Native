// @flow

import * as React from 'react'
import {StyleSheet, FlatList} from 'react-native'
import {type ReduxState} from '../../../flux'
import {saveHomescreenOrder} from '../../../flux/parts/homescreen'
import {connect} from 'react-redux'
import * as c from '../../components/colors'
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

type ReduxStateProps = {
  order: string[],
}

type ReduxDispatchProps = {
  onSaveOrder: (string[]) => any,
}

type Props = ReduxStateProps & ReduxDispatchProps

class EditHomeView extends React.PureComponent<Props> {
  static navigationOptions = {
    title: 'Edit Home',
  }

  handleMoveUp = (currentOrder: string[], viewName: string) => {
    const currentIndex = currentOrder.indexOf(viewName)
    const newIndex = Math.max(0, currentIndex - 1)
    this.onChangeOrder(currentOrder, viewName, newIndex)
  }

  handleMoveDown = (currentOrder: string[], viewName: string) => {
    const currentIndex = currentOrder.indexOf(viewName)
    const newIndex = Math.min(currentOrder.length - 1, currentIndex + 1)
    this.onChangeOrder(currentOrder, viewName, newIndex)
  }

  onChangeOrder = (
    currentOrder: string[],
    viewName: string,
    newIndex: number,
  ) => {
    const newOrder = currentOrder.filter(v => v !== viewName)
    newOrder.splice(newIndex, 0, viewName)

    this.props.onChangeOrder(newOrder)
  }

  renderItem = ({item}: {item: ViewType}) => {
    const index = this.props.order.indexOf(item.view)
    const last = this.props.order.length - 1
    return (
      <EditHomeRow
        isFirst={index === 0}
        isLast={index === last}
        item={item}
        onMoveDown={this.handleMoveDown}
        onMoveUp={this.handleMoveUp}
        order={this.props.order}
      />
    )
  }

  keyExtractor = (item: ViewType) => item.view

  render() {
    const data = sortBy(allViews, (item: ViewType) =>
      this.props.order.indexOf(item.view),
    )

    return (
      <FlatList
        contentContainerStyle={styles.contentContainer}
        data={data}
        keyExtractor={this.keyExtractor}
        onChangeOrder={this.onChangeOrder}
        renderItem={this.renderItem}
      />
    )
  }
}

function mapState(state: ReduxState): ReduxStateProps {
  return {
    order: state.homescreen ? state.homescreen.order : [],
  }
}

function mapDispatch(dispatch): ReduxDispatchProps {
  return {
    onSaveOrder: newOrder => dispatch(saveHomescreenOrder(newOrder)),
  }
}

export const ConnectedEditHomeView = connect(mapState, mapDispatch)(
  EditHomeView,
)
