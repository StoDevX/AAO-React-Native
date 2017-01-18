/**
 * @flow
 * parseListOfTermsFromDom simply parses an htmlparser2 dom, and returns
 * the terms that it finds within the markup.
 */

import {cssSelect} from '../html'

export function parseListOfTermsFromDom(dom: mixed): number[] {
  return cssSelect('[name=searchyearterm]', dom)[0]
    .children
    .filter(node => node.type === 'tag' && node.name === 'option')
    .map(opt => Number(opt.attribs.value))
}
