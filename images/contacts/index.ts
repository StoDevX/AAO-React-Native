import {Image, type ImageResolvedAssetSource} from 'react-native'
import rawBoeHouse from './optimized/boe-house.jpg'
import rawPauseKitchen from './optimized/pause-kitchen.jpg'
import rawPubsafe from './optimized/pubsafe.jpg'
import rawSafeRide from './optimized/safe-ride.jpg'
import rawSarn from './optimized/sarn.png'

const boeHouse = Image.resolveAssetSource(rawBoeHouse)
const pauseKitchen = Image.resolveAssetSource(rawPauseKitchen)
const pubsafe = Image.resolveAssetSource(rawPubsafe)
const safeRide = Image.resolveAssetSource(rawSafeRide)
const sarn = Image.resolveAssetSource(rawSarn)

export const images = new Map<string, ImageResolvedAssetSource>([
	['boe-house', boeHouse],
	['pause-kitchen', pauseKitchen],
	['pubsafe', pubsafe],
	['safe-ride', safeRide],
	['sarn', sarn],
])
