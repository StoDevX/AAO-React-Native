// @flow
import querystring from 'qs'

type ObjType = {[key: string]: any};
export const fetchJson = (url: string, query?: ObjType) => fetch(`${url}?${querystring.stringify(query)}`).then(response => response.json())
