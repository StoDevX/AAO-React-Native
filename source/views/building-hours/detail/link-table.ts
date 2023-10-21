import {Platform} from 'react-native'

import {LinkTable as LinkTableAndroid} from './link-table-android'
import {LinkTable as LinkTableIos} from './link-table-ios'

export const LinkTable = Platform.OS === 'ios' ? LinkTableIos : LinkTableAndroid
