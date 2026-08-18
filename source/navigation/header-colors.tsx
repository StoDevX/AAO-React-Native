/**
 * Header color utilities for tile-colored navigation headers.
 *
 * Each screen gets a solid colored header background based on its
 * homescreen tile gradient colors.
 */

import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import {AllViews} from '../features/views'
import type {NativeStackNavigationOptions} from 'expo-router'

type ScreenHeaderColors = {
	backgroundColor: string
	tintColor: '#fff' | '#000'
}

/**
 * Converts a Display P3 CSS color to hex.
 */
function p3ToHex(p3Css: string): string {
	let match = p3Css.match(/color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/iu)
	if (!match) {
		return '#888888'
	}
	let [, rStr, gStr, bStr] = match
	let [r, g, b] = [rStr, gStr, bStr].map((s) => {
		let v = Number(s)
		let clamped = Math.max(0, Math.min(1, v))
		return Math.round(clamped * 255)
	})
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Normalize a route path to an Expo Router route name.
 * Strips leading slash and extracts the first segment.
 */
function normalizeRouteName(path: unknown): string {
	let pathStr = String(path)
	let normalized = pathStr.startsWith('/') ? pathStr.slice(1) : pathStr
	let firstSegment = normalized.split('/')[0]
	return firstSegment
}

/**
 * Determines whether white or black text has better contrast against a
 * Display P3 background color.
 */
function getTintColorForP3(p3Css: string): '#fff' | '#000' {
	let match = p3Css.match(/color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/iu)
	if (!match) {
		return '#fff'
	}

	let [, rStr, gStr, bStr] = match
	let [r, g, b] = [rStr, gStr, bStr].map(Number)

	let toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
	let luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

	return luminance > 0.5 ? '#000' : '#fff'
}

/**
 * Build a map from screen name to header colors,
 * derived from homescreen tile definitions.
 */
function buildScreenColorMap(): Map<string, ScreenHeaderColors> {
	let map = new Map<string, ScreenHeaderColors>()
	for (let view of AllViews()) {
		if (view.type === 'view') {
			let [, outer] = view.gradient
			let tintColor = getTintColorForP3(outer)
			let routeName = normalizeRouteName(view.view)
			map.set(routeName, {
				backgroundColor: p3ToHex(outer),
				tintColor,
			})
		}
	}
	return map
}

const SCREEN_COLORS = buildScreenColorMap()

const styles = StyleSheet.create({
	headerBackground: {
		flex: 1,
	},
})

/**
 * Get header style options for a screen based on its tile color.
 * Uses a solid colored header background.
 */
export function headerColorsFor(screenName: string): Partial<NativeStackNavigationOptions> {
	let colors = SCREEN_COLORS.get(screenName)
	if (!colors) {
		return {}
	}

	return {
		headerTintColor: colors.tintColor,
		headerLargeTitleStyle: {color: colors.tintColor},
		headerBackground: () => (
			<View style={[styles.headerBackground, {backgroundColor: colors.backgroundColor}]} />
		),
	}
}
