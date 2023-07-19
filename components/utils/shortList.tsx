/**
 * currently unused helpers (for prototyping)
 *
 */

import { Link } from 'react-router-dom'

function shortList(
  data: Array<any>,
  val: string | ((obj: any) => JSX.Element),
  max: number = 5
) : JSX.Element[] {

  return data.slice(0, max)
    .map((o, i) =>
      <span key={i}>
        {typeof val == 'string' ? o[val] : val(o)}
        {i < data.length - 1 ? ' | ' : ''}
      </span>
    )
}


const andMoreBtn = (data: Array<any>, to: string, max: number = 5) : JSX.Element =>
  <>
    {data.length > max &&
      <>, <Link to={to} replace>{data.length - max} more...</Link></>}
  </>
