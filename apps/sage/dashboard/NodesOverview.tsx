import { useState } from 'react'
import { Link } from 'react-router-dom'
import { styled } from '@mui/material'
import {
  HubOutlined, ArrowForwardRounded, SensorsOutlined
} from '@mui/icons-material'
import { Button, ButtonGroup, Tooltip } from '@mui/material'

import { SensorIcons, accessFormatter, AccessFilterButtons } from '/components/views/nodes/nodeFormatters'
import { capabilityIcons } from '/components/views/sensor/capabilityIcons'
import Table from '/components/table/Table'
import { queryData } from '/components/data/queryData'
import MapGL from '/components/Map'
import { Card } from '/components/layout/Layout'
import SageProjectFilter from './SageProjectFilter'

import * as BK from '/components/apis/beekeeper'
import * as User from '/components/apis/user'


type NodesOverviewProps = {
  allNodes: BK.Node[]
  sensors: BK.SensorListRow[]
  projectFilter: 'all' | 'SAGE' | 'SGT'
  onProjectFilterChange: (value: 'all' | 'SAGE' | 'SGT') => void
  onNodeSelect?: (nodes: BK.Node[]) => void
  allNodesCount: number
  sageNodesCount: number
  sgtNodesCount: number
}


// Mini table columns for quick view
const nodeColumns = [{
  id: 'vsn',
  label: 'Node',
  format: (vsn) => <Link to={`/nodes/${vsn}`}><b>{vsn}</b></Link>
}, {
  id: 'city',
  label: 'City',
}, {
  id: 'access',
  label: 'Access',
  format: accessFormatter
}]


const getTitle = (hardware: string, description: string) => {
  const match = description?.match(/^#\s+(.+)\r\n/m)
  const title = match ? match[1] : null
  return title ? title : hardware
}

const sensorColumns = [{
  id: 'hw_model',
  label: 'Model',
  width: '250px',
  format: (val, obj) =>
    <div>
      <div><small className="muted"><b>{obj.manufacturer}</b></small></div>
      <Link to={`/sensors/${obj.hw_model}`}>{val}</Link>
    </div>
}, {
  id: 'title',
  label: 'Name',
  format: (_, obj) => <Link to={`/sensors/${obj.hw_model}`}>{getTitle(obj.hw_model, obj.description)}</Link>
}, {
  id: 'capabilities',
  label: 'Capabilities',
  format: (_, obj) => {
    // Convert sensor to format expected by SensorIcons (array of sensors)
    const sensorData = [{
      hw_model: obj.hw_model,
      name: obj.hw_model,
      serial_no: '',
      manufacturer: obj.manufacturer || '',
      capabilities: obj.capabilities || [],
      is_active: true
    }]
    return <SensorIcons data={sensorData} showOnlyPresent={true} />
  }
}, {
  id: 'vsns',
  label: 'My Nodes',
  format: (vsns: BK.VSN[], obj) => (
    <Link to={`/my-nodes?show_all=true&sensor="${obj.hw_model}"`}>
      {vsns.length} node{vsns.length !== 1 ? 's' : ''}
    </Link>
  )
}]


export default function NodesOverview({
  allNodes,
  sensors,
  projectFilter,
  onProjectFilterChange,
  onNodeSelect,
  allNodesCount,
  sageNodesCount,
  sgtNodesCount
}: NodesOverviewProps) {
  const [accessFilters, setAccessFilters] = useState<Set<User.AccessPerm>>(new Set())
  const [sensorCapabilityFilters, setSensorCapabilityFilters] = useState<Set<string>>(new Set())
  const [sensorPage, setSensorPage] = useState(0)
  const [sensorSearch, setSensorSearch] = useState('')
  const [nodesTab, setNodesTab] = useState<'nodes' | 'sensors'>('nodes')

  const [selected, setSelected] = useState<BK.Node[]>([])

  const toggleAccessFilter = (access: User.AccessPerm) => {
    setAccessFilters(prev => {
      const newFilters = new Set(prev)
      if (newFilters.has(access)) {
        newFilters.delete(access)
      } else {
        newFilters.add(access)
      }
      return newFilters
    })
  }

  const toggleSensorCapabilityFilter = (capability: string) => {
    setSensorCapabilityFilters(prev => {
      const newFilters = new Set(prev)
      if (newFilters.has(capability)) {
        newFilters.delete(capability)
      } else {
        newFilters.add(capability)
      }
      return newFilters
    })
  }

  // Filter nodes based on project and access filters
  const filteredNodes = allNodes?.filter(node => {
    // Access filter - if any access filters are set, node must have ALL selected access types
    if (accessFilters.size > 0) {
      const nodeAccess = node.access || []
      return Array.from(accessFilters).every(requiredAccess =>
        nodeAccess.includes(requiredAccess)
      )
    }

    return true
  }) || []

  // Map nodes with required properties
  const mapNodes = filteredNodes.map(node => ({
    ...node,
    sensor: node.sensors?.map(s => s.hw_model) || [],
    // status: 'unknown', // Status could be determined by MapGL from live data; todo(nc)
    elapsedTimes: {} // Will be populated by live data if available
  }))

  // Table nodes (access already included from getUserNodesAndProjects)
  const tableNodes = filteredNodes

  if (!allNodes || allNodes.length === 0) {
    return null
  }

  return (
    <NodesOverviewSection>
      <FilterBar>
        <FilterGroup>
          <SageProjectFilter
            projectFilter={projectFilter}
            onProjectFilterChange={onProjectFilterChange}
            allNodesCount={allNodesCount}
            sageNodesCount={sageNodesCount}
            sgtNodesCount={sgtNodesCount}
          />
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setNodesTab('nodes')}
              variant={nodesTab === 'nodes' ? 'contained' : 'outlined'}
              // startIcon={<HubOutlined />}
            >
              Nodes
            </Button>
            <Button
              onClick={() => setNodesTab('sensors')}
              variant={nodesTab === 'sensors' ? 'contained' : 'outlined'}
              // startIcon={<SensorsOutlined />}
            >
              Sensors
            </Button>
          </ButtonGroup>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Access:</FilterLabel>
          <AccessFilterButtons accessFilters={accessFilters} onToggle={toggleAccessFilter} />
        </FilterGroup>
      </FilterBar>

      <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {nodesTab === 'nodes' ? (
          <NodesGrid>
            {/* Map Section */}
            <div>
              <SectionHeader>
                <SectionTitle>
                  <HubOutlined /> Map
                </SectionTitle>
              </SectionHeader>
              <MapContainer>
                <MapGL
                  data={selected.length ? selected : mapNodes}
                  updateID={
                    `${selected.map(node => node.vsn).join(',')}` +
                    `-${filteredNodes.length}-${Array.from(accessFilters).sort().join(',')}`
                  }
                  markerClass="blue-dot"
                  autoFitBounds={true}
                  mapSettings={{style: {height: '400px'}}}
                />
              </MapContainer>
            </div>

            {/* Nodes Section */}
            <div>
              <SectionHeader>
                <SectionTitle>
                  <HubOutlined /> My Nodes
                </SectionTitle>
                {tableNodes && tableNodes.length > 0 &&
                <ViewAllLink to="/my-nodes">
                  View All <ArrowForwardRounded fontSize="small" />
                </ViewAllLink>
                }
              </SectionHeader>
              {tableNodes && tableNodes.length > 0 ? (
                <ScrollableTableContainer>
                  <Table
                    primaryKey="vsn"
                    columns={nodeColumns}
                    rows={tableNodes}
                    onSelect={state => {
                      const selectedNodes = state.objs as BK.Node[]
                      setSelected(selectedNodes)
                      onNodeSelect?.(selectedNodes)
                    }}
                  />
                </ScrollableTableContainer>
              ) : (
                <EmptyState>
                  <EmptyIcon><HubOutlined /></EmptyIcon>
                  <p>No nodes found for this filter</p>
                  <Link to="/nodes">Browse Available Nodes</Link>
                </EmptyState>
              )}
            </div>
          </NodesGrid>
        ) : (
          // Sensors Tab Content
          <div>
            {(() => {
              const userVSNs = new Set(allNodes?.map(n => n.vsn) || [])
              const baseSensors = sensors?.filter(s =>
                s.vsns.some(vsn => userVSNs.has(vsn))
              ).map(s => ({
                ...s,
                vsns: s.vsns.filter(vsn => userVSNs.has(vsn))
              })) || []

              // Get all capabilities from user's sensors
              const allCapabilities = new Set<string>()
              baseSensors.forEach(sensor => {
                sensor.capabilities?.forEach(cap => {
                  const normalizedCap = cap === 'Thermal Camera' ? 'Camera' : cap
                  allCapabilities.add(normalizedCap)
                })
              })

              let userSensors = [...baseSensors]

              // Apply capability filters
              if (sensorCapabilityFilters.size > 0) {
                userSensors = userSensors.filter(sensor => {
                  const sensorCaps = sensor.capabilities?.map(cap =>
                    cap === 'Thermal Camera' ? 'Camera' : cap
                  ) || []
                  return Array.from(sensorCapabilityFilters).some(filterCap =>
                    sensorCaps.includes(filterCap)
                  )
                })
              }

              // Apply search filter
              if (sensorSearch) {
                userSensors = queryData(userSensors, sensorSearch)
              }

              return (
                <>
                  <SectionHeader style={{ marginTop: 0 }}>
                    <SectionTitle>
                      <SensorsOutlined /> My Sensors
                    </SectionTitle>
                    <div className="flex items-center gap">
                      {allCapabilities.size > 0 && (
                        <CapabilityFilterInline>
                          <CapabilityFilterLabel>Filter by capability:</CapabilityFilterLabel>
                          <CapabilityIcons>
                            {Object.keys(capabilityIcons)
                              .filter(cap => allCapabilities.has(cap))
                              .map(capability => {
                                const Icon = capabilityIcons[capability]
                                const isSelected = sensorCapabilityFilters.has(capability)

                                return (
                                  <Tooltip key={capability} title={capability} placement="top">
                                    <CapabilityIconButton
                                      selected={isSelected}
                                      onClick={() => toggleSensorCapabilityFilter(capability)}
                                    >
                                      {typeof Icon === 'function' && capability === 'Humidity' ? (
                                        <Icon />
                                      ) : typeof Icon === 'function' && capability === 'Precipitation' ? (
                                        <Icon />
                                      ) : typeof Icon === 'function' && capability === 'Accelerometer' ? (
                                        <Icon />
                                      ) : (
                                        <Icon fontSize="small" />
                                      )}
                                    </CapabilityIconButton>
                                  </Tooltip>
                                )
                              })}
                          </CapabilityIcons>
                        </CapabilityFilterInline>
                      )}
                      {baseSensors.length > 0 &&
                        <ViewAllLink to="/sensors">
                          View All <ArrowForwardRounded fontSize="small" />
                        </ViewAllLink>
                      }
                    </div>
                  </SectionHeader>
                  {userSensors.length > 0 || baseSensors.length > 0 ? (
                    userSensors.length > 0 ? (
                      <Table
                        primaryKey="hw_model"
                        columns={sensorColumns}
                        rows={userSensors}
                        pagination={true}
                        page={sensorPage}
                        limit={userSensors.length}
                        rowsPerPage={20}
                        onPage={(newPage) => setSensorPage(newPage)}
                        enableSorting={true}
                        search={sensorSearch}
                        onSearch={({query}) => setSensorSearch(query)}
                        middleComponent={<></>}
                      />
                    ) : (
                      <EmptyState>
                        <EmptyIcon><SensorsOutlined /></EmptyIcon>
                        <p>No sensors found with selected filters</p>
                        <Button onClick={() => {
                          setSensorCapabilityFilters(new Set())
                          setSensorSearch('')
                        }} variant="outlined" size="small">
                          Clear Filters
                        </Button>
                      </EmptyState>
                    )
                  ) : (
                    <EmptyState>
                      <EmptyIcon><SensorsOutlined /></EmptyIcon>
                      <p>No sensors found on your nodes</p>
                      <Link to="/sensors">Browse All Sensors</Link>
                    </EmptyState>
                  )}
                </>
              )
            })()}
          </div>
        )}
      </Card>
    </NodesOverviewSection>
  )
}


const NodesOverviewSection = styled('div')`
  margin-bottom: 2rem;
`

const FilterBar = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 1.25rem 1.5rem;
  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#f8f9fa'};
  border: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#444' : '#e0e0e0'};
  border-radius: 12px 12px 0 0;
  border-bottom: 2px solid ${({ theme }) => theme.palette.primary.main};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`

const NodesGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`

const FilterGroup = styled('div')`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`

const FilterLabel = styled('span')`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.mode === 'dark' ? '#fff' : '#333'};
`

const MapContainer = styled('div')`
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
`

const ScrollableTableContainer = styled('div')`
  max-height: 400px;
  overflow-y: auto;
  overflow-x: auto;
`

const SectionHeader = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#444' : '#e0e0e0'};
`

const SectionTitle = styled('h2')`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25em;
  color: ${({ theme }) => theme.palette.mode === 'dark' ? '#fff' : '#333'};

  svg {
    color: ${({ theme }) => theme.palette.primary.main};
  }
`

const ViewAllLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${({ theme }) => theme.palette.primary.main};
  text-decoration: none;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    gap: 0.5rem;
    text-decoration: underline;
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: translateX(4px);
  }
`

const EmptyState = styled('div')`
  text-align: center;
  padding: 3rem 1rem;
  color: ${({ theme }) => theme.palette.text.secondary};

  p {
    margin: 1rem 0;
    font-size: 1.1em;
  }

  a {
    color: ${({ theme }) => theme.palette.primary.main};
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`

const EmptyIcon = styled('div')`
  svg {
    font-size: 4em;
    opacity: 0.3;
  }
`

const CapabilityFilterInline = styled('div')`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const CapabilityFilterLabel = styled('span')`
  font-weight: 600;
  font-size: 0.9em;
  color: ${({ theme }) => theme.palette.text.primary};
  white-space: nowrap;
`

const CapabilityIcons = styled('div')`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const CapabilityIconButton = styled('button')<{ selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 2px solid ${({ theme, selected }) =>
    selected ? theme.palette.primary.main : (theme.palette.mode === 'dark' ? '#444' : '#e0e0e0')};
  background: ${({ theme, selected }) =>
    selected ? theme.palette.primary.main : 'transparent'};
  color: ${({ theme, selected }) =>
    selected ? '#fff' : (theme.palette.mode === 'dark' ? '#fff' : '#000')};
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    transform: scale(1.1);
    border-color: ${({ theme }) => theme.palette.primary.main};
    background: ${({ theme, selected }) =>
      selected ? theme.palette.primary.dark : theme.palette.action.hover};
  }

  svg {
    font-size: 1.2rem;
  }
`
