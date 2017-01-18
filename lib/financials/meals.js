// @flow
import {loadLoginCredentials} from '../login'
import buildFormData from '../formdata'
import {parseHtml, cssSelect} from '../html'
import {OLECARD_AUTH_URL} from './urls'
import type {MealsShapeType} from './types'

// TODO: come up with a better story around auth for olecard
export async function getWeeklyMealsRemaining(): Promise<MealsShapeType> {
  const {username, password} = await loadLoginCredentials()
  if (!username || !password) {
    throw new Error('not logged in!')
  }

  const form = buildFormData({
    username: username,
    password: password,
  })
  const fetchResult = await fetch(OLECARD_AUTH_URL, {method: 'POST', body: form})

  try {
    const dom = parseHtml(fetchResult.body)
    const data = cssSelect('.accountrow', dom)
    const values = data.map(item => {
      return item.next.next.children[0].data
    })
    return {weeklyMeals: values[4], dailyMeals: values[3]}
  } catch (error) {
    console.log('error in fetching meal data')
    return {weeklyMeals: null, dailyMeals: null}
  }
}
