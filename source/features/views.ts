import type {Gradient} from '@frogpond/colors'
import type {ImageProps} from '@expo/ui/swift-ui'
import {useRouter} from 'expo-router'

import type {StationId} from './streaming/radio/stations'

type r = typeof useRouter extends () => infer T ? T : never
type href = r extends {push: (href: infer H) => void} ? H : never

/**
 * Symbols drawn for the app rather than shipped with iOS. Each name is a
 * `.symbolset` in `assets/symbols/`, which `plugins/with-custom-symbols` copies
 * into the asset catalog.
 */
export const CUSTOM_SYMBOLS = ['olaf-messenger', 'carletonian'] as const

type CustomSymbol = (typeof CUSTOM_SYMBOLS)[number]

/** An SF Symbol's name, or a custom symbol's. */
export type SymbolName = NonNullable<ImageProps['systemName']> | CustomSymbol

function isCustomSymbol(name: SymbolName): name is CustomSymbol {
	return (CUSTOM_SYMBOLS as readonly string[]).includes(name)
}

/** The `Image` props that draw `name`, wherever its artwork lives. */
export function iconImage(
	name: SymbolName,
): {systemName: NonNullable<ImageProps['systemName']>} | {assetName: CustomSymbol} {
	return isCustomSymbol(name) ? {assetName: name} : {systemName: name}
}

type CommonView = {
	/** The destination's full name, which VoiceOver reads and the screen is titled with. */
	title: string
	icon: SymbolName
	/** The title's typeface, for a view whose own screens use another. */
	titleDesign?: 'serif'
	gradient: Gradient
	disabled?: boolean
	devOnly?: boolean
}

type NativeView = {
	type: 'view'
	view: href
}

type WebLinkView = {
	type: 'url' | 'browser-url'
	url: string
}

/** A radio station, whose tile opens the Now Playing sheet on it. */
type RadioView = {
	type: 'radio'
	station: StationId
}

export type ViewType = CommonView & (NativeView | WebLinkView | RadioView)

/** Whether tapping `view` leaves the app's own screens for a web page. */
export function opensInBrowser(view: ViewType): boolean {
	return view.type === 'url' || view.type === 'browser-url'
}

/** Where tapping `view` goes: a route, a URL, or a station. */
export function viewTarget(view: ViewType): string {
	switch (view.type) {
		case 'view':
			return typeof view.view === 'string' ? view.view : view.view.pathname
		case 'radio':
			return `radio:${view.station}`
		default:
			return view.url
	}
}

/** The views to draw: not disabled, and not for dev mode alone unless it is on. */
export function visibleViews<V extends ViewType>(
	views: ReadonlyArray<V>,
	{isDev}: {isDev: boolean},
): V[] {
	return views.filter((view) => !view.disabled && (isDev || !view.devOnly))
}
