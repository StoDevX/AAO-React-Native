import koaBody from 'koa-bodyparser'
import apollo from 'apollo-server-koa'
import {schema} from './graphql'

import Router from 'koa-router'
import {menu, cafe} from './menu'
import {dictionary} from './dictionary'

const { graphqlKoa, graphiqlKoa } = apollo
const api = new Router({prefix: '/v1'})

// food
api.get('/food/menu/:cafeId', menu)
api.get('/food/cafe/:cafeId', cafe)

// dictionary
api.get('/dictionary', dictionary)

// graphql
api.post('/graphql', koaBody(), graphqlKoa({ schema, tracing: true, cacheControl: true }));
api.get('/graphql', graphqlKoa({ schema, tracing: true, cacheControl: true }));
api.get('/graphiql', graphiqlKoa({ endpointURL: '/api/v1/graphql' }));

export {api as v1}
