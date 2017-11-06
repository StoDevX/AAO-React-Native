// @flow

import jest from 'danger-plugin-jest'
import path from 'path'

jest({testResultsJsonPath: path.resolve(__dirname, 'logs/jest.json')})
