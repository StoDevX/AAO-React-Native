// @flow

import * as React from 'react'
import {ScrollView, StyleSheet, StatusBar} from 'react-native'

import {connect} from 'react-redux'
import * as c from '../components/colors'
import sortBy from 'lodash/sortBy'
import {type TopLevelViewPropsType} from '../types'
import {type ViewType} from '../views'
import {type ReduxState} from '../../flux'
import {allViews} from '../views'
import {Column} from '../components/layout'
import {partitionByIndex} from '../../lib/partition-by-index'
import {HomeScreenButton, CELL_MARGIN} from './button'
import {trackedOpenUrl} from '../components/open-url'
import {EditHomeButton, OpenSettingsButton} from '../components/nav-buttons'

type ReactProps = TopLevelViewPropsType & {
  views: Array<ViewType>,
}
type ReduxStateProps = {
  order: Array<string>,
  inactiveViews: Array<string>,
}

type Props = ReactProps & ReduxStateProps

function HomePage({navigation, order, inactiveViews, views = allViews}: Props) {
  const sortedViews = sortBy(views, view => order.indexOf(view.view))

  const enabledViews = sortedViews.filter(
    view => !inactiveViews.includes(view.view),
  )

  const columns = partitionByIndex(enabledViews)

  return (
    <ScrollView
      alwaysBounceHorizontal={false}
      contentContainerStyle={styles.cells}
      overflow="hidden"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar backgroundColor={c.gold} barStyle="light-content" />

      {columns.map((contents, i) => (
        <Column key={i} style={styles.column}>
          {contents.map(view => (
            <HomeScreenButton
              key={view.view}
              onPress={() => {
                if (view.type === 'url') {
                  return trackedOpenUrl({url: view.url, id: view.view})
                } else {
                  return navigation.navigate(view.view)
                }
              }}
              view={view}
            />
          ))}
        </Column>
      ))}
    </ScrollView>
  )
}
HomePage.navigationOptions = ({navigation}) => {
  return {
    title: 'All About Olaf',
    headerBackTitle: 'Home',
    headerLeft: <OpenSettingsButton navigation={navigation} />,
    headerRight: <EditHomeButton navigation={navigation} />,
  }
}

function mapStateToProps(state: ReduxState): ReduxStateProps {
  if (!state.homescreen) {
    return {order: [], inactiveViews: []}
  }

  return {
    order: state.homescreen.order,
    inactiveViews: state.homescreen.inactiveViews,
  }
}

export default connect(mapStateToProps)(HomePage)

const styles = StyleSheet.create({
  cells: {
    marginHorizontal: CELL_MARGIN / 2,
    marginTop: CELL_MARGIN / 2,
    paddingBottom: CELL_MARGIN / 2,

    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
})
