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

import * as foo from '../../app/views'
console.log(foo)

const window = Dimensions.get('window')

type EditHomeProps = {
  onSaveOrder: (VisibleHomescreenViewType[]) => any,
  order: string[],
}
type RowProps = {data: VisibleHomescreenViewType, active: boolean}

function EditHomeView(props: EditHomeProps) {
  const objViews = fromPairs(homeViews.map(v => [v.view, v]))
  return (
    <SortableList
      contentContainerStyle={styles.contentContainer}
      data={objViews}
      order={props.order}
      onChangeOrder={props.onSaveOrder}
      renderRow={({data, active}: RowProps) =>
        <Row data={data} active={active} />}
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
    onSaveOrder: (newOrder: string[]) =>
      dispatch(saveHomescreenOrder(newOrder)),
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
