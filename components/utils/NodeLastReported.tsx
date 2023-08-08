import settings from '../settings'
import { msToTime } from '../utils/units'

import { NODE_STATUS_RANGE } from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'

const FAIL_THRES = settings.elapsedThresholds.fail
const WARNING_THRES = settings.elapsedThresholds.warning


type LastUpdatedProps = {
  computes: BK.Compute[]
  elapsedTimes: {[device: string]: number }
}

export default function NodeLastReported(props: LastUpdatedProps) : JSX.Element {
  const {computes, elapsedTimes} = props

  if (!computes)
    return <>n/a</>

  return (
    <div>
      {computes
        .map((obj, i) => {
          const {serial_no, name} = obj

          const host = BK.findHostWithSerial(Object.keys(elapsedTimes), serial_no)

          return <div key={i}>
            {name}: <b className={
              elapsedTimes ? getColorClass(elapsedTimes[host], FAIL_THRES, WARNING_THRES, 'success font-bold') : ''
            }>
              {host in (elapsedTimes || {}) ?
                msToTime(elapsedTimes[host]) :
                `no sys.uptime for ${NODE_STATUS_RANGE}`
              }
            </b>
          </div>
        })
      }
    </div>
  )
}

export function getColorClass(val, severe: number, warning: number, defaultClass?: string) : string {
  if (!val || val >= severe) return 'severe font-bold'
  else if (val > warning) return 'warning font-bold'
  else if (defaultClass) return defaultClass
  return ''
}