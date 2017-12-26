/**
 * @flow
 *
 * <BuildingDetail/> manages the time that's passed on to the rest of the
 * building.
 */

import * as React from 'react'
import type {BuildingType} from '../types'
import moment from 'moment-timezone'
import {BuildingDetail} from './building'
import {CENTRAL_TZ} from '../lib'
import type {TopLevelViewPropsType} from '../../types'
import {FavoriteButton} from '../../components/nav-buttons'
import {connect} from 'react-redux'

type ReduxStateProps = {
  favoriteBuildings: Array<BuildingType>,
}

type Props = TopLevelViewPropsType & ReduxStateProps & {
  navigation: {state: {params: {building: BuildingType, favoriteBuildings: BuildingType[]}}},
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
          favorited={favoriteBuildings.includes(building)}
          navigation={navigation}
          onFavorite={() => {
            if (favoriteBuildings.includes(building)) {
              const index = favoriteBuildings.indexOf(building)
              favoriteBuildings.splice(index, 1)
            } else {
              favoriteBuildings.push(building)
            }
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
    // This updates the screen every ten seconds, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateTime, 1000)})
  }

  componentDidMount() {

  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
    this.props.navigation.state.params.onUpdate()
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
    favoriteBuildings: state.buildings ? state.buildings.favoriteBuildings : []
  }
}

export const ConnectedBuildingHoursDetailView = connect(mapStateToProps)(
  BuildingHoursDetailView,
)
