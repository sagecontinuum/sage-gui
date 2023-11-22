import { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import CloseIcon from '@mui/icons-material/Close'
import IconButton from '@mui/icons-material/Close'
import type { Breakpoint } from '@mui/material/'


type Props = {
  title: string | JSX.Element
  contentTitle?: string
  content?: string | JSX.Element
  loadingText?: string
  confirmBtnText?: string
  confirmBtnStyle?: object
  fullScreen?: boolean
  cancelBtn?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<any>
  maxWidth?: false | Breakpoint
}


export default function CreateDialog(props: Props) {
  const {
    title = 'Are you sure you want to do that?',
    contentTitle,
    content,
    loadingText = 'loading...',
    confirmBtnText = 'OK',
    confirmBtnStyle = {},
    fullScreen,
    cancelBtn,
    onClose,
    onConfirm,
    ...rest
  } = props

  const [loading, setLoading] = useState(false)

  const handleSubmit = (evt) => {
    evt.preventDefault()
    setLoading(true)

    const res = onConfirm()
    if (res instanceof Promise) {
      res.then(() => {
        setLoading(false)
        onClose()
      })
    } else {
      onConfirm()
      setLoading(false)
      onClose()
    }
  }

  const handleClose = (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    if (onClose) onClose()
  }

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      aria-labelledby="dialog-title"
      fullScreen={fullScreen}
      style={fullScreen ? {marginTop: 60} : {}}
      {...rest}
    >
      <DialogTitle id="dialog-title">
        {title}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 20,
            top: 20,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {contentTitle &&
          <DialogContentText>
            {contentTitle}
          </DialogContentText>
        }
        {content}
      </DialogContent>

      <DialogActions sx={{borderTop: '1px solid #f2f2f2' }}>
        {cancelBtn &&
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
        }

        <Button
          type="submit"
          color="primary"
          variant="contained"
          disabled={loading}
          style={!loading ? confirmBtnStyle : {}}
          onClick={handleSubmit}
        >
          {(loading && loadingText) ? loadingText : confirmBtnText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}