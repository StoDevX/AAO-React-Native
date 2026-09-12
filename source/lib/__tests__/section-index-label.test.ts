import {sectionIndexLabel} from '../section-index-label'

test('builds a sectionIndexLabel modifier config', () => {
	expect(sectionIndexLabel('C')).toEqual({$type: 'sectionIndexLabel', label: 'C'})
})
