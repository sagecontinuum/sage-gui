import React, {useEffect, useState} from 'react'

import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import TextField from '@material-ui/core/TextField'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'

import AddIcon from '@material-ui/icons/AddRounded'

import DeleteIcon from '@material-ui/icons/DeleteOutlineRounded'

import * as Auth from '../../../components/auth/auth'
import * as ECR from '../../apis/ecr'




const permMap = {
  'FULL_CONTROL': 'owner',
  'READ': 'can read',
  'WRITE': 'can write'
}

const isMe = (grantee) => grantee == Auth.user_id


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
                <IconButton onClick={(evt) => onDelete(evt, perm) }>
                  <DeleteIcon className="delete"/>
                </IconButton>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}


type Props = {
  repo: ECR.Repo
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