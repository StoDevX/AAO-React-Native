// @flow

import * as React from 'react'
import type {BuildingType} from '../types'
import moment from 'moment-timezone'
import {BuildingDetail} from './building'
import {CENTRAL_TZ} from '../lib'
import type {TopLevelViewPropsType} from '../../types'
import {FavoriteButton} from '../../components/nav-buttons'
import {connect} from 'react-redux'
import {type ReduxState} from '../../../flux'
import {saveFavoriteBuildings} from '../../../flux/parts/buildings'

type ReduxStateProps = {
  favoriteBuildings: Array<string>,
}

type ReduxDispatchProps = {
  onSaveFavorites: (string[], string) => any,
}

type Props = TopLevelViewPropsType &
  ReduxStateProps &
  ReduxDispatchProps & {
    navigation: {
      state: {
        params: {
          building: BuildingType,
          favoriteBuildings: string[],
          onSaveFavorites: (string[], string) => any,
        },
      },
    },
  }

type State = {intervalId: number, now: moment}

export class BuildingHoursDetailView extends React.PureComponent<Props, State> {
  static navigationOptions = ({navigation}) => {
    const building = navigation.state.params.building
    let favoriteBuildings = navigation.state.params.favoriteBuildings
    return {
      title: building.name,
      headerRight: (
        <FavoriteButton
          favorited={favoriteBuildings.includes(building.name)}
          navigation={navigation}
          onFavorite={() => {
            navigation.state.params.onSaveFavorites(
              favoriteBuildings,
              building.name,
              navigation,
            )
          }}
        />
      ),
    }
  }

  state = {
    intervalId: 0,
    // now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
    now: moment.tz(CENTRAL_TZ),
  }

  componentWillMount() {
    // This updates the screen every second, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 1000)})
    this.props.navigation.setParams({
      onSaveFavorites: this.props.onSaveFavorites,
    })
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  updateTime = () => {
    this.setState(() => ({now: moment.tz(CENTRAL_TZ)}))
  }

  reportProblem = () => {
    this.props.navigation.navigate('BuildingHoursProblemReportView', {
      initialBuilding: this.props.navigation.state.params.building,
    })
  }

  render() {
    const info = this.props.navigation.state.params.building
    const {now} = this.state

    return (
      <BuildingDetail
        info={info}
        now={now}
        onProblemReport={this.reportProblem}
      />
    )
  }
}

function mapStateToProps(state: ReduxState): ReduxStateProps {
  return {
    favoriteBuildings: state.buildings.favoriteBuildings
      ? state.buildings.favoriteBuildings
      : [],
  }
}

function mapDispatch(dispatch): ReduxDispatchProps {
  return {
    onSaveFavorites: (favoriteBuildings, newBuilding, navigation) =>
      dispatch(
        saveFavoriteBuildings(favoriteBuildings, newBuilding, navigation),
      ),
  }
}

export const ConnectedBuildingHoursDetailView = connect(
  mapStateToProps,
  mapDispatch,
)(BuildingHoursDetailView)
