
import { Button, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'

import { useIsSuper } from '/components/auth/PermissionProvider'

import config from '/config'


type Props = {
  id: number
}

export default function NodeEditBtn(props: Props) {
  const {isSuper} = useIsSuper()
  const {id} = props

  if (!isSuper)
    return <></>

  return (
    <>
      <Tooltip
        placement="top"
        title={<>Edit manifest</>}
      >
        <Button
          href={`${config.auth}/admin/manifests/nodedata/${id}`}
          startIcon={<EditIcon />}
        >
          Edit
        </Button>
      </Tooltip>
    </>
  )
}