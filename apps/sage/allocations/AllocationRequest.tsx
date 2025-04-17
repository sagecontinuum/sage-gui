import React, { useState } from 'react'
import {
  TextField, Checkbox, FormControlLabel, RadioGroup, Radio, Button,
  MenuItem, Select, FormControl, InputLabel, Container,
  Box, Typography,
} from '@mui/material'
import styled from 'styled-components'
import { Add, DragIndicator } from '@mui/icons-material'
import { Step, StepTitle } from '/components/layout/FormLayout'

import Table from '/components/table/Table'


// mock data

const columns = [{
  id: 'name',
  label: 'Project'
}, {
  id: 'members',
  label: 'Project Members'
}, {
  id: 'nodes',
  label: 'Nodes'
}]

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

const nodeColumns = [{
  id: 'node',
  label: 'Node'
}, {
  id: 'project',
  label: 'Project'
}, {
  id: 'type',
  label: 'Type'
}, {
  id: 'focus',
  label: 'Focus'
}, {
  id: 'cityState',
  label: 'cityState'
}, {
  id: 'sensors',
  label: 'Sensors'
}]

const nodesData = [{
  id: 1,
  node: 'W097',
  project: 'UH-Manoa',
  type: 'WSN',
  focus: 'Rural (Univ. of Hawaii)',
  cityState: 'Pahoa, HI',
  sensors: '8 Sensors'
}, {
  id: 2,
  node: 'W071',
  project: 'UH-Manoa',
  type: 'WSN',
  focus: 'Urban',
  cityState: 'Kaneohe, HI',
  sensors: '8 Sensors'
}, {
  id: 3,
  node: 'W069',
  project: 'UH-Manoa',
  type: 'WSN',
  focus: 'Rural',
  cityState: 'Kaneohe, HI',
  sensors: '8 Sensors'
}]

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
}

const ProjectForm: React.FC = () => {
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
    funding_sources: [{ source: '', grant_number: '' }]
  })

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)

  const handle_change = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>, index?: number
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

  return (
    <Container maxWidth="md" sx={{margin: '10 0'}}>
      <Box
        component="form"
        // sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
        noValidate
        autoComplete="off"
        onSubmit={handleSubmit}
        maxWidth="sm"
      >

        <h1>Request an Allocation</h1>

        <StepTitle icon="1" label="Project Information" />
        <Step>

          <p>If requesting to be added to an existing project, please select below</p>

          <Table primaryKey="id"
            checkboxes
            columns={columns} rows={projectsData}
          />
          <br/>
          <div className="flex gap justify-center"><b>OR</b></div>
          <br/>
          <div className="flex gap justify-center">
            <Button variant="contained">Request New Project</Button>
            <Button variant="outlined">Renew an Existing Project</Button>
          </div>
        </Step>

        <StepTitle icon="2" label="Project Information" />
        <Step>
          <div className="flex">

            <FormControlLabel
              control={
                <Checkbox name="use_profile_info"
                  checked={formData.use_profile_info}
                  onChange={handle_checkbox_change} />
              }
              label="Use My Profile Information"
              className="self-end"
            />
          </div>
          <TextField label="PI Name" name="pi_name" fullWidth margin="normal"
            onChange={handle_change} disabled={formData.use_profile_info}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField label="PI Email" name="pi_email" fullWidth margin="normal"
            onChange={handle_change} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="PI Institution" name="pi_institution" fullWidth margin="normal"
            onChange={handle_change} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Project Title" name="project_title" fullWidth margin="normal"
            onChange={handle_change} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Project Website" name="project_website" fullWidth margin="normal"
            onChange={handle_change} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Project Short Name" name="project_short_name" fullWidth margin="normal"
            onChange={handle_change} slotProps={{ inputLabel: { shrink: true } }} />

          <FormControl fullWidth margin="normal">
            <InputLabel>Science Field(s)</InputLabel>
            <Select name="science_field" value={formData.science_field} onChange={handle_change}>
              <MenuItem value="Physics">Physics</MenuItem>
              <MenuItem value="Biology">Biology</MenuItem>
              <MenuItem value="Computer Science">Computer Science</MenuItem>
            </Select>
          </FormControl>

          <RadioGroup name="related_to_proposal" value={formData.related_to_proposal} onChange={handle_change}>
            <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="No" control={<Radio />} label="No" />
          </RadioGroup>

          <TextField label="Please provide justification" name="justification" fullWidth multiline
            rows={4} margin="normal" onChange={handle_change} />

          <h3>Project Funding</h3>

          {formData.funding_sources.map((funding, index) => {
            return (
              <div key={index}>
                {draggedOverIndex === index && <DropIndicator isVisible />}
                <DraggableContainer
                  draggable
                  onDragStart={() => handle_drag_start(index)}
                  onDragOver={(event) => handle_drag_over(event, index)}
                  onDrop={() => handle_drop(index)}
                >
                  <DragIndicator sx={{ opacity: 0.5 }} />
                  <TextField label="Source/Institution" name="source" value={funding.source} fullWidth
                    onChange={(e) => handle_change(e, index)} />
                  <TextField label="Grant Number/ID" name="grant_number" value={funding.grant_number} fullWidth
                    onChange={(e) => handle_change(e, index)} />
                  <Button variant="outlined" color="error" onClick={() => remove_funding_source(index)}>Remove</Button>
                </DraggableContainer>
              </div>
            )
          })}

          <div className="flex justify-end">
            <Button variant="contained" color="primary" startIcon={<Add />}
              onClick={add_funding_source} style={{ marginBottom: 20 }}>
              Add Another Funding Source
            </Button>

          </div>

        </Step>


        <Typography variant="h4">Projects and Access</Typography>

        <StepTitle icon="3" label="Allocation/Permission Request Information" />

        <Step>
          <Table primaryKey="id"
            checkboxes
            columns={nodeColumns}
            rows={nodesData}
            onSearch={() => { /* todo */}}
          />
          <br/>

          <div className="flex justify-end">
            <Button variant="contained" startIcon={<Add />}>Add</Button>
          </div>

          <h3>Access Requested</h3>
          <div className="flex column">
            <FormControlLabel control={<Checkbox />} label="Running apps & SageChat/LLMS" />
            <FormControlLabel control={<Checkbox />} label="Shell (SSH Access)" />
            <FormControlLabel control={<Checkbox />} label="Downloading files" />
          </div>


          <h3>Are you interested in using HPC (ACCESS-CI) resources?</h3>
          <RadioGroup>
            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
          </RadioGroup>
        </Step>

        <br/>
        <Button variant="contained" color="primary" style={{ marginTop: 20 }} onClick={handleSubmit}>Submit</Button>

      </Box>
    </Container>
  )
}

export default ProjectForm
