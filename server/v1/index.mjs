import koaBody from 'koa-bodyparser'
import apollo from 'apollo-server-koa'
import {schema} from './graphql'

import Router from 'koa-router'
import {menu, cafe} from './menu'

const { graphqlKoa, graphiqlKoa } = apollo
const api = new Router({prefix: '/v1'})

// food
api.get('/food/menu/:cafeId', menu)
api.get('/food/cafe/:cafeId', cafe)

// graphql
api.post('/graphql', koaBody(), graphqlKoa({ schema }));
api.get('/graphql', graphqlKoa({ schema }));
api.get('/graphiql', graphiqlKoa({ endpointURL: '/api/v1/graphql' }));

export {api as v1}
