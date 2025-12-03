import { ImageCard } from '../../image-search/ImageCard'
import { type Record } from '/components/apis/beehive'
import { Chip } from '@mui/material'
import { parseTimestamp, parseFilename } from './parsers'


type Props = {
  data: Record[]
}


function groupByDebugSets(records: Record[]) {
  const items = records.sort((a, b) => {
    const t1 = parseFilename(a.meta.filename).datetime
    const t2 = parseFilename(b.meta.filename).datetime

    return parseTimestamp(t1) > parseTimestamp(t2) ? 1 : -1
  })

  const groups = []
  let group = []

  items?.forEach((record) => {
    const {meta} = record
    const {filename} = meta

    const parsed = parseFilename(filename)
    if (parsed.isDebug) {
      groups.push(group)
      group = []
      group.push(record)
    } else { // regular
      group.push(record)
    }
  })

  return groups
}


function renderGroup(group: Record[]) {
  return (
    <div className="flex">
      {group.map((record, i) => {
        const {meta, timestamp} = record
        const {filename} = meta

        const {pan, tilt, zoom, label, confidence, datetime, isDebug} = parseFilename(filename)
        const imageTimestamp = parseTimestamp(datetime)

        return (
          <div key={i} style={{marginRight: 25, marginBottom: 25}}>
            <h3>{
              isDebug ?
                <>
                  <div className="flex justify-between">
                    <div>Debug</div>
                    <div>{`(${pan}°, ${tilt}°, ${zoom}x)`}</div>
                  </div>
                  <div className="flex justify-between">
                    <div></div>
                    <small>&nbsp;</small>
                  </div>
                </> :
                <>
                  <div className="flex justify-between">
                    <Chip label={`${label}`} color="primary" variant="filled" />
                    <div>{`(${pan}°, ${tilt}°, ${zoom}x)`}</div>
                  </div>
                  <div className="flex justify-between">

                    <small style={{marginLeft: 8}}>{confidence && `${confidence} confidence`}</small>
                  </div>
                </>
            }
            </h3>
            {/* <small>{filename}</small><br/> */}
            <ImageCard obj={{...record, link: record.value}} />
            <div className="flex justify-between">
              <small className="muted">{new Date(timestamp).toLocaleString()}</small>
              <small>{new Date(imageTimestamp).toLocaleString()}</small>
            </div>
          </div>
        )
      })}
    </div>
  )
}


export default function PTZYolo(props: Props) {
  const {data} = props

  const groups = groupByDebugSets(data)

  return (
    <>
      {groups?.map((records, i) => {
        return (
          <div key={i}>
            {renderGroup(records)}
          </div>
        )
      })}
    </>
  )
}