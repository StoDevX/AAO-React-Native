// @flow

import * as React from 'react'
import {Dimensions, StyleSheet} from 'react-native'
import {type ReduxState} from '../../../flux'
import {saveHomescreenOrder} from '../../../flux/parts/homescreen'
import {connect} from 'react-redux'
import * as c from '../../components/colors'
import fromPairs from 'lodash/fromPairs'

import SortableList from '@hawkrives/react-native-sortable-list'

import type {ViewType} from '../../views'
import {allViews} from '../../views'
import {EditHomeRow} from './row'

const objViews = fromPairs(allViews.map(v => [v.view, v]))

const styles = StyleSheet.create({
  contentContainer: {
    backgroundColor: c.iosLightBackground,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
})

type ReduxStateProps = {
  order: string[],
}

type ReduxDispatchProps = {
  onSaveOrder: (string[]) => any,
}

type Props = ReduxStateProps & ReduxDispatchProps

type State = {
  width: number,
}

class EditHomeView extends React.PureComponent<Props, State> {
  static navigationOptions = {
    title: 'Edit Home',
  }

  state = {
    width: Dimensions.get('window').width,
  }

  componentWillMount() {
    Dimensions.addEventListener('change', this.handleResizeEvent)
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.handleResizeEvent)
  }

  handleResizeEvent = event => {
    this.setState(() => ({width: event.window.width}))
  }

  renderRow = ({data, active}: {data: ViewType, active: boolean}) => (
    <EditHomeRow active={active} data={data} width={this.state.width} />
  )

  onChangeOrder = (order: string[]) => this.props.onSaveOrder(order)

  render() {
    return (
      <SortableList
        contentContainerStyle={[
          styles.contentContainer,
          {width: this.state.width},
        ]}
        data={objViews}
        onChangeOrder={this.onChangeOrder}
        order={this.props.order}
        renderRow={this.renderRow}
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
