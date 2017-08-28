/**
 * @flow
 * All About Olaf
 * Edit Home page
 */

import React from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  Platform,
} from 'react-native'

import {saveHomescreenOrder} from '../../flux/parts/homescreen'
import {connect} from 'react-redux'
import * as c from '../components/colors'
import fromPairs from 'lodash/fromPairs'

import EntypoIcon from 'react-native-vector-icons/Entypo'
import IonIcon from 'react-native-vector-icons/Ionicons'
import SortableList from 'react-native-sortable-list'

import type {ViewType} from '../views'
import {allViews} from '../views'

const window = Dimensions.get('window')
const objViews = fromPairs(allViews.map(v => [v.view, v]))

const ReorderIcon = () => (
  <IonIcon
    name={Platform.OS === 'ios' ? 'ios-reorder' : 'md-reorder'}
    size={32}
    style={styles.listButtonIcon}
  />
)

const MenuIcon = ({icon, tint}: {icon: string, tint: string}) => (
  <EntypoIcon
    name={icon}
    size={32}
    style={[styles.rectangleButtonIcon, {color: tint}]}
  />
)

class Row extends React.Component {
  props: {
    data: ViewType,
    active: boolean,
  }

  state = {
    style: {
      shadowRadius: new Animated.Value(2),
      transform: [{scale: new Animated.Value(1)}],
      opacity: new Animated.Value(1.0),
      elevation: new Animated.Value(2),
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
        toValue: 1.05,
      }),
      Animated.timing(style.shadowRadius, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 10,
      }),
      Animated.timing(style.opacity, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 0.65,
      }),
      Animated.timing(style.elevation, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 4,
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
      Animated.timing(style.opacity, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 1.0,
      }),
      Animated.timing(style.elevation, {
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

function EditHomeView(props: {
  onSaveOrder: (ViewType[]) => any,
  order: string[],
}) {
  return (
    <SortableList
      contentContainerStyle={styles.contentContainer}
      data={objViews}
      order={props.order}
      onChangeOrder={(order: ViewType[]) => props.onSaveOrder(order)}
      renderRow={({data, active}: {data: ViewType, active: boolean}) => (
        <Row data={data} active={active} />
      )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.white,
    width: window.width - 15 * 2,
    marginVertical: 5,
    marginHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 4,
    shadowColor: c.semitransparentGray,
    shadowOpacity: 1,
    shadowOffset: {height: 2, width: 2},
    shadowRadius: 2,
    opacity: 1.0,
    elevation: 2,
  },
  rectangleButtonIcon: {
    marginRight: 20,
    color: c.white,
    paddingLeft: 10,
    paddingRight: 10,
  },
  listButtonIcon: {
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
