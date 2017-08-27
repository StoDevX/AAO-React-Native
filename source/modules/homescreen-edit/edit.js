// @flow

import React from 'react'
import {Dimensions, StyleSheet} from 'react-native'

import {saveHomescreenOrder} from '../../flux/parts/homescreen'
import {connect} from 'react-redux'
import * as c from '../../components/colors'
import fromPairs from 'lodash/fromPairs'
import SortableList from 'react-native-sortable-list'
import {Row} from './row'

import type {VisibleHomescreenViewType} from '../../app/types'
import {homeViews} from '../../app/views'

const window = Dimensions.get('window')
const objViews = fromPairs(homeViews.map(v => [v.view, v]))

function EditHomeView(props: {
  onSaveOrder: (VisibleHomescreenViewType[]) => any,
  order: string[],
}) {
  return (
    <SortableList
      contentContainerStyle={styles.contentContainer}
      data={objViews}
      order={props.order}
      onChangeOrder={(order: VisibleHomescreenViewType[]) =>
        props.onSaveOrder(order)}
      renderRow={({
        data,
        active,
      }: {
        data: VisibleHomescreenViewType,
        active: boolean,
      }) => <Row data={data} active={active} />}
    />
  )
}
EditHomeView.navigationOptions = {
  title: 'Edit Home',
}

function mapStateToProps(state) {
  return {
    order: state.homescreen.order,
  }
}
function mapDispatchToProps(dispatch) {
  return {
    onSaveOrder: newOrder => dispatch(saveHomescreenOrder(newOrder)),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(EditHomeView)

let styles = StyleSheet.create({
  contentContainer: {
    width: window.width,
    backgroundColor: c.iosLightBackground,
    paddingTop: 10,
    paddingBottom: 20,
  },
})
