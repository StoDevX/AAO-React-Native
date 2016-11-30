// @flow
import type {BuildingType} from '../views/building-hours/types'

const Su = 'Su'
const Mo = 'Mo'
const Tu = 'Tu'
const We = 'We'
const Th = 'Th'
const Fr = 'Fr'
const Sa = 'Sa'

export const buildingHours: BuildingType[] = [
  {
    name: 'The Cage',
    image: 'cage',
    category: 'Food',
    namedSchedule: [
      {
        title: 'Kitchen',
        notes: 'The kitchen stops cooking at 8 p.m.',
        hours: [
          {days: [Mo, Tu, We, Th], from: '7:30am', to: '8:00pm'},
          {days: [Fr], from: '7:30am', to: '8:00pm'},
          {days: [Sa], from: '9:00am', to: '8:00pm'},
          {days: [Su], from: '9:00am', to: '8:00pm'},
        ],
      },
      {
        title: 'Late Night',
        hours: [
          {days: [Mo, Tu, We, Th], from: '8:00pm', to: '11:00pm'},
          {days: [Su], from: '8:00pm', to: '11:00pm'},
        ],
      },
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'The Pause Kitchen',
    image: 'pause-kitchen',
    category: 'Food',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '10:30am', to: '12:00am'},
      {days: [Fr, Sa], from: '10:30am', to: '2:00am'},
      {days: [Su], from: '10:30am', to: '12:00am'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Stav Hall',
    image: 'stav',
    category: 'Food',
    namedSchedule: [
      {
        title: 'Breakfast',
        hours: [
          {days: [Mo, Tu, We, Th, Fr, Sa], from: '7:00am', to: '9:45am'},
          {days: [Su], from: '8:30am', to: '10:15am'},
        ],
      },
      {
        title: 'Lunch',
        hours: [
          {days: [Mo, Tu, We, Th, Fr], from: '10:30am', to: '2:00pm'},
          {days: [Sa, Su], from: '11:00am', to: '1:30pm'},
        ],
      },
      {
        title: 'Dinner',
        hours: [
          {days: [Mo, Tu, We, Th, Fr, Sa, Su], from: '4:30pm', to: '7:30pm'},
        ],
      },
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Bag Lunch Line',
    category: 'Food',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '2:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Bookstore',
    image: 'bookstore',
    category: 'Supplies and Books',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '8:00am', to: '5:00pm'},
      {days: [Sa], from: '10:00am', to: '4:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Convenience Store',
    image: 'convenience',
    category: 'Supplies and Books',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '8:00am', to: '8:00pm'},
      {days: [Sa], from: '10:00am', to: '8:00pm'},
      {days: [Su], from: '12:00pm', to: '4:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Post Office',
    image: 'post-office',
    category: 'Mail and Packages',
    closedForCommunityTime: true,
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '8:00am', to: '5:00pm'},
      {days: [Sa], from: '10:00am', to: '1:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [
        {days: [Mo, Tu, We, Th], from: '7:30am', to: '4:30pm'},
        {days: [Fr], from: '7:30am', to: '12:00pm'},
      ],
    },
  },

  {
    name: 'Print Center',
    image: 'print',
    category: 'Mail and Packages',
    closedForCommunityTime: true,
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '8:00am', to: '5:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [
        {days: [Mo, Tu, We, Th], from: '7:30am', to: '4:30pm'},
        {days: [Fr], from: '7:30am', to: '12:00pm'},
      ],
    },
  },

  {
    name: 'DiSCO',
    image: 'disco',
    category: 'Libraries',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '10:00am', to: '5:00pm'},
      {days: [Mo, Tu, We, Th], from: '7:00pm', to: '9:00pm'},
      {days: [Fr], from: '10:00am', to: '5:00pm'},
      {days: [Su], from: '1:00pm', to: '5:00pm'},
      {days: [Su], from: '7:00pm', to: '9:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Halvorson Music Library',
    image: 'halvorson',
    category: 'Libraries',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '7:45am', to: '11:00pm'},
      {days: [Fr], from: '7:45am', to: '8:00pm'},
      {days: [Sa], from: '9:00am', to: '6:00pm'},
      {days: [Su], from: '12:00pm', to: '11:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },


  {
    name: 'IT Helpdesk',
    category: 'Libraries',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '7:45am', to: '11:00pm'},
      {days: [Fr], from: '7:45am', to: '5:00pm'},
      {days: [Su], from: '1:30pm', to: '11:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [
        {days: [Mo, Tu, We, Th], from: '7:30am', to: '4:30pm'},
        {days: [Fr], from: '7:45am', to: '12:00pm'},
      ],
    },
  },

  {
    name: 'Rølvaag Library',
    image: 'rolvaag-library',
    category: 'Libraries',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '7:45am', to: '2:00am'},
      {days: [Fr], from: '7:45am', to: '9:00pm'},
      {days: [Sa], from: '9:00am', to: '9:00pm'},
      {days: [Su], from: '12:00pm', to: '2:00am'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [
        {days: [Mo, Tu, We, Th], from: '7:45am', to: '4:30pm'},
        {days: [Fr], from: '7:45am', to: '12:00pm'},
      ],
    },
  },

  {
    name: 'Rølvaag Reference Desk',
    category: 'Libraries',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '10:00am', to: '5:00pm'},
      {days: [Mo, Tu, We, Th], from: '7:00pm', to: '9:00pm'},
      {days: [Fr], from: '10:00am', to: '5:00pm'},
      {days: [Su], from: '1:30pm', to: '5:00pm'},
      {days: [Su], from: '7:00pm', to: '9:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Skoglund',
    image: 'skoglund',
    category: 'Gym',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '6:30am', to: '10:45pm'},
      {days: [Fr], from: '6:30am', to: '8:45pm'},
      {days: [Sa], from: '9:00am', to: '8:45pm'},
      {days: [Su], from: '12:00pm', to: '10:45pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Skoglund Pool',
    category: 'Gym',
    namedSchedule: [
      {
        title: 'Fac/Staff Swim',
        hours: [
          {days: [Mo, Tu, We, Th, Fr, Sa], from: '7:00am', to: '9:45am'},
          {days: [Su], from: '8:30am', to: '10:15am'},
        ],
      },
      {
        title: 'Lap Swim',
        hours: [
          {days: [Mo, Tu, We, Th, Fr], from: '12:45pm', to: '2:00pm'},
          {days: [Mo, Tu, We, Th, Fr], from: '6:00pm', to: '8:00pm'},
        ],
      },
      {
        title: 'Open Swim',
        hours: [
          {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '2:00pm'},
        ],
      },
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'STORP',
    category: 'Gym',
    schedule: [
      {days: [Mo, Th, Fr], from: '4:00pm', to: '6:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Tom Porter Weight Room',
    category: 'Gym',
    image: 'tom-porter',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '10:00am', to: '8:00pm'},
      {days: [Fr], from: '7:00am', to: '5:00pm'},
      {days: [Sa], from: '8:00am', to: '9:00pm'},
      {days: [Su], from: '12:00pm', to: '9:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Tostrud Climbing Wall',
    category: 'Gym',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '6:30am', to: '10:45pm'},
      {days: [Fr], from: '6:30am', to: '8:45pm'},
      {days: [Sa], from: '9:00am', to: '8:45pm'},
      {days: [Su], from: '12:00pm', to: '10:45pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Wellness Center',
    image: 'wellness',
    category: 'Health and Wellness',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '10:00am', to: '5:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [
        {days: [Mo], from: '12:00pm', to: '1:00pm'},
        {days: [We], from: '12:00pm', to: '1:00pm'},
        {days: [Th], from: '4:00pm', to: '5:30am'},
      ],
    },
  },

  {
    name: 'Health Center',
    category: 'Health and Wellness',
    closedForCommunityTime: true,
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '9:00am', to: '11:30am'},
      {days: [Mo, Tu, We, Th, Fr], from: '1:00pm', to: '4:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Alumni Hall',
    image: 'alumni-hall',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '5:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Holland Hall',
    category: 'Under Construction',
    schedule: [],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Boe Chapel',
    image: 'boe',
    category: 'Academia',
    namedSchedule: [
      {
        title: 'Building',
        hours: [
          {days: [Mo, Tu, We, Th], from: '7:00am', to: '12:00am'},
          {days: [Fr], from: '7:00am', to: '9:30pm'},
          {days: [Sa], from: '8:00am', to: '9:30pm'},
          {days: [Su], from: '8:00am', to: '12:00am'},
        ],
      },
      {
        title: 'Daily Chapel',
        hours: [
          {days: [Mo, We, Fr], from: '10:10am', to: '10:30am'},
          {days: [Tu], from: '11:10am', to: '11:30am'},
          {days: [Th], from: '11:00am', to: '11:15am'},
        ],
      },
    ],
    interimSchedule: [
      {
        title: 'Building',
        hours: [
          {days: [Mo, Tu, We, Th], from: '7:00am', to: '12:00am'},
          {days: [Fr], from: '7:00am', to: '9:30pm'},
          {days: [Sa], from: '8:00am', to: '9:30pm'},
          {days: [Su], from: '8:00am', to: '12:00am'},
        ],
      },
      {
        title: 'Daily Chapel',
        hours: [
          {days: [Mo, Tu, We, Th, Fr], from: '10:10am', to: '10:30am'},
        ],
      },
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Buntrock Commons',
    image: 'buntrock',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '7:00am', to: '12:00am'},
      {days: [Fr, Sa], from: '7:00am', to: '2:00am'},
      {days: [Su], from: '7:00am', to: '12:00am'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Christiansen (CHM)',
    image: 'christiansen',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '12:00am'},
      {days: [Sa, Su], from: '8:00am', to: '12:00am'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Dittmann Center',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '12:00am'},
      {days: [Sa], from: '8:00am', to: '12:00am'},
      {days: [Su], from: '10:00am', to: '12:00am'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Hall of Music (HOM)',
    image: 'hall-of-music',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '12:00am'},
      {days: [Sa, Su], from: '8:00am', to: '12:00am'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Old Main',
    image: 'old-main',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '7:00am', to: '9:45pm'},
      {days: [Fr], from: '7:00am', to: '6:00pm'},
      {days: [Sa, Su], from: '8:00am', to: '6:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Regents Hall',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '12:00am'},
      {days: [Sa, Su], from: '8:00am', to: '12:00am'},
    ],
    breakSchedule: {
      fall: [
        {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '12:00am'},
        {days: [Sa, Su], from: '8:00am', to: '12:00am'},
      ],
      thanksgiving: [
        {days: [Tu, We], from: '7:00am', to: '10:00pm'},
        {days: [Sa], from: '8:00pm', to: '5:00pm'},
        {days: [Su], from: '8:00am', to: '12:00am'},
      ],
      winter: [
        {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '8:00pm'},
      ],
      interim: [
        {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '5:00pm'},
      ],
      spring: [
        {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '5:00pm'},
        {days: [Sa], from: '8:00pm', to: '5:00pm'},
        {days: [Su], from: '8:00am', to: '12:00am'},
      ],
      easter: [
        {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '5:00pm'},
        {days: [Sa], from: '8:00pm', to: '5:00pm'},
        {days: [Su], from: '8:00am', to: '12:00am'},
      ],
      summer: [
        {days: [Mo, Tu, We, Th], from: '7:00am', to: '10:00pm'},
        {days: [Fr], from: '7:00am', to: '8:00pm'},
        {days: [Sa, Su], from: '10:00am', to: '10:00pm'},
      ],
    },
  },

  {
    name: 'Skifter Hall',
    image: 'skifter-studioa',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '12:00am'},
      {days: [Sa, Su], from: '8:00am', to: '12:00am'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Theatre Building',
    image: 'theater',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th, Fr], from: '7:00am', to: '12:00am'},
      {days: [Sa, Su], from: '9:00am', to: '12:00am'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'Tomson Hall',
    image: 'tomson',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '7:00am', to: '11:00pm'},
      {days: [Fr], from: '7:00am', to: '8:00pm'},
      {days: [Sa], from: '8:00am', to: '8:00pm'},
      {days: [Su], from: '8:00am', to: '11:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },

  {
    name: 'World Language Center',
    category: 'Academia',
    schedule: [
      {days: [Mo, Tu, We, Th], from: '8:00am', to: '9:00pm'},
      {days: [Fr], from: '8:00am', to: '5:00pm'},
      {days: [Sa], from: '10:00am', to: '3:00pm'},
      {days: [Su], from: '4:00pm', to: '10:00pm'},
    ],
    breakSchedule: {
      fall: [],
      thanksgiving: [],
      winter: [],
      interim: [],
      spring: [],
      easter: [],
      summer: [],
    },
  },
]
