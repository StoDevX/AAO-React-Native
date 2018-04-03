import graphqlTools from 'graphql-tools'
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
  type Query { books: [Book] }

  type CorIcon {
    id: ID!
    label: string
    sort: number
  }

  type MenuItem {
    id: ID!
    label: string
    description: string
    cor: [CorIcon]
    price: string
    sizes: [string]
    nutrition: nutrition
    special: boolean
    tier: number
    rating: string
    connector: string
    options: [Option]
    station: Station
    substation: SubStation
    monotony: Monotony
  }

  type Option {}

  type Monotony {}

  type SubStation {
    id: ID!
    label: string
    sort: string
    items: [MenuItem]
  }

  type Station {
    id: ID!
    sort: string
    label: string
    price: string
    note: string
    items: [MenuItem]
  }

  type MenuPart {
    id: ID!
    start: string
    end: string
    label: string
    abbreviation: string
    stations: [Station]
  }

  type Menu {
    id: ID!
    name: string!
    parts: [MenuPart]
  }

  type Cafe {
    menu: Menu
  }

  type Book { title: String, author: String }

  type Mutation {}

  schema {
    query: Query
    mutation: Mutation
  }
`;

// The resolvers
const resolvers = {
  Query: { books: () => books },
};

// Put together a schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export {schema}
