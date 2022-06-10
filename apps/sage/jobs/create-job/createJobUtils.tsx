
import { pick } from 'lodash'

export function queryData(data: object[], query: string, cols: string[]) : object[] {
  return data.filter(row =>
    Object.values(pick(row, cols))
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}
