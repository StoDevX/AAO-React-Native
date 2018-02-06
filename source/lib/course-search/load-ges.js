// @flow

import {GE_DATA} from './urls'
import * as storage from '../storage'

export async function loadGEs(): Promise<Array<string>> {
  const remoteGes = await fetchJson(GE_DATA).catch(() => [])
  const storedGes = await storage.getValidGes()
  if (remoteGes !== storedGes || storedGes.length === 0) {
    storage.setValidGes(remoteGes)
    return remoteGes
  } else {
    return storedGes
  }

}
