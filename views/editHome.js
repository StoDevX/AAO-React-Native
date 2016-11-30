// @flow
/**
 * All About Olaf
 * Edit Home page
 */

import React, { Component } from 'react'
import {
  Animated,
  AsyncStorage,
  Dimensions,
  Easing,
  Navigator,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import * as c from './components/colors'
import fromPairs from 'lodash/fromPairs'

import EntypoIcon from 'react-native-vector-icons/Entypo'
import IonIcon from 'react-native-vector-icons/Ionicons'
import SortableList from 'react-native-sortable-list'

import type {ViewType} from './home'
import {allViews} from './home'
import LoadingView from './components/loading'
//import AsyncStorageHOC from './components/asyncStorageHOC'

const window = Dimensions.get('window')

let objViews = fromPairs(allViews.map(v => ([v.view, v])))

const ReorderIcon = () =>
  <IonIcon name='ios-reorder' size={32} style={styles.listButtonIcon} />

const MenuIcon = ({icon, tint}: {icon: string, tint: string}) =>
  <EntypoIcon name={icon} size={32} style={[styles.rectangleButtonIcon, {color: tint}]} />

class Row extends Component {
  static propTypes = {
    active: React.PropTypes.bool,
    data: React.PropTypes.object.isRequired,
  }

  state = {
    style: {
      shadowRadius: new Animated.Value(2),
      transform: [{scale: new Animated.Value(1)}],
    },
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.active !== nextProps.active) {
      if (nextProps.active) {
        this.startActivationAnimation()
      } else {
        this.startDeactivationAnimation()
      }
    }
  }

  props: {
    data: ViewType,
    active: boolean,
  };

  startActivationAnimation = () => {
    const {style} = this.state
    Animated.parallel([
      Animated.timing(style.transform[0].scale, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 1.1,
      }),
      Animated.timing(style.shadowRadius, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 10,
      }),
    ]).start()
  }

  startDeactivationAnimation = () => {
    const {style} = this.state
    Animated.parallel([
      Animated.timing(style.transform[0].scale, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 1,
      }),
      Animated.timing(style.shadowRadius, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 2,
      }),
    ]).start()
  }

  render() {
    return (
      <Animated.View style={[styles.row, this.state.style]}>
        <MenuIcon icon={this.props.data.icon} tint={this.props.data.tint} />
        <Text style={[styles.text, {color: this.props.data.tint}]}>
          {this.props.data.title}
        </Text>
        <ReorderIcon />
      </Animated.View>
    )
  }
}

export default class EditHomeView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.instanceOf(Navigator),
    route: React.PropTypes.object,
  }

  state = {
    loaded: false,
    order: Object.keys(objViews),
  }

  componentWillMount() {
    this.loadData()
  }

  renderRow({data, active}: {data: ViewType, active: boolean}) {
    return <Row data={data} active={active} />
  }

  loadData = async () => {
    this.setState({loaded: false})

    let savedOrder = JSON.parse(await AsyncStorage.getItem('homescreen:view-order'))

    // check to see if we have a modified view order or not
    savedOrder = savedOrder || Object.keys(objViews)

    this.setState({loaded: true, order: savedOrder})
  }

  onOrderChange = (order: {[key: string]: ViewType}) => {
    AsyncStorage.setItem('homescreen:view-order', JSON.stringify(Object.values(order)))
  }

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    return (
      <View style={styles.container}>
        <SortableList
          style={styles.list}
          contentContainerStyle={styles.contentContainer}
          data={objViews}
          order={this.state.order}
          onChangeOrder={this.onOrderChange}
          renderRow={this.renderRow}
        />
      </View>
    )
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.iosLightBackground,
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    width: window.width,
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingRight: 16,
    marginVertical: 5,
    height: 50,
    width: window.width - 30 * 2,
    borderRadius: 4,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOpacity: 1,
    shadowOffset: {height: 2, width: 2},
    shadowRadius: 2,
  },
  rectangleButtonIcon: {
    marginRight: 20,
    // borderRadius: 20,
    color: c.white,
    paddingLeft: 10,
    paddingRight: 10,
  },
  listButtonIcon: {
    // borderRadius: 20,
    color: c.black,
    paddingLeft: 10,
    paddingRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 18,
    color: c.white,
  },
})
