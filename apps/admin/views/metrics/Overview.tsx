import { useEffect, useState } from 'react'
import styled from 'styled-components'

// import * as SES from '/components/apis/ses'
import * as BH from '/components/apis/beehive'
import * as BK from '/components/apis/beekeeper'



export type Views = 'overview' | 'filters'



export default function MetricsOverview() {

  const [text, setText] = useState('loading (this takes awhile)...')

  useEffect(() => {
    async function fetchData() {
      const vsns = await BK.getNodes()
        .then(nodes => {
          return nodes.filter(n => n.project === 'SAGE').map(n => n.vsn)
        })

      const countProm = BH.getPluginCounts({
        start: '2025-01-01T00:00:00Z',
        vsn: vsns.join('|')
      })


      countProm.then(counts => {
        let text = ''

        // Calculate number of unique nodes (by vsn) and total records ("value") by month
        const monthlyStats: Record<string, {
          vsns: Set<string>, totalValue: number, vsnCounts: any, pluginCounts: any, userCounts: any
        }> = {}
        const yearlyStats: Record<string, { totalValue: number, vsns: Set<string> }> = {}
        const userVsns: Record<string, Set<string>> = {}
        const userRecordCounts: Record<string, number> = {}

        for (const rec of counts) {
          const date = new Date(rec.timestamp)
          const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
          const yearKey = `${date.getUTCFullYear()}`

          if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = {
              vsns: new Set(),
              totalValue: 0,
              vsnCounts: {},
              pluginCounts: {},
              userCounts: {}
            }
          }
          monthlyStats[monthKey].vsns.add(rec.meta?.vsn)
          monthlyStats[monthKey].totalValue += Number(rec.value)

          // Yearly stats
          if (!yearlyStats[yearKey]) {
            yearlyStats[yearKey] = {
              totalValue: 0,
              vsns: new Set()
            }
          }
          yearlyStats[yearKey].totalValue += Number(rec.value)
          yearlyStats[yearKey].vsns.add(rec.meta?.vsn)

          // Count per vsn
          const vsn = rec.meta?.vsn
          if (vsn) {
            if (!monthlyStats[monthKey].vsnCounts[vsn]) {
              monthlyStats[monthKey].vsnCounts[vsn] = 0
            }
            monthlyStats[monthKey].vsnCounts[vsn] += rec.value
          }

          // Count per plugin
          const plugin = rec.meta?.plugin
          if (plugin) {
            if (!monthlyStats[monthKey].pluginCounts[plugin]) {
              monthlyStats[monthKey].pluginCounts[plugin] = 0
            }
            monthlyStats[monthKey].pluginCounts[plugin] += rec.value

            // Count per user (extract user from plugin name)
            let user = ''
            const registryMatch = plugin.match(/^registry.sagecontinuum.org\/([^/]+)\//)
            if (registryMatch) {
              user = registryMatch[1]
            } else {
              // fallback: user is the first part before '/'
              const parts = plugin.split('/')
              user = parts[0]
            }
            if (!monthlyStats[monthKey].userCounts[user]) {
              monthlyStats[monthKey].userCounts[user] = 0
            }
            monthlyStats[monthKey].userCounts[user] += rec.value

            // Track vsns used by each user
            if (!userVsns[user]) {
              userVsns[user] = new Set()
            }
            if (vsn) {
              userVsns[user].add(vsn)
            }

            // Track total records per user
            if (!userRecordCounts[user]) {
              userRecordCounts[user] = 0
            }
            userRecordCounts[user] += Number(rec.value)
          }
        }

        // Print results
        text = 'Monthly Job Metrics:\n'
        Object.entries(monthlyStats)
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([month, stats]) => {
            text += `Month: ${month}, Nodes: ${stats.vsns.size}, Records: ${stats.totalValue.toLocaleString()}\n`
          })

        // Print yearly stats
        text += 'Yearly Job Metrics:\n'
        Object.entries(yearlyStats)
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([year, stats]) => {
            text += `Year: ${year}, Nodes: ${stats.vsns.size}, Records: ${stats.totalValue.toLocaleString()}\n`
          })

        // Print total vsns used by each user and total records per user on the same line, sorted by number of vsns
        Object.entries(userVsns)
          .sort(([, aSet], [, bSet]) => bSet.size - aSet.size)
          .forEach(([user, vsnSet]) => {
            const recordCount = userRecordCounts[user] ?? 0
            text += `   ${user}, Nodes: ${vsnSet.size}, Records: ${recordCount.toLocaleString()}\n`
          })
          // Print the totals by plugin name, including node counts, grouping by name (ignoring version)


        // Calculate plugin totals: group by plugin name (ignoring version), count records and unique nodes
        const pluginTotals: Record<string, { count: number, nodes: Set<string> }> = {}
        for (const rec of counts) {
          const plugin = rec.meta?.plugin
          const vsn = rec.meta?.vsn
          if (plugin && vsn) {
            // Remove version from plugin name if present
            // (e.g., registry.sagecontinuum.org/user/plugin:version -> registry.sagecontinuum.org/user/plugin)
            const pluginName = plugin.split(':')[0]
            if (!pluginTotals[pluginName]) {
              pluginTotals[pluginName] = { count: 0, nodes: new Set() }
            }
            pluginTotals[pluginName].count += Number(rec.value)
            pluginTotals[pluginName].nodes.add(vsn)
          }
        }

        text += 'Plugin totals:\n'
        // Clean plugin name: remove registry.sagecontinuum.org/<username>/, waggle/, and any IP/server prefixes
        Object.entries(pluginTotals)
          .sort(([, a], [, b]) => b.nodes.size - a.nodes.size)
          .forEach(([plugin, data]) => {
            // Remove registry.sagecontinuum.org/<username>/ prefix
            let cleaned = plugin.replace(/^registry.sagecontinuum.org\/[^/]+\//, '')
            // Remove waggle/ prefix
            cleaned = cleaned.replace(/^waggle\//, '')
            // Remove IP address or server prefix (e.g., 192.168.1.1/, server.domain.com/)
            cleaned = cleaned.replace(/^[\d.]+\/|^[\w.-]+\/|^localhost\//, '')
            text += `   ${cleaned}, Nodes: ${data.nodes.size}, Records: ${data.count.toLocaleString()}\n`
          })

        console.log('text', text)
        setText(text)
      })


    }

    fetchData()

  }, [])


  // an attempt at counting recent active by month, although not entirely
  // useful since only last submitted time is available
  /*
  useEffect(() => {
    const monthlyNodeMap = {}

    for (const job of Object.values(jobs)) {
      const submittedAt = job?.state?.last_submitted
      const completedAt = job?.state?.last_completed
      const nodes = job?.nodes

      if (submittedAt && nodes) {
        try {
          const startDate = new Date(submittedAt)
          const endDate = completedAt ? new Date(completedAt) : new Date() // If not completed, assume still running

          // Iterate through each month between startDate and endDate (inclusive)
          const iter = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1))
          const endIter = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1))

          while (iter <= endIter) {
            const year = iter.getUTCFullYear()
            const month = String(iter.getUTCMonth() + 1).padStart(2, '0')
            const key = `${year}-${month}`

            if (!monthlyNodeMap[key]) {
              monthlyNodeMap[key] = new Set()
            }

            nodes.forEach((nodeName) => {
              monthlyNodeMap[key].add(nodeName)
            })

            // Move to next month
            iter.setUTCMonth(iter.getUTCMonth() + 1)
          }
        } catch (err) {
          console.error(`Error parsing dates for job ${job.job_id}:`, err)
        }
      }
    }

    // Output the count of active nodes per month
    Object.keys(monthlyNodeMap).sort().forEach((key) => {
      console.log(`${key}: ${monthlyNodeMap[key].size} node(s) active`)
    })
  }, [])
  */

  return (
    <Root className="flex column">
      <h2>Job Metrics</h2>

      <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{text}</pre>
    </Root>
  )
}


const Root = styled.div`
`

