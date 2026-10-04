import {createLayoutStore} from '../../lib/layout-store'

/// Whether the landing screen draws its categories as tiles or rows, as the
/// reader last picked from its layout menu.
export const useCategoryLayoutStore = createLayoutStore('student-orgs-category-layout', 'list')
