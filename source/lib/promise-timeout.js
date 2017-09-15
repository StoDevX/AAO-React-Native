export function promiseTimeout(ms, promise) {
  return new Promise(function(resolve, reject) {
    // create a timeout to reject promise if not resolved
    let timer = setTimeout(function() {
      reject(new Error('promise timeout'))
    }, ms)

    promise
      .then(function(res) {
        clearTimeout(timer)
        resolve(res)
      })
      .catch(function(err) {
        clearTimeout(timer)
        reject(err)
      })
  })
}
