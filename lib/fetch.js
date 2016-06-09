export function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

export function json(response) {
  return response.json()
}

export function text(response) {
  return response.text()
}
