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
import {Touchable} from '../components/touchable'
import SortableListView from 'react-native-sortable-listview'

import type {ViewType} from '../views'
import {allViews} from '../views'

const objViews = fromPairs(allViews.map(v => [v.view, v]))

const ROW_HORIZONTAL_MARGIN = 15
const styles = StyleSheet.create({
  contentContainer: {
    backgroundColor: c.iosLightBackground,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: c.white,

    marginVertical: 5,
    marginHorizontal: ROW_HORIZONTAL_MARGIN,
    paddingVertical: 12,

    borderRadius: 4,

    shadowColor: c.semitransparentGray,
    shadowOpacity: 1,
    shadowOffset: {height: 0, width: 0},
  },
  icon: {
    paddingLeft: 10,
    paddingRight: 10,
    color: c.black,
  },
  viewIcon: {
    marginRight: 20,
  },
  text: {
    flex: 1,
    flexShrink: 0,
    fontSize: 18,
    color: c.white,
  },
})

const reorderIcon = (
  <IonIcon
    name={Platform.OS === 'ios' ? 'ios-reorder' : 'md-reorder'}
    size={32}
    style={[styles.icon]}
  />
)

const MenuIcon = ({icon, tint}: {icon: string, tint: string}) =>
  <EntypoIcon
    name={icon}
    size={32}
    style={[styles.icon, styles.viewIcon, {color: tint}]}
  />

type RowProps = {
  data: ViewType,
  active: boolean,
  width: number,
  sortHandlers?: any,
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
    const width = this.props.width - ROW_HORIZONTAL_MARGIN * 2

    return (
      <Animated.View style={[styles.row, this.state.style, {width}]}>
        <MenuIcon icon={this.props.data.icon} tint={this.props.data.tint} />
        <Text style={[styles.text, {color: this.props.data.tint}]}>
          {this.props.data.title}
        </Text>
        <Touchable highlight={false} {...this.props.sortHandlers}>
          {reorderIcon}
        </Touchable>
      </Animated.View>
    )
  }
}

type Props = {
  onSaveOrder: (ViewType[]) => any,
  order: ViewType[],
}
type State = {
  width: number,
  activeRowView: string,
}

class EditHomeView extends React.PureComponent<void, Props, State> {
  static navigationOptions = {
    title: 'Edit Home',
  }

  state = {
    width: Dimensions.get('window').width,
    activeRowView: '',
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

  onRowActive = event => {
    this.setState(() => ({activeRowView: event.rowData.data.view}))
  }

  onRowMoved = event => {
    let order = [...this.props.order]
    order.splice(event.to, 0, order.splice(event.from, 1)[0])
    this.props.onSaveOrder(order)
  }

  onMoveEnd = () => {
    this.setState(() => ({activeRowView: ''}))
  }

  render() {
    return (
      <SortableListView
        contentContainerStyle={[
          styles.contentContainer,
          {width: this.state.width},
        ]}
        data={objViews}
        order={this.props.order}
        activeOpacity={0.5}
        onRowActive={this.onRowActive}
        onRowMoved={this.onRowMoved}
        onMoveEnd={this.onMoveEnd}
        renderRow={(view: ViewType) =>
          <Row
            data={view}
            active={this.state.activeRowView === view.view}
            width={this.state.width}
          />}
      />
    )
  }
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
