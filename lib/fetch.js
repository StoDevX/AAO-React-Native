module.exports.status = function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

module.exports.json = function parseJSON(response) {
  return response.json()
}

module.exports.text = function returnText(response) {
  return response.text()
}
