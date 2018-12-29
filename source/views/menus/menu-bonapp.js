// @flow
import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {NoticeView, LoadingView} from '@frogpond/notice'
import type {TopLevelViewPropsType} from '../types'
import {FoodMenu} from '@frogpond/food-menu'
import type {
	EditedBonAppMenuInfoType as MenuInfoType,
	EditedBonAppCafeInfoType as CafeInfoType,
	StationMenuType,
	ProcessedMealType,
	DayPartMenuType,
	MenuItemContainerType,
	MenuItemType,
} from './types'
import sample from 'lodash/sample'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import toPairs from 'lodash/toPairs'
import type momentT from 'moment'
import moment from 'moment-timezone'
import {trimStationName, trimItemLabel} from './lib/trim-names'
import {getTrimmedTextWithSpaces, parseHtml, entities} from '@frogpond/html-lib'
import {toLaxTitleCase} from '@frogpond/titlecase'
import {reportNetworkProblem} from '@frogpond/analytics'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'

const BONAPP_HTML_ERROR_CODE = 'bonapp-html'

const DEFAULT_MENU = [
	{
		label: 'Menu',
		starttime: '0:00',
		endtime: '23:59',
		id: 'na',
		abbreviation: 'M',
		stations: [],
	},
]

type Props = TopLevelViewPropsType & {
	cafe: string | {id: string},
	ignoreProvidedMenus?: boolean,
	loadingMessage: string[],
	name: string,
}
type State = {
	cachedCafe: string | {id: string},
	errormsg: ?string,
	loading: boolean,
	refreshing: boolean,
	now: momentT,
	cafeInfo: ?CafeInfoType,
	cafeMenu: ?MenuInfoType,
}

export class BonAppHostedMenu extends React.PureComponent<Props, State> {
	state = {
		cachedCafe: this.props.cafe,
		errormsg: null,
		loading: true,
		refreshing: false,
		now: moment.tz(timezone()),
		cafeMenu: null,
		cafeInfo: null,
	}

