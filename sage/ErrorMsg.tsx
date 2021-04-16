import React from 'react'
import Alert from '@material-ui/lab/Alert'

type Props = {
  children: JSX.Element
}

export default function ErrorMsg(props: Props) {
  return (
    <Alert severity="error">
      {props.children}
    </Alert>
  )
}

