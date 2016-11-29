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
import map from 'lodash/map'
import fromPairs from 'lodash/fromPairs'

import EntypoIcon from 'react-native-vector-icons/Entypo'
import IonIcon from 'react-native-vector-icons/Ionicons'
import SortableList from 'react-native-sortable-list'

import {views} from './home'
import LoadingView from './components/loading'
//import AsyncStorageHOC from './components/asyncStorageHOC'

const window = Dimensions.get('window')

let objViews = fromPairs(map(views, v => {
  return [v.view, v]
}))

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
    const {data} = this.props
    return (
      <Animated.View style={[styles.row, this.state.style]}>
          <EntypoIcon
            name={data.icon}
            size={32}
            style={[styles.rectangleButtonIcon, {color: data.tint}]}
          />
          <Text
            style={[styles.text, {color: data.tint}]}>
            {data.title}
          </Text>
          <IonIcon
            size={32}
            style={styles.listButtonIcon}
            name='ios-reorder'
          />
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
    order: [],
  }

  componentWillMount() {
    this.loadData()
  }

  _renderRow = ({data, active}) => {
    return (
      <Row
        data={data}
        active={active}
      />
    )
  }

  loadData = async () => {
    this.setState({loaded: false})

    let savedOrder = await Promise.all([
      AsyncStorage.getItem('homescreen:view-order').then(val => JSON.parse(val)),
    ])

    if (savedOrder) {
      this.setState({order: savedOrder[0]})
    }

    this.setState({loaded: true})
  }

  onOrderChange = order => {
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
          order={this.state.order || Object.keys(objViews)}
          onChangeOrder={order => this.onOrderChange(order)}
          renderRow={this._renderRow} />
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
    borderRadius: 20,
    color: c.white,
    paddingLeft: 10,
    paddingRight: 10,
  },
  listButtonIcon: {
    borderRadius: 20,
    color: c.black,
    paddingLeft: 10,
    paddingRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 18,
    color: c.white,
  },
  help: {
    fontSize: 15,
    color: c.black,
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
  },
})
