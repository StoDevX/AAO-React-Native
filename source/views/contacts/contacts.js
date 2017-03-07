/**
 * @flow
 * All About Olaf
 * iOS Contact page
 */

import React from 'react'
import SimpleListView from '../components/listview'
import ContactCard from './card'
import {data as numbers} from '../../../docs/contact-info.json'

export default function ContactView() {
  return (
    <SimpleListView data={numbers}>
      {data => (
        <ContactCard
          title={data.title}
          text={data.text}
          phoneNumber={data.phoneNumber}
          buttonText={data.buttonText}
        />
      )}
    </SimpleListView>
  )
}
