import { useState, useEffect } from 'react'
import { useMatch } from 'react-router-dom'

import * as ECR from '/components/apis/ecr'
import Auth from '/components/auth/auth'



export default function useWithBuildStatus<T>() {
  const path = useMatch('*').pathname
  const view = path.split('/')[2]

  const [isDone, setIsDone] = useState(false)
  const [data, setData] = useState<T>()

  // effect for updating build status
  useEffect(() => {

    // must be signed in to fetch build status
    if (!Auth.isSignedIn) return

    if (!data || isDone || view =='explore') return

    for (const app of data) {
      ECR.getBuildStatus(app)
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
              buildUrl: `${status.url}console`
            }

            return newRows
          })
        })
        .catch(error => {
          // pass
        })
    }

    setIsDone(true)
  }, [isDone, data, view])

  return [data, setData]
}

