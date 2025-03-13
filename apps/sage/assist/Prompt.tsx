import styled from 'styled-components'
import { IconButton, TextField } from '@mui/material'
import { SendRounded, ClearRounded } from '@mui/icons-material'


type Props = {
  value: string
  loading?: boolean
  onChange: (val: string) => void
  onSubmit: () => void
}

export default function Prompt(props: Props) {
  const {value, onChange, onSubmit, loading} = props

  return (
    <InputRoot className="flex">
      <TextField
        id="prompt-input"
        value={value}
        onChange={(evt) => onChange(evt.target.value)}
        slotProps={{
          input: {
            endAdornment:
              !!value.length &&
                <IconButton onClick={() => onChange('')}>
                  <ClearRounded fontSize="small"/>
                </IconButton>
          }
        }}
        fullWidth
      />
      <IconButton
        onClick={onSubmit}
        sx={{marginLeft: '5px'}}
        color="primary"
        disabled={loading}
      >
        <SendRounded />
      </IconButton>
    </InputRoot>
  )
}


const InputRoot = styled.div`
  margin: 25px 0 25px 0;
`

