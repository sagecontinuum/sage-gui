import React, {useEffect, useState} from 'react'

import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'

import AddIcon from '@mui/icons-material/AddRounded'

import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'

import * as Auth from '../../../components/auth/auth'
import * as ECR from '../../apis/ecr'


const userId = Auth.getUserId()

const permMap = {
  'FULL_CONTROL': 'owner',
  'READ': 'can read',
  'WRITE': 'can write'
}

const isMe = (grantee) => grantee == userId


type PermTableProps = {
  permissions: ECR.PermissionObj[]
  onDelete: (
      evt: React.MouseEvent,
      perm: {grantee: string, permission: ECR.Permission}
    ) => void
}

function PermissionTable(props: PermTableProps) {
  const {
    permissions,
    onDelete
  } = props


  return (
    <table className="simple striped w-full">
      <thead>
        <tr>
          <th>User</th>
          <th>Permission</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {permissions.map(perm => {
          const {grantee, permission} = perm

          return (
            <tr key={grantee}>
              <td>{grantee.slice(grantee.lastIndexOf('-') + 1)} {isMe(grantee) ? '(me)' : ''}</td>
              <td>{permMap[permission]}</td>
              <td>
                <IconButton onClick={(evt) => onDelete(evt, perm) } size="large">
                  <DeleteIcon className="delete"/>
                </IconButton>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}


type Props = {
  repo: {namespace: string, name: string}
  onClose: () => void
}


export default function ShareDialog(props: Props) {
  const {
    repo,
    onClose,
  } = props

  const [permissions, setPermissions] = useState<ECR.PermissionObj[]>(null)


  const [user, setUser] = useState(null)
  const [perm, setPerm] = useState<ECR.Permission>('READ')
  const [loading, setLoading] = useState(false)



  useEffect(() => {
    ECR.listPermissions(repo)
      .then((perms) => {
        setPermissions(perms)
      })
  }, [repo])



  const handleSubmit = (evt) => {
    evt.preventDefault()
    setLoading(true)
  }

  const handleClose = (evt) => {
    evt.preventDefault()
    if (onClose) onClose()
  }

  const handleAdd = (evt) => {
    setLoading(true)
    ECR.share(repo, user, perm, 'add')
      .then(() => {
        // implement
      })
      .finally(() => setLoading(false))
  }

  const handleDelete = (evt, perm) => {
    const {grantee, permission} = perm
    ECR.share(repo, grantee, permission, 'delete')
      .then(() => {
        // implement
      })
      .finally(() => setLoading(false))
  }


  return (
    <Dialog open onClose={handleClose} aria-labelledby="dialog-title">
      <form onSubmit={handleSubmit} autoComplete="off">
        <DialogTitle id="dialog-title">Edit Sharing</DialogTitle>

        <DialogContent>
          <Alert severity="info">
            Sharing at the user level has been temporarily disabled.
          </Alert>

          {/*
          {permissions &&
            <PermissionTable permissions={permissions} onDelete={handleDelete} />
          }
          <br/>

          <div className="flex form-gap">
            <TextField
              onChange={evt => setUser(evt.target.value)}
              placeholder="user"
            />

            <Select
              labelId="demo-simple-select-filled-label"
              id="demo-simple-select-filled"
              value={perm}
              onChange={evt => setPerm(evt.target.value)}
              inputProps={{
                size: 'small'
              }}
              variant="outlined"
              margin="dense"
            >
              <MenuItem value={'READ'}>Can read</MenuItem>
              <MenuItem value={'WRITE'}>Can write</MenuItem>
            </Select>

            <Button variant="contained" color="primary" size="small" disabled={loading || !user} onClick={handleAdd}>
              {loading ? 'loading...' : <><AddIcon/> Add</>}
            </Button>
          </div>
          */}
        </DialogContent>


        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Done
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}