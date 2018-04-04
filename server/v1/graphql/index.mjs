import graphqlTools from 'graphql-tools'
import {getCafe, getCafeMenu, getCafeInfo} from '../menu'
const { makeExecutableSchema } = graphqlTools

// Some fake data
const books = [
  {
    title: "Harry Potter and the Sorcerer's stone",
    author: 'J.K. Rowling',
  },
  {
    title: 'Jurassic Park',
    author: 'Michael Crichton',
  },
];

// The GraphQL schema in string form
const typeDefs = `
  scalar HtmlString
  scalar TimeString24Hour
  scalar DateString

  type Query {
    books: [Book]
    cafe(id: Int): Cafe
    cafes(ids: [Int]): [Cafe]
  }

  type CorIcon {
    id: ID!
    label: String
    sort: Int
  }

  type MenuItem {
    id: ID!
    label: String
    description: String
    cor: [CorIcon]
    price: String
    sizes: [String]
    nutrition: Nutrition
    special: Boolean
    tier: Int
    rating: String
    connector: String
    #options: [Option]
    station: Station
    substation: SubStation
    #monotony: Monotony
  }

  type Nutrition {
    kcal: Int
  }

  #type Option {}

  #type Monotony {}

  type SubStation {
    id: ID!
    label: String
    sort: String
    items: [MenuItem]
  }

  type Station {
    id: ID!
    sort: String
    label: String
    price: String
    note: String
    items: [MenuItem]
  }

  type MenuPart {
    id: ID!
    start: String
    end: String
    label: String
    abbreviation: String
    stations: [Station]
  }

  type Menu @cacheControl(maxAge: 3600) {
    id: ID!
    name: String!
    parts: [MenuPart]
  }

  """
  A café
  """
  type Cafe @cacheControl(maxAge: 3600) {
    menu: Menu
    name: String
    address: String
    city: String
    state: String
    zip: String
    latitude: Float
    longitude: Float
    description: HtmlString
    message: HtmlString
    eod: TimeString24Hour
    timezone: String
    menuType: MenuTypeEnum
    menuHtml: HtmlString
    locationDetail: String
    weeklySchedule: HtmlString
    schedule: [CafeSchedule]
  }

  type CafeSchedule {
    date: DateString
    message: String
    status: CafeScheduleStatusEnum
    shifts: [CafeScheduleShift]
  }

  type CafeScheduleShift {
    id: ID!
    start: TimeString24Hour
    end: TimeString24Hour
    message: String
    label: String
    hide: Boolean
  }

  enum CafeScheduleStatusEnum {
    open
  }

  enum MenuTypeEnum {
    dynamic
  }

  type Book {
    title: String
    author: String
  }

  #type Mutation {}

  schema {
    query: Query
    #mutation: Mutation
  }
`;

const coerceCafeDays = (day) => ({
  date: day.date,
  status: day.status,
  message: day.message,
  shifts: day.dayparts.map(s => ({
    id: s.id,
    message: s.message,
    label: s.label,
    start: s.starttime,
    end: s.endtime,
    hide: s.hide === '1',
  })),
})

const extractCafeInfo = (cafeId) => (data) => {
  let [cafeMenu, cafeInfo] = data
  let cafe = cafeInfo.body.cafes[cafeId]
  let menu = cafeMenu.body.items
  return Object.assign({}, cafe, {
    menuType: cafe.menu_type,
    menuHtml: cafe.menu_html,
    locationDetail: cafe.location_detail,
    weeklySchedule: cafe.weekly_schedule,
    schedule: cafe.days.map(coerceCafeDays),
    menu: menu,
  })
}

// The resolvers
const resolvers = {
  Query: {
    books: () => books,
    cafe: (root, args) => getCafe(args.id).then(extractCafeInfo(args.id)),
    cafes: (root, args) => Promise.all(args.ids.map(id => getCafe(id).then(extractCafeInfo(id)))),
  },
};

// Put together a schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export {schema}
