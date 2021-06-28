import React, {useState, useEffect} from 'react'
import styled from 'styled-components'

import TextField from '@material-ui/core/TextField'
// import {useProgress} from '../../components/progress/ProgressProvider'






type Props = {

}

export default function AccountProfile(props: Props) {

  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState()

  useEffect(() => {
    // get username


  }, [])

  return (
    <Root>
      {!loading &&
        <div>

          <h1>Activate Sage Account</h1>

          <p>
            To finish activating your Sage account, please enter a username.  <b>Note:
              this username cannot be changed, so please choose wisely.</b>
          </p>
          <br/>

          <TextField
            id={`sage-username`}
            InputLabelProps={{shrink: true}}
            label="Username"
            variant="outlined"

          />
        </div>
      }
    </Root>
  )
}


const Root = styled.div`
  margin: 2rem;
`