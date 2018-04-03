const { send } = require('micro')
const { router, get } = require('microrouter')
const got = require('got')

const notfound = (req, res) => send(res, 404, {type: 'error', payload: 'Route not found'})

const menu = async (req, res) => {
  const bonappMenuBaseUrl = 'http://legacy.cafebonappetit.com/api/2/menus'
  const bonappCafeBaseUrl = 'http://legacy.cafebonappetit.com/api/2/cafes'

  console.log('in thing')

  try {
    let resp = await got.get(bonappMenuBaseUrl, {json: true, query: {cafe: req.params.cafeId}})
    return send(res, 200, resp.body)
  } catch (err) {
    return send(res, 200, {error: true, message: err.message})
  }
}

module.exports = router(
  get('/menu/:cafeId', menu),
  get('/*', notfound),
)