	componentDidMount() {
		this.fetchData(this.props).then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	componentDidUpdate() {
		let {cachedCafe} = this.state
		let {cafe: newCafe} = this.props

		cachedCafe = typeof cachedCafe === 'string' ? cachedCafe : cachedCafe.id
		newCafe = typeof newCafe === 'string' ? newCafe : newCafe.id

		if (cachedCafe !== newCafe) {
			this.fetchData(this.props)
		}
	}

	retry = () => {
		this.fetchData(this.props).then(() => {
			this.setState(() => ({loading: false, errormsg: ''}))
		})
	}

	fetchData = async (props: Props, reload?: boolean) => {
		let menuUrl
		let cafeUrl
		let cafe = typeof props.cafe === 'string' ? props.cafe : props.cafe.id
		if (typeof props.cafe === 'string') {
			menuUrl = API(`/food/named/menu/${cafe}`)
			cafeUrl = API(`/food/named/cafe/${cafe}`)
		} else if (props.cafe.hasOwnProperty('id')) {
			menuUrl = API(`/food/menu/${cafe}`)
			cafeUrl = API(`/food/cafe/${cafe}`)
		} else {
			throw new Error('invalid cafe passed to BonappMenu!')
		}

		try {
			let cafeMenuPromise: Promise<MenuInfoType> = fetch(menuUrl, {
				forReload: reload ? 500 : 0,
			}).json()

			let cafeInfoPromise: Promise<CafeInfoType> = fetch(cafeUrl, {
				forReload: reload ? 500 : 0,
			}).json()

			let [cafeMenu, cafeInfo] = await Promise.all([
				cafeMenuPromise,
				cafeInfoPromise,
			])

			this.setState(() => ({
				cafeMenu: cafeMenu ? cafeMenu : null,
				cafeInfo: cafeInfo ? cafeInfo : null,
				now: moment.tz(timezone()),
			}))
		} catch (error) {
			if (error.message === "JSON Parse error: Unrecognized token '<'") {
				this.setState(() => ({errormsg: BONAPP_HTML_ERROR_CODE}))
			} else {
				reportNetworkProblem(error)
				this.setState(() => ({errormsg: error.message}))
			}
		}
	}

	refresh = async (): any => {
		this.setState(() => ({refreshing: true}))
		await this.fetchData(this.props, true)
		this.setState(() => ({refreshing: false}))
	}

	findCafeMessage(cafeInfo: CafeInfoType, now: momentT) {
		const actualCafeInfo = cafeInfo.cafe

		const todayDate = now.format('YYYY-MM-DD')
		const todayMenu = actualCafeInfo.days.find(({date}) => date === todayDate)

		if (!todayMenu) {
			return 'Closed today'
		} else if (todayMenu.status === 'closed') {
			return todayMenu.message || 'Closed today'
		}

		return null
	}

	buildCustomStationMenu(foodItems: MenuItemContainerType) {
		const groupByStation = (grouped, item: MenuItemType) => {
			if (item.station in grouped) {
				grouped[item.station].push(item.id)
			} else {
				grouped[item.station] = [item.id]
			}
			return grouped
		}

		// go over the list of all food items, turning it into a mapping
		// of {StationName: Array<FoodItemId>}
		const idsGroupedByStation = reduce(foodItems, groupByStation, {})

		// then we make our own StationMenus list
		return toPairs(idsGroupedByStation).map(([name, items], i) => ({
			// eslint-disable-next-line camelcase
			order_id: String(i),
			id: String(i),
			label: name,
			price: '',
			note: '',
			soup: false,
			items: items,
		}))
	}

	prepareSingleMenu(
		mealInfo: DayPartMenuType,
		foodItems: MenuItemContainerType,
		ignoreProvidedMenus: boolean,
	): ProcessedMealType {
		let stationMenus: StationMenuType[] = mealInfo ? mealInfo.stations : []

		if (ignoreProvidedMenus) {
			stationMenus = this.buildCustomStationMenu(foodItems)
		}

		// Make sure to titlecase the station menus list, too, so the sort works
		const titleCaseLabels = s => ({...s, label: toLaxTitleCase(s.label)})
		stationMenus = stationMenus.map(titleCaseLabels)

		return {
			stations: stationMenus,
			label: mealInfo.label || '',
			starttime: mealInfo.starttime || '0:00',
			endtime: mealInfo.endtime || '23:59',
		}
	}

	getMeals(args: {
		cafeMenu: MenuInfoType,
		ignoreProvidedMenus: boolean,
		foodItems: MenuItemContainerType,
	}): Array<ProcessedMealType> {
		const {cafeMenu, ignoreProvidedMenus, foodItems} = args

		// We hard-code to the first day returned because we're only requesting
		// one day. `cafes` is a map of cafe ids to cafes, but we only request one
		// cafe at a time, so we just grab the one we requested.
		const dayparts = cafeMenu.days[0].cafe.dayparts

		// either use the meals as provided by bonapp, or make our own
		const mealInfoItems = dayparts[0].length ? dayparts[0] : DEFAULT_MENU

		const ignoreMenus = dayparts[0].length ? ignoreProvidedMenus : true
		return mealInfoItems.map(mealInfo =>
			this.prepareSingleMenu(mealInfo, foodItems, ignoreMenus),
		)
	}

	prepareFood(cafeMenu: MenuInfoType) {
		return mapValues(cafeMenu.items, item => ({
			...item, // we want to edit the item, not replace it
			station: entities.decode(toLaxTitleCase(trimStationName(item.station))), // <b>@station names</b> are a mess
			label: entities.decode(trimItemLabel(item.label)), // clean up the titles
			description: getTrimmedTextWithSpaces(parseHtml(item.description || '')), // clean up the descriptions
		}))
	}

	render() {
		if (this.state.loading) {
			return <LoadingView text={sample(this.props.loadingMessage)} />
		}

		if (this.state.errormsg) {
			let msg = `Error: ${this.state.errormsg}`
			if (this.state.errormsg === BONAPP_HTML_ERROR_CODE) {
				msg =
					'Something between you and BonApp is having problems. Try again in a minute or two?'
			}
			return <NoticeView buttonText="Again!" onPress={this.retry} text={msg} />
		}

		if (!this.state.cafeMenu || !this.state.cafeInfo) {
			let cafe =
				typeof this.props.cafe === 'string'
					? this.props.cafe
					: this.props.cafe.id
			const err = new Error(`Something went wrong loading BonApp cafe #${cafe}`)
			reportNetworkProblem(err)

			const msg =
				'Something went wrong. Email allaboutolaf@stolaf.edu to let them know?'
			return <NoticeView text={msg} />
		}

		const {ignoreProvidedMenus = false} = this.props
		const {now, cafeMenu, cafeInfo} = this.state

		// We grab the "today" info from here because BonApp returns special
		// messages in this response, like "Closed for Christmas Break"
		const specialMessage = this.findCafeMessage(cafeInfo, now)

		// prepare all food items from bonapp for rendering
		const foodItems = this.prepareFood(cafeMenu)

		const meals = this.getMeals({
			foodItems,
			ignoreProvidedMenus,
			cafeMenu,
		})

		return (
			<FoodMenu
				cafeMessage={specialMessage}
				foodItems={foodItems}
				meals={meals}
				menuCorIcons={cafeMenu.cor_icons}
				name={this.props.name}
				navigation={this.props.navigation}
				now={now}
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
			/>
		)
	}
}
