import React, {useState} from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'


type Props = {
  title: string | JSX.Element
  contentTitle?: string
  content?: string | JSX.Element
  loadingText?: string
  confirmBtnText?: string
  confirmBtnStyle?: object
  onClose: () => void
  onConfirm: () => void | Promise<any>
}


export default function CreateDialog(props: Props) {
  const {
    title = 'Are you sure you want to do that?',
    contentTitle,
    content,
    loadingText = 'loading...',
    confirmBtnText = 'OK',
    confirmBtnStyle = {},
    onClose,
    onConfirm
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
    <Dialog open={true} onClose={handleClose} aria-labelledby="form-dialog-title">
      <form onSubmit={handleSubmit}>
        <DialogTitle id="form-dialog-title">{title}</DialogTitle>
        <DialogContent>
          {contentTitle &&
            <DialogContentText>
              {contentTitle}
            </DialogContentText>
          }

          {content}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>

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
      </form>

    </Dialog>

  )
}