// @flow

import * as React from 'react'
import {FavoriteButton} from '../../components/nav-buttons/favorite'
import {type ReduxState} from '../../../flux'
import {connect} from 'react-redux'
import {toggleFavoriteBuilding} from '../../../flux/parts/buildings'

type ReactProps = {
  buildingName: string,
}

type ReduxDispatchProps = {
  onToggleFavorite: string => any,
}

type ReduxStateProps = {
  favoriteBuildings: Array<string>,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

export class BuildingFavoriteButton extends React.Component<Props> {
  onFavorite = () => {
    this.props.onToggleFavorite(this.props.buildingName)
  }

  render() {
    const favorited = this.props.favoriteBuildings.includes(
      this.props.buildingName,
    )
    return <FavoriteButton favorited={favorited} onFavorite={this.onFavorite} />
  }
}

function mapState(state: ReduxState): ReduxStateProps {
  return {
    favoriteBuildings: state.buildings ? state.buildings.favoriteBuildings : [],
  }
}

function mapDispatch(dispatch): ReduxDispatchProps {
  return {
    onToggleFavorite: buildingName =>
      dispatch(toggleFavoriteBuilding(buildingName)),
  }
}

export const ConnectedBuildingFavoriteButton = connect(mapState, mapDispatch)(
  BuildingFavoriteButton,
)
