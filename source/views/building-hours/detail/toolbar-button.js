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
	favorites: Array<string>,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

export class BuildingFavoriteButton extends React.Component<Props> {
	onFavorite = () => {
		this.props.onToggleFavorite(this.props.buildingName)
	}

	render() {
		const favorited = this.props.favorites.includes(this.props.buildingName)
		return <FavoriteButton favorited={favorited} onFavorite={this.onFavorite} />
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		favorites: state.buildings ? state.buildings.favorites : [],
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
