// @flow
import {parseString} from 'xml2js'
import pify from 'pify'
import type {FeedResponseType} from './types'

export const parseXml: ((text: string) => FeedResponseType) = pify(parseString)
