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

const objViews = fromPairs(allViews.map(v => [v.view, v]))

const ReorderIcon = () =>
  <IonIcon
    name={Platform.OS === 'ios' ? 'ios-reorder' : 'md-reorder'}
    size={32}
    style={styles.listButtonIcon}
  />

const MenuIcon = ({icon, tint}: {icon: string, tint: string}) =>
  <EntypoIcon
    name={icon}
    size={32}
    style={[styles.rectangleButtonIcon, {color: tint}]}
  />

type RowProps = {
  data: ViewType,
  active: boolean,
  width: number,
}

type RowState = {
  style: {
    shadowRadius: Animated.Value,
    transform: Array<{[key: string]: Animated.Value}>,
    opacity: Animated.Value,
    elevation: Animated.Value,
  },
}

class Row extends React.Component<void, RowProps, RowState> {
  static startStyle = {
    shadowRadius: 2,
    transform: [{scale: 1}],
    opacity: 1,
    elevation: 2,
  }

  static endStyle = {
    shadowRadius: 10,
    transform: [{scale: 1.05}],
    opacity: 0.65,
    elevation: 4,
  }

  state = {
    style: {
      shadowRadius: new Animated.Value(Row.startStyle.shadowRadius),
      transform: [
        {scale: new Animated.Value(Row.startStyle.transform[0].scale)},
      ],
      opacity: new Animated.Value(Row.startStyle.opacity),
      elevation: new Animated.Value(Row.startStyle.elevation),
    },
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.active === nextProps.active) {
      return
    }

    if (nextProps.active) {
      this.startActivationAnimation()
    } else {
      this.startDeactivationAnimation()
    }
  }

  startActivationAnimation = () => {
    const {transform, shadowRadius, opacity, elevation} = this.state.style
    Animated.parallel([
      Animated.timing(transform[0].scale, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: Row.endStyle.transform[0].scale,
      }),
      Animated.timing(shadowRadius, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: Row.endStyle.shadowRadius,
      }),
      Animated.timing(opacity, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: Row.endStyle.opacity,
      }),
      Animated.timing(elevation, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: Row.endStyle.elevation,
      }),
    ]).start()
  }

  startDeactivationAnimation = () => {
    const {transform, shadowRadius, opacity, elevation} = this.state.style
    Animated.parallel([
      Animated.timing(transform[0].scale, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: Row.startStyle.transform[0].scale,
      }),
      Animated.timing(shadowRadius, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: Row.startStyle.shadowRadius,
      }),
      Animated.timing(opacity, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: Row.startStyle.opacity,
      }),
      Animated.timing(elevation, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: Row.startStyle.elevation,
      }),
    ]).start()
  }

  render() {
    const style = {width: Dimensions.get('window').width - 15 * 2}
    return (
      <Animated.View style={[styles.row, style, this.state.style]}>
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
  const style = {width: Dimensions.get('window').width}
  return (
    <SortableList
      contentContainerStyle={[styles.contentContainer, style]}
      data={objViews}
      order={props.order}
      onChangeOrder={(order: ViewType[]) => props.onSaveOrder(order)}
      renderRow={({data, active}: {data: ViewType, active: boolean}) =>
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
    onSaveOrder: newOrder => dispatch(saveHomescreenOrder(newOrder)),
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(EditHomeView)

let styles = StyleSheet.create({
  contentContainer: {
    backgroundColor: c.iosLightBackground,
    paddingTop: 10,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.white,
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
