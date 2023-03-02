import settings from '/apps/project/settings'
import { msToTime } from '../utils/units'

const FAIL_THRES = settings.elapsedThresholds.fail
const WARNING_THRES = settings.elapsedThresholds.warning



type LastUpdatedProps = {
  elapsedTimes: {[device: string]: number }
}

export default function NodeLastReported(props: LastUpdatedProps) : JSX.Element {
  const {elapsedTimes} = props

  return (
    <div>
      {Object.keys(elapsedTimes)
        .map(host =>
          <div key={host}>
            {host}: <b className={
              getColorClass(elapsedTimes[host], FAIL_THRES, WARNING_THRES, 'success font-bold')
            }>
              {msToTime(elapsedTimes[host])}
            </b>
          </div>
        )}
    </div>
  )
}

export function getColorClass(val, severe: number, warning: number, defaultClass?: string) {
  if (!val || val >= severe) return 'severe font-bold'
  else if (val > warning) return 'warning font-bold'
  else if (defaultClass) return defaultClass
  return ''
}