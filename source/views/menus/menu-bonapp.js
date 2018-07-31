// @flow

import * as React from 'react'
import LoadingView from '../components/loading'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {FancyMenu} from './components/fancy-menu'
import type {BonAppMenuInfoType, BonAppCafeInfoType} from './types'
import sample from 'lodash/sample'
import moment from 'moment'

import {age} from '@frogpond/age'
import {Timer} from '@frogpond/timer'
import {DataFetcher} from '@frogpond/data-fetcher'
import {bonAppMenu, bonAppCafe} from './bonapp-requesters'
import {getMeals, findCafeMessage} from './bonapp-lib'

const BONAPP_HTML_ERROR_CODE = 'bonapp-html'

type Props = TopLevelViewPropsType & {
	cafeId: string,
	ignoreProvidedMenus?: boolean,
	loadingMessage: string[],
	name: string,
}

type DataFetcherProps = {
	menu: {
		data: BonAppMenuInfoType,
		error: ?Error,
		loading: boolean,
		refresh: () => any,
	},
	cafe: {
		data: BonAppCafeInfoType,
		error: ?Error,
		loading: boolean,
		refresh: () => any,
	},
}

export class BonAppHostedMenu extends React.Component<Props> {
	renderMenu = ({menu, cafe}: DataFetcherProps) => {
		let {refresh: cafeRefresh, data: cafeInfo, loading: cafeLoading} = cafe
		let {refresh: menuRefresh, data: cafeMenu, loading: menuLoading} = menu

		let refresh = () => Promise.all([cafeRefresh, menuRefresh])

		return (
			<Timer
				interval={age.minute(1)}
				render={ts => {
					let now = moment(ts)

					let {cafeId, ignoreProvidedMenus = false} = this.props

					// We grab the "today" info from here because BonApp returns special
					// messages in this response, like "Closed for Christmas Break"
					let specialMessage = findCafeMessage(cafeId, cafeInfo, now)

					let meals = getMeals({
						foodItems: cafeMenu.items,
						ignoreProvidedMenus,
						cafeId,
						cafeMenu,
					})

					return (
						<FancyMenu
							cafeMessage={specialMessage}
							foodItems={cafeMenu.items}
							meals={meals}
							menuCorIcons={cafeMenu.cor_icons}
							name={this.props.name}
							navigation={this.props.navigation}
							now={now}
							onRefresh={refresh}
							refreshing={cafeLoading || menuLoading}
						/>
					)
				}}
			/>
		)
	}

	renderNetworkError = (error: Error, {retry}: {retry: Function}) => {
		let msg = `Error: ${error.message}`
		if (error.message === BONAPP_HTML_ERROR_CODE) {
			msg =
				'Something between you and BonApp is having problems. Try again in a minute or two?'
		}
		return <NoticeView buttonText="Again!" onPress={retry} text={msg} />
	}

	render() {
		let menu = bonAppMenu({cafeId: this.props.cafeId})
		let cafe = bonAppCafe({cafeId: this.props.cafeId})

		return (
			<DataFetcher
				error={this.renderNetworkError}
				loading={() => <LoadingView text={sample(this.props.loadingMessage)} />}
				render={this.renderMenu}
				resources={{menu, cafe}}
			/>
		)
	}
}
