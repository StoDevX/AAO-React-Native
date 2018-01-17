// @flow
import * as React from 'react'
import LoadingView from '../components/loading'
import qs from 'querystring'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {ConnectedFancyMenu as FancyMenu} from './components/fancy-menu'
import type {
	BonAppMenuInfoType as MenuInfoType,
	BonAppCafeInfoType as CafeInfoType,
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
import {getTrimmedTextWithSpaces, parseHtml} from '../../lib/html'
import {AllHtmlEntities} from 'html-entities'
import {toLaxTitleCase} from 'titlecase'
import {tracker} from '../../analytics'
import bugsnag from '../../bugsnag'
import delay from 'delay'
import retry from 'p-retry'
const CENTRAL_TZ = 'America/Winnipeg'

const bonappMenuBaseUrl = 'http://legacy.cafebonappetit.com/api/2/menus'
const bonappCafeBaseUrl = 'http://legacy.cafebonappetit.com/api/2/cafes'
const fetchJsonQuery = (url, query) =>
	fetchJson(`${url}?${qs.stringify(query)}`)
const entities = new AllHtmlEntities()

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
	cafeId: string,
	ignoreProvidedMenus?: boolean,
	loadingMessage: string[],
	name: string,
}
type State = {
	errormsg: ?string,
	loading: boolean,
	refreshing: boolean,
	now: momentT,
	cafeInfo: ?CafeInfoType,
	cafeMenu: ?MenuInfoType,
}

export class BonAppHostedMenu extends React.PureComponent<Props, State> {
	state = {
		errormsg: null,
		loading: true,
		refreshing: false,
		now: moment.tz(CENTRAL_TZ),
		cafeMenu: null,
		cafeInfo: null,
	}

	componentWillMount() {
		this.fetchData(this.props).then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	componentWillReceiveProps(newProps: Props) {
		if (this.props.cafeId !== newProps.cafeId) {
			this.fetchData(newProps)
		}
	}

	retry = () => {
		this.fetchData(this.props).then(() => {
			this.setState(() => ({loading: false, errormsg: ''}))
		})
	}

	requestMenu = (cafeId: string) => () =>
		fetchJsonQuery(bonappMenuBaseUrl, {cafe: cafeId})
	requestCafe = (cafeId: string) => () =>
		fetchJsonQuery(bonappCafeBaseUrl, {cafe: cafeId})

	fetchData = async (props: Props) => {
		let cafeMenu: ?MenuInfoType = null
		let cafeInfo: ?CafeInfoType = null

		try {
			;[cafeMenu, cafeInfo] = await Promise.all([
				retry(this.requestMenu(props.cafeId), {retries: 3}),
				retry(this.requestCafe(props.cafeId), {retries: 3}),
			])
		} catch (error) {
			if (error.message === "JSON Parse error: Unrecognized token '<'") {
				this.setState(() => ({errormsg: BONAPP_HTML_ERROR_CODE}))
			} else {
				tracker.trackException(error.message)
				bugsnag.notify(error)
				this.setState(() => ({errormsg: error.message}))
			}
		}

		this.setState(() => ({cafeMenu, cafeInfo, now: moment.tz(CENTRAL_TZ)}))
	}

	refresh = async (): any => {
		const start = Date.now()
		this.setState(() => ({refreshing: true}))

		await this.fetchData(this.props)

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		this.setState(() => ({refreshing: false}))
	}

	findCafeMessage(cafeId: string, cafeInfo: CafeInfoType, now: momentT) {
		const actualCafeInfo = cafeInfo.cafes[cafeId]
		if (!actualCafeInfo) {
			return 'BonApp did not return a menu for that café'
		}

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
		cafeId: string,
		ignoreProvidedMenus: boolean,
		foodItems: MenuItemContainerType,
	}) {
		const {cafeMenu, cafeId, ignoreProvidedMenus, foodItems} = args

		// We hard-code to the first day returned because we're only requesting
		// one day. `cafes` is a map of cafe ids to cafes, but we only request one
		// cafe at a time, so we just grab the one we requested.
		const dayparts = cafeMenu.days[0].cafes[cafeId].dayparts

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
			const err = new Error(
				`Something went wrong loading BonApp cafe #${this.props.cafeId}`,
			)
			tracker.trackException(err)
			bugsnag.notify(err)

			const msg = 'Something went wrong. Email odt@stolaf.edu to let them know?'
			return <NoticeView text={msg} />
		}

		const {cafeId, ignoreProvidedMenus = false} = this.props
		const {now, cafeMenu, cafeInfo} = this.state

		// We grab the "today" info from here because BonApp returns special
		// messages in this response, like "Closed for Christmas Break"
		const specialMessage = this.findCafeMessage(cafeId, cafeInfo, now)

		// prepare all food items from bonapp for rendering
		const foodItems = this.prepareFood(cafeMenu)

		const meals = this.getMeals({
			foodItems,
			ignoreProvidedMenus,
			cafeId,
			cafeMenu,
		})

		return (
			<FancyMenu
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
