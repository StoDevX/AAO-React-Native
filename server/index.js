const { send } = require('micro')
const { router, get, head } = require('microrouter')
const cache = require('micro-cacheable')
const got = require('got')
const compress = require('micro-compress')

const notfound = (req, res) => send(res, 404, {type: 'error', payload: 'Route not found'})

const menu = async (req, res) => {
  const bonappMenuBaseUrl = 'http://legacy.cafebonappetit.com/api/2/menus'
  const bonappCafeBaseUrl = 'http://legacy.cafebonappetit.com/api/2/cafes'

  try {
    let resp = await got.get(bonappMenuBaseUrl, {json: true, query: {cafe: req.params.cafeId}})
    return resp.body
  } catch (err) {
    return {error: true, message: err.message}
  }
}

module.exports = router(
  get('/menu/:cafeId', cache(24 * 60 * 60 * 1000, menu)),
  get('/cmenu/:cafeId', cache(24 * 60 * 60 * 1000, compress(menu))),
  get('/*', notfound),
)
