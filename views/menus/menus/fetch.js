// @flow
import querystring from 'qs'
export const fetchJson = (url, query) => fetch(`${url}?${querystring.stringify(query)}`).then(response => response.json())
