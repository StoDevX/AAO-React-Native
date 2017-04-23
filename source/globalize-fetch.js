// @flow

global.rawFetch = global.fetch

function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    let error = new Error(response.statusText) // attach the original response to the thrown error
    ;(error: any).response = response
    throw error
  }
}

function json(response) {
  return response.json()
}

// make fetch() calls throw if the server returns a non-200 status code
global.fetch = (...args: any[]) => global.rawFetch(...args).then(status)

// add a global fetchJson wrapper
global.fetchJson = (...args: any[]) => fetch(...args).then(json)
