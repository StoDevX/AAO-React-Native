// @flow

import React from 'react'
import {Text, View, StyleSheet, TouchableOpacity, Platform, FlatList, Switch} from 'react-native'
import Collapsible from 'react-native-collapsible'
import * as c from '../../components/colors'
import Icon from 'react-native-vector-icons/Ionicons'
import {CellToggle} from '../../components/cells/toggle'
import type {ReduxState} from '../../../flux'
import {connect} from 'react-redux'
import type {FilterType} from '../course-search/filters/types'
import {updateFilters} from '../../../flux/parts/sis'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	filters: Array<FilterType>,
}

type ReduxDispatchProps = {
  onToggleFilter: FilterType => any,
}

type Props = ReactProps &
	ReduxStateProps &
	ReduxDispatchProps & {
    title: string,
    data: string[],
	}

type State = {
  collapsed: boolean,
}

class CollapsibleList extends React.PureComponent<Props, State> {

  state = {
    collapsed: true,
  }

  onPress = () => {
    if (this.state.collapsed) {
      this.setState(() => ({collapsed: false}))
    } else {
      this.setState(() => ({collapsed: true}))
    }
  }

  keyExtractor = (item: string) => item

  toggleFilter = (filter: string) => {
    const newFilter = {'filterCategory': this.props.title, 'value': filter}
    this.props.onToggleFilter(newFilter)
  }

  renderItem = ({item}: {item: string}) => {
    const activated = this.props.filters.find(filter => filter.value === item) !== undefined
    return (
      <CellToggle
        key={item}
        label={item}
        onChange={() => {this.toggleFilter(item)}}
        value={activated}
      />
    )
  }

  render() {
    const {title} = this.props
    const {collapsed} = this.state
    const icon = collapsed ? 'arrow-down' : 'arrow-up'
    // console.log(this.props.filters)
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.onPress} style={styles.headerContainer} >
          <View style={styles.titleContainer} >
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.iconContainer}>
            {renderIcon(icon)}
          </View>
        </TouchableOpacity>
        <Collapsible collapsed={collapsed} >
          <FlatList
            data={this.props.data}
            extraData={this.props}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
          />
        </Collapsible>
      </View>
    )
  }
}

function mapState(state: ReduxState): ReduxStateProps {
  return {
    filters: state.sis ? state.sis.filters : {'GEs': [], 'Departments': []},
  }
}

function mapDispatch(dispatch): ReduxDispatchProps {
  return {
    onToggleFilter: filter => dispatch(updateFilters(filter)),
  }
}

export const ConnectedCollapsibleList = connect(mapState, mapDispatch)(CollapsibleList)

const styles = StyleSheet.create({
  container: {

  },

  title: {
    fontSize: 30,
  },

  headerContainer: {
    backgroundColor: c.white,
    padding: 25,
    flexDirection: 'row',
  },

  icon: {
    fontSize: 30,
  },

  iconContainer: {
    alignSelf: 'center',
  },

  titleContainer: {
    flex: 1,
  },
})

const renderIcon = (name: string) => {
  const iconPlatform = Platform.OS === 'ios' ? 'ios' : 'md'
  return (<Icon name={`${iconPlatform}-${name}`} style={styles.icon} />)
}
