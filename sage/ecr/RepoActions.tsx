import React, {useState} from 'react'
import styled from 'styled-components'

import DeleteIcon from '@material-ui/icons/DeleteOutline'
import PublicIcon from '@material-ui/icons/PublicRounded'
import ShareIcon from '@material-ui/icons/PersonAdd'
import Tooltip from '@material-ui/core/Tooltip'
import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'

import ConfirmationDialog from '../../components/dialogs/ConfirmationDialog'
import { useSnackbar } from 'notistack'

import * as ECR from '../apis/ecr'


type ActionBtnProps = {
  title: string
  onClick: (evt: React.MouseEvent) => void
  icon: JSX.Element
  style?: object
}

function ActionBtn({title, onClick, icon, style}: ActionBtnProps) {
  return (
    <Tooltip title={title} placement="top">
      <IconButton onClick={onClick} size="small" style={style}>
        {icon}
      </IconButton>
    </Tooltip>
  )
}



type FullActionBtnProps = {
  text: string
  onClick: (evt: React.MouseEvent) => void
  icon: JSX.Element
  style?: object
}

function FullActionBtn({text, onClick, icon, style}: FullActionBtnProps) {
  return (
    <Button
      onClick={onClick}
      style={{...style}}
      variant="outlined"
      color="primary"
      size="small"
    >
      {icon} {text}
    </Button>
  )
}



type Props = ECR.App & {
  isPublic?: boolean
  condensed?: boolean
  versionCount: number
  onComplete?: () => void
}

export default function RepoActions(props: Props) {
  const { enqueueSnackbar } = useSnackbar()
  const {
    namespace,
    name,
    condensed = true,
    isPublic,
    onComplete
  } = props

  const [confirm, setConfirm] = useState(false)
  const [publish, setPublish] = useState(false)

  const handleDelete = (evt) => {
    evt.preventDefault()
    setConfirm(true)
  }

  const handleMakePublic = (evt) => {
    evt.preventDefault()
    setPublish(true)
  }

  const onDelete = () => {
    const repo = {namespace, name}
    return ECR.deleteRepo(repo)
      .then(() =>
        enqueueSnackbar('Deleting app...')
      ).then(() =>
        enqueueSnackbar('App deleted!', {variant: 'success'})
      ).catch(() =>
        enqueueSnackbar('Failed to delete app', {variant: 'error'})
      ).finally(() =>
        onComplete && onComplete()
      )
  }

  const onMakePublic = () => {
    const repo = {namespace, name}
    return ECR.makePublic(repo, isPublic ? 'delete' : 'add')
      .then(() =>
        enqueueSnackbar('Making app public...')
      ).then(() =>
        enqueueSnackbar(
          isPublic ? 'Your app is now private' : 'Your app is now public!',
          {variant: 'success'}
        )
      ).catch(() =>
        enqueueSnackbar('Failed to make app public', {variant: 'error'})
      ).finally(() =>
        onComplete && onComplete()
      )
  }


  const handleShare = (evt) => {
    alert('sharing is not implemented yet')
  }


  return (
    <Root className="flex">
      {condensed ?
        <>
          <ActionBtn
            title="Share repo"
            icon={<ShareIcon />}
            onClick={handleShare}
          />
          <ActionBtn
            title={isPublic ? 'Turn public access off' : 'Make repo public'}
            icon={
              isPublic ?
                <span className="material-icons">public_off</span> :
                <PublicIcon />
            }
            onClick={handleMakePublic}
          />
          <ActionBtn
            title="Delete repo"
            icon={<DeleteIcon />}
            onClick={handleDelete}
            style={{color: '#912341'}}
          />
        </>
        :
        <div className="flex btn-gap">
          <FullActionBtn
            text="Share"
            icon={<ShareIcon />}
            onClick={handleShare}
          />
          <FullActionBtn
            text={isPublic ? 'Make private' : 'Make public'}
            icon={<PublicIcon />}
            onClick={handleMakePublic}
          />
          <FullActionBtn
            text="Delete"
            icon={<DeleteIcon />}
            onClick={handleDelete}
            style={{color: '#912341', border: '1px solid #912341'}}
          />
        </div>
      }

      {confirm &&
        <ConfirmationDialog
          title={`Are you sure you want to delete this?`}
          content={<><b>{namespace}/{name}</b> and {props.versionCount} associated tag{props.versionCount > 1 ? 's' : ''} will be deleted!</>}
          confirmBtnText="Delete"
          confirmBtnStyle={{background: '#c70000'}}
          onConfirm={onDelete}
          onClose={() => setConfirm(false)} />
      }

      {publish &&
        <ConfirmationDialog
          title={isPublic ?
            <>Make Repo Private</> :
            <>Make Repo publicly readable</>
          }
          content={
            isPublic ?
              <>Your repo <b>{namespace}/{name}</b> will no longer be publicly viewable.  Are you sure?</> :
              <>
                Your repo <b>{namespace}/{name}</b> will be viewable to everyone without sign-in.<br/>
                Are you sure you want to do this?
              </>
          }
          confirmBtnText={isPublic ? 'Make it private' : 'Make it public'}
          confirmBtnStyle={isPublic ? {background: '#c70000'} : {}}
          onConfirm={onMakePublic}
          onClose={() => setPublish(false)} />
      }
    </Root>
  )
}

const Root = styled.div`

`
