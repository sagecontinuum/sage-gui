import { useState, useEffect } from 'react'
import { useRouteMatch } from 'react-router-dom'
import config from '../../../config'
import * as ECR from '../../apis/ecr'



export default function useWithBuildStatus<T>() {
  let { path } = useRouteMatch()
  const view = path.split('/')[2]

  const [isDone, setIsDone] = useState(false)
  const [data, setData] = useState<T>()

  // effect for updating build status
  useEffect(() => {
    if (!data || isDone || view =='explore') return

    for (const app of data) {
      ECR.listBuildStatus(app)
        .then(status => {
          // if (!ref.current) return
          setData(prev => {

            if (!prev) return prev

            // copy to change object ref
            const newRows = [...prev]

            const idx = newRows.findIndex(d => d.id == app.id)
            newRows[idx] = {
              ...newRows[idx],
              isBuilding: status.building,
              buildResult: status.result,
              buildUrl: config.jenkins + status.url.split('/jenkins')[1] + 'console'
            }

            return newRows
          })
        })
    }

    setIsDone(true)
  }, [isDone, data, view])

  return [data, setData]
}

