// @flow
import {stringify} from 'querystring'
import {status, json} from '../../lib/fetch'

type ObjType = {[key: string]: any};

export const fetch = (...args: any[]) => global.fetch(...args).then(status)

export const fetchWithQuery = (url: string, query?: ObjType) => fetch(`${url}?${stringify(query)}`)

export const fetchJson = (url: string, query?: ObjType) => fetchWithQuery(url, query).then(json)
