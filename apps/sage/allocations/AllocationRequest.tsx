import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import {
  TextField, FormControlLabel, RadioGroup, Radio, Button,
  Container, Box, Typography, Switch, Autocomplete,
  Tooltip,
} from '@mui/material'
import { Add, DragIndicator } from '@mui/icons-material'

import Checkbox from '/components/input/Checkbox'
import { Step, StepTitle } from '/components/layout/FormLayout'

import Table from '/components/table/Table'
import { getAllocationFormData, UserInfo } from '/components/apis/user'

import { getUserInfo } from '/components/apis/user'
import { getNodes } from '/components/apis/beekeeper'
import MapGL from '/components/Map'



const columns = [{
  id: 'name',
  label: 'Project'
}, {
  id: 'number_of_users',
  label: 'Project Members',
  format: (val) => `${val} users`
}, {
  id: 'number_of_nodes',
  label: 'Nodes',
  format: (val) => `${val} nodes`
}]

/* mock data
const projectsData = [{
  id: 1,
  name: 'Hawaii',
  members: 4,
  nodes: '3 Nodes'
}, {
  id: 2,
  name: 'ARM',
  members: 5,
  nodes: '1 Node'
}, {
  id: 2,
  name: 'Example Project',
  members: 5,
  nodes: '10 Nodes'
}]
*/


const getProjectSelectionLabel = (project) => {
  if (project === 'testbed') {
    return 'Select the testbed(s) you would like access to:'
  } else if (project === 'add') {
    return 'Select the nodes or project you would like to be added to:'
  } else if (project === 'renew') {
    return 'Select the project you would like to be renewed:'
  }
}

// todo: refactor
const DraggableContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px;
  cursor: grab;
`
const DropIndicator = styled.div`
  height: 2px;
  background-color: #6363eb;
  margin: 5px 0;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
`


type FundingSource = {
  source: string
  grant_number: string
}

type FormData = {
  pi_name: string
  use_profile_info: boolean
  pi_email: string
  pi_institution: string
  project_title: string
  project_website: string
  project_short_name: string
  science_field: string
  related_to_proposal: string
  justification: string
  grant_number: string
  funding_sources: FundingSource[]
  comments: string
  selected_nodes: any[]
  selected_projects: any[]
}


type AllocationType = 'testbed' | 'renew' | 'add' | 'file_access'

export default function ProjectForm() {
  const [formData, setFormData] = useState<FormData>({
    pi_name: '',
    use_profile_info: false,
    pi_email: '',
    pi_institution: '',
    project_title: '',
    project_website: '',
    project_short_name: '',
    science_field: '',
    related_to_proposal: '',
    justification: '',
    grant_number: '',
    funding_sources: [{ source: '', grant_number: '' }],
    comments: '',
    selected_nodes: [],
    selected_projects: [],
  })

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)

  const [reqType, setReqType] = useState<AllocationType>(null)
  const [formSpec, setFormSpec] = useState()

  const [nodes, setNodes] = useState<any[]>([])


  const [user, setUser] = useState<UserInfo>()

  useEffect(() => {
    getAllocationFormData()
      .then(data => {
        console.log(data)
        setFormSpec(data)
      })
      .catch(err => {
        // todo
        console.error(err)
      })

    getUserInfo()
      .then(data => setUser(data))
      .catch(err => {
        console.log('err', err)
      })

    getNodes().then(nodes => {
      console.log('nodes', nodes)
      setNodes(nodes)
    }).catch(err => {
      console.error('Error fetching nodes:', err)
    })
  }, [])


  const handleUseProfileInfo = (evt) => {
    handleChange(evt)
    setFormData(prev => ({...prev, pi_name: user.name, pi_email: user.email}))
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>,
    index?: number
  ) => {
    if (index !== undefined) {
      const new_funding_sources = [...formData.funding_sources]
      new_funding_sources[index][event.target.name as keyof FundingSource] = event.target.value as string
      setFormData({ ...formData, funding_sources: new_funding_sources })
    } else {
      setFormData({ ...formData, [event.target.name as keyof FormData]: event.target.value as string })
    }
  }

  const handle_checkbox_change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name as keyof FormData]: event.target.checked })
  }

  const add_funding_source = () => {
    setFormData({
      ...formData,
      funding_sources: [...formData.funding_sources, { source: '', grant_number: '' }]
    })
  }

  const remove_funding_source = (index: number) => {
    const new_funding_sources = formData.funding_sources.filter((_, i) => i !== index)
    setFormData({ ...formData, funding_sources: new_funding_sources })
  }


  const handleSubmit = () => {
    console.log('formState', formData)
  }



  const handle_drag_start = (index: number) => {
    setDraggedIndex(index)
  }

  const handle_drag_over = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault()
    setDraggedOverIndex(index)
  }

  const handle_drop = (index: number) => {
    if (draggedIndex !== null) {
      const new_funding_sources = [...formData.funding_sources]
      const [dragged_item] = new_funding_sources.splice(draggedIndex, 1)
      new_funding_sources.splice(index, 0, dragged_item)

      setFormData({ ...formData, funding_sources: new_funding_sources })
    }
    setDraggedIndex(null)
    setDraggedOverIndex(null)
  }

  // Utility function to pluralize label based on count
  function pluralize(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`
  }

  return (
    <Container>
      <Box
        component="form"
        // sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
        noValidate
        autoComplete="off"
        onSubmit={handleSubmit}
        sx={{maxWidth: '100%'}}
      >
        <h1>Sage Project Allocation and Project Renewal Request</h1>

        <StepTitle icon="1" label="Which type of request would you like to make?" />
        <Step>
          <RadioGroup value={reqType} onChange={(evt, val) => setReqType(val as AllocationType)}>
            <FormControlLabel value="testbed" control={<Radio />}
              label="Request access to developer testbed (most new users start here)" />
            <FormControlLabel value="add" control={<Radio />}
              label="Request access to specific nodes or projects" />
            {/* <FormControlLabel value="new" control={<Radio />} label="Request the start of a new project" /> */}
            <FormControlLabel value="file_access" control={<Radio />}
              label="Requests access to protected data sets" />
            <FormControlLabel value="renew" control={<Radio />} label="Restore expired access/permissions" />
          </RadioGroup>
        </Step>

        {formSpec && ['testbed', 'add', 'renew', 'file_access'].includes(reqType) &&
          <>
            <StepTitle
              icon="2"
              label={getProjectSelectionLabel(reqType)}
            />

            {['testbed'].includes(reqType) &&
              <Step>
                <div className="flex gap">
                  <div className="flex column" style={{width: '100%'}}>
                    {nodes &&
                      <Step>
                        <Table primaryKey="id"
                          checkboxes
                          columns={columns}
                          rows={
                            reqType == 'testbed' ?
                              formSpec.projects.filter(project => project.name.toLowerCase().includes('testbed'))
                              : formSpec.projects
                          }
                        />
                      </Step>
                    }
                  </div>
                </div>
              </Step>
            }

            {['add', 'file_access'].includes(reqType) &&
              <Step>
                <div className="flex gap">
                  <div className="flex column" style={{width: '100%'}}>
                    <Autocomplete
                      multiple
                      loading={!nodes}
                      options={nodes}
                      getOptionLabel={option => {
                        const main = option.vsn || option.node || String(option)
                        return main
                      }}
                      renderOption={(props, option) => (
                        <li
                          {...props}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>
                            {option.vsn + (option.site_id ? '| ' + option.site_id : '') || option.node || String(option)}
                          </span>
                          {(option.city || option.state) && (
                            <span
                              style={{
                                color: '#aaa',
                                fontSize: '0.95em',
                                marginLeft: 12,
                                marginRight: 4,
                                flexShrink: 0
                              }}
                            >
                              {option.city.split(',')[0]}{option.city && option.state ? ', ' : ''}{option.state}
                            </span>
                          )}
                        </li>
                      )}
                      value={formData.selected_nodes}
                      onChange={(_, newValue) => {
                        setFormData(prev => ({
                          ...prev,
                          selected_nodes: newValue
                        }))
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Nodes (multiple allowed)"
                          margin="normal"
                          fullWidth
                        />
                      )}
                    />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      margin: '16px 0',
                      fontWeight: 500,
                      color: '#888',
                      letterSpacing: 1,
                      textTransform: 'uppercase'
                    }}>
                      <span style={{
                        flex: 1,
                        borderBottom: '1px solid #ddd',
                        marginRight: 12
                      }} />
                      OR
                      <span style={{
                        flex: 1,
                        borderBottom: '1px solid #ddd',
                        marginLeft: 12
                      }} />
                    </div>
                    <Autocomplete
                      multiple
                      loading={!formSpec?.projects}
                      options={formSpec.projects || []}
                      getOptionLabel={option =>
                        option.name
                          ? `${option.name} (${pluralize(option.number_of_users || 0, 'user', 'users')}, ${pluralize(option.number_of_nodes || 0, 'node', 'nodes')})`
                          : String(option)
                      }
                      value={formData.selected_projects}
                      onChange={(_, newValue) => {
                        console.log('newValue', newValue)
                        setFormData(prev => ({
                          ...prev,
                          selected_nodes: newValue.reduce((acc, project) => project.nodes ? [
                            ...acc, ...project.nodes
                          ] : acc, []), // Flatten nodes from selected projects
                          selected_projects: newValue
                        }))
                      }}
                      renderOption={(props, option) => (
                        <li {...props} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{option.name}</span>
                          <span style={{ color: '#aaa', fontSize: '0.95em', marginLeft: 12, marginRight: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
                            {pluralize(option.number_of_users || 0, 'user', 'users')}, {pluralize(option.number_of_nodes || 0, 'node', 'nodes')}
                          </span>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Projects (multiple allowed)"
                          margin="normal"
                          fullWidth
                        />
                      )}
                    />

                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Select the permissions you are requesting for these nodes:
                    </Typography>
                    <div className="flex column gap">
                      <FormControlLabel
                        control={<Checkbox name="running_apps" checked={formData.running_apps} onChange={handle_checkbox_change} />}
                        label="Running apps (Includes SageChat/LLMS)"
                      />
                      <FormControlLabel
                        control={<Checkbox name="shell_access" checked={formData.shell_access} onChange={handle_checkbox_change} />}
                        label="Shell (SSH Access)"
                      />
                      <FormControlLabel
                        control={<Checkbox name="data_download" checked={formData.data_download} onChange={handle_checkbox_change} />}
                        label="Downloading protected data sets (files)"
                      />
                    </div>
                  </div>
                  {nodes &&
                    <MapGL
                      data={formData.selected_nodes.length ? formData.selected_nodes : nodes}
                      markerClass={'blue-dot'}
                      updateID={JSON.stringify(formData.selected_nodes)}
                    />
                  }
                </div>
              </Step>
            }


          </>
        }

        {['testbed', 'add', 'file_access'].includes(reqType) &&
            <>
              <StepTitle icon="3" label="Project Information" />
              <Step>
                <FormControlLabel
                  control={<Switch />}
                  name="use_profile_info"
                  checked={formData.use_profile_info}
                  onChange={handleUseProfileInfo}
                  label="I'm the Principal Investigator (PI)"
                /><br/>
                <Box sx={{ maxWidth: '300px' }}>
                  <TextField label="PI Name" name="pi_name" margin="normal" fullWidth
                    onChange={handleChange} disabled={formData.use_profile_info}
                    slotProps={{ inputLabel: { shrink: true } }} required />
                  <TextField label="PI Email" name="pi_email" margin="normal" fullWidth
                    value={formData.pi_email} onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }} required />
                  <TextField label="PI Institution" name="pi_institution" fullWidth margin="normal"
                    value={formData.pi_institution} onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }} required />
                </Box>
                <Box sx={{ maxWidth: '50%' }}>
                  <TextField label="Project Title" name="project_title" fullWidth margin="normal"
                    placeholder="A short description; used to find your project"
                    value={formData.project_title} onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }} required />
                </Box>
                <TextField label="Project Short Name" name="project_short_name" margin="normal"
                  value={formData.project_short_name} onChange={handleChange}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 16 }}} required />

                <Box sx={{ maxWidth: '400px' }}>
                  <TextField label="Project Website" name="project_website" fullWidth margin="normal"
                    value={formData.project_website} onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }} />

                  <Autocomplete
                    multiple
                    loading={!formSpec}
                    options={formSpec?.science_fields || []}
                    value={formData.science_field ? formData.science_field.split(',').filter(Boolean) : []}
                    onChange={(_, newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        science_field: newValue.join(',')
                      }))
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Science field; select all that apply"
                        margin="normal"
                        fullWidth
                      />
                    )}
                  />
                </Box>

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Is this project related to a proposal to be submitted?
                </Typography>
                <RadioGroup row
                  name="related_to_proposal"
                  value={formData.related_to_proposal}
                  onChange={(event) => handleChange(event)}
                >
                  <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="No" control={<Radio />} label="No" />
                </RadioGroup>

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Are you interested in using HPC (ACCESS-CI) resources?
                </Typography>
                <RadioGroup row aria-required="true">
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Please list any applicable project funding sources:
                </Typography>
                <div>
                  {formData.funding_sources.map((funding, index) => (
                    <div key={`funding-${index}`}>
                      {draggedOverIndex === index && <DropIndicator isVisible />}
                      <DraggableContainer
                        draggable
                        onDragStart={() => handle_drag_start(index)}
                        onDragOver={(event) => handle_drag_over(event, index)}
                        onDrop={() => handle_drop(index)}
                      >
                        <DragIndicator sx={{ opacity: 0.5 }} />
                        <TextField label="Source/Institution" name="source" value={funding.source} fullWidth
                          onChange={(e) => handleChange(e, index)} />
                        <TextField label="Grant Number/ID" name="grant_number" value={funding.grant_number} fullWidth
                          onChange={(e) => handleChange(e, index)} />
                        <Button variant="outlined" color="error" onClick={() => remove_funding_source(index)}>
                        Remove
                        </Button>
                      </DraggableContainer>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button variant="contained" color="primary" startIcon={<Add />}
                    onClick={add_funding_source} style={{ marginBottom: 20 }}>
                  Add Another Funding Source
                  </Button>
                </div>

                <TextField
                  label="Please provide justification for your access request"
                  name="justification"
                  required
                  fullWidth
                  multiline
                  rows={4} margin="normal" onChange={handleChange}
                />

                <TextField
                  label="Do you have any additional comments or questions?"
                  name="comments"
                  fullWidth
                  multiline
                  rows={4}
                  margin="normal"
                  value={formData.comments}
                  onChange={handleChange}
                  placeholder="Any additional information you'd like to provide"
                />

              </Step>
            </>
        }

        {reqType &&
          <>
            {/* Tooltip must wrap a span if the button is disabled */}
            <Tooltip
              placement="right"
              title={
                !formData.pi_name || !formData.pi_email || !formData.project_title
                  ? 'Please fill in all required fields'
                  : 'Submit your request'
              }
            >
              <>
                <Button
                  variant="contained"
                  color="primary"
                  style={{ marginTop: 20 }}
                  onClick={handleSubmit}
                  disabled={!reqType || !formData.pi_name || !formData.pi_email || !formData.project_title}
                >
                  Submit!
                </Button>
              </>
            </Tooltip>
          </>
        }
        <br/><br/><br/>
      </Box>
    </Container>
  )
}
