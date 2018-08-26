// @flow
import * as React from 'react'
import {type NavigationScreenProp} from 'react-navigation'
import {data as fallbackMenu} from '../../../docs/pause-menu.json'
import {API} from '@frogpond/api'
import {StaticFoodMenu} from '@frogpond/static-food-menu'

type Props = {
	name: string,
	loadingMessage: string[],
	navigation: NavigationScreenProp<*>,
}

export class PauseMenu extends React.PureComponent<Props> {
	render() {
		return (
			<StaticFoodMenu
				fallbackData={fallbackMenu}
				loadingMessage={this.props.loadingMessage}
				name={this.props.name}
				navigation={this.props.navigation}
				url={API('/food/named/menu/the-pause')}
			/>
		)
	}
}
