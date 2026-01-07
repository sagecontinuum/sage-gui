import { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'


import * as BK from '/components/apis/beekeeper'
import * as SES from '/components/apis/ses'
import { Card, CardViewStyle } from '/components/layout/Layout'

import { Sidebar } from '/components/layout/Layout'

import Filter from '/apps/sage/common/FacetFilter'

import { chain, countBy } from 'lodash'
import { schemeCategory10 } from 'd3-scale-chromatic'

import { Chart as ChartJS } from 'chart.js'
import 'chartjs-adapter-date-fns'

import { useParams } from 'react-router'


type JobWithProjectList = SES.Job & {[project: string]: BK.Node['project'][]}


const histogramConfig =  {
  type: 'bar',
  options: {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Frequency'
        }
      }
    }
  }
}


const getFacets = (data, name) =>
  chain(data)
    .countBy(name) // returns string 'undefined' if undefined
    .map((count, name) =>
      ({name: name == 'undefined' || !name || !name.length ? 'N/A' : name, count})
    )
    .value()


const getJobCounts = (jobs: JobWithProjectList, selected) => {
  let noSubmitTimeCount = 0

  const counts = jobs
    .filter(job => {
      const {last_submitted} = job
      if (!last_submitted) {
        noSubmitTimeCount += 1
        return false
      }

      return true
    })
    .filter(job => {
      return !selected.projects?.length ?
        true : job.projects.some(proj => (selected.projects || []).includes(proj))
    })
    .filter(job => {
      return !selected.users?.length ?
        true : selected.users.some(user => job.user == user)
    })
    .filter(job => {
      return !selected.nodes?.length ?
        true : job.nodes.some(vsn => (selected.nodes || []).includes(vsn))
    })
    .sort(timeCompare)
    .reduce((acc, job) => {
      const {last_submitted} = job

      const date = new Date(last_submitted).toLocaleDateString('en-US')
      const parts = date.split('/')

      const [month, day, year] = parts  // eslint-disable-line @typescript-eslint/no-unused-vars
      const key = `${month}/${year.slice(-2)}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

  console.log('number of jobs with no "last_submitted":', noSubmitTimeCount)

  return counts
}


const timeCompare = (a, b) =>
  a.last_submitted.localeCompare(b.last_submitted)



type FacetItem = {name: string, count: number}

type Facets = {
  [name: string]: {title: string, items: FacetItem[], hide?: boolean}
}

export type Views = 'overview' | 'filters'


export default function MetricsByFilters() {
  const {view = 'overview'} = useParams() as {view: Views}

  // Map your routes to tab values
  const tabValue = location.pathname

  console.log('tabValue', tabValue)

  const chartRef = useRef()
  const [chart, setChart] = useState(null)

  const [facets, setFacets] = useState<Facets>(null)
  const [selected, setSelected] = useState({})

  const [jobs, setJobs] = useState<JobWithProjectList[]>()

  useEffect(() => {

    Promise.all([BK.getNodes(), SES.getJobs()])
      .then(([nodes, jobs]) => {

        const users = getFacets(jobs, 'user')
        const jobNodeArrays = jobs.map(o => o.nodes)
        const nodeCounts = countBy(jobNodeArrays.flat())
        const jobNodes = Object.entries(nodeCounts).map(([name, count]) => ({name, count}))

        const projectMapping = nodes
          .reduce((acc, node) => (
            {...acc, [node.vsn]: node.project}
          ), {})

        const projCounts = jobNodes.reduce((acc, {name, count}) => {
          const proj = projectMapping[name]
          return {
            ...acc,
            [proj]: (acc[proj] || 0) + count
          }
        }, {})

        const projects = Object.entries(projCounts)
          .map(([name, count]) => ({name, count}))


        // add projects to jobs, for use in filtering
        jobs = jobs.map(job => ({
          ...job,
          projects: [...new Set(job.nodes.map(vsn => projectMapping[vsn]))]
        }))
        setJobs(jobs)

        setFacets({
          projects: {title: 'Projects', items: projects},
          users: {title: 'Users', items: users},
          nodes: {title: 'Nodes', items: jobNodes}
        })
      })
  }, [view])


  useEffect(() => {
    if (!jobs) return

    const counts = getJobCounts(jobs, selected)

    const datasets = {
      labels: Object.keys(counts),
      datasets: [{
        label: 'Job Submissions per Month',
        data: Object.values(counts),
        backgroundColor: schemeCategory10[0]
      }]
    }

    const config = {
      ...histogramConfig,
      data: {...datasets}
    }

    if (chart) chart.destroy()

    const c = new ChartJS(chartRef.current, config)
    setChart(c)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, jobs])


  /* todo(nc): task statistics
  useEffect(() => {
    BH.getData({
      start: '-1y',
      filter: {
        name: 'sys.scheduler.status.plugin.queued'
      },
      experimental_func: 'count'
    })
  }, [])
  */


  const handleFilter = (evt, facet, val) => {
    const {checked} = evt.target

    setSelected(prev => {
      const prevFilters = prev[facet] || []
      const selected = checked ? [...prevFilters, val] : prevFilters.filter(v => v !== val)
      return {...prev, [facet]: selected}
    })
  }

  const handleSelectAll = (evt, facet, vals) => {
    const checked = evt.target.checked
    setSelected(prev =>
      ({...prev, [facet]: checked ? vals : []})
    )
  }


  return (
    <Root className="flex">
      {CardViewStyle}


      <Sidebar width="250px" style={{padding: '10px 0 100px 0'}}>
        {facets && Object.keys(facets)
          .map(facet => {
            const {title, items} = facets[facet]

            return (
              <Filter
                key={title}
                title={title}
                checked={selected[facet] || []}
                onCheck={(evt, val) => handleFilter(evt, facet, val)}
                onSelectAll={(evt, vals) => handleSelectAll(evt, facet, vals)}
                defaultShown={25}
                hideSearchIcon={true}
                data={items}
                showSearchBox={false}
              />
            )
          })
        }
      </Sidebar>

      <Main>
        <Card>
          <h2>Job Metrics</h2>
          <canvas ref={chartRef}></canvas>
        </Card>
      </Main>
    </Root>
  )
}


const Root = styled.div`
`


const Main = styled.main`
  width: 100%;
  margin: 2em;
`