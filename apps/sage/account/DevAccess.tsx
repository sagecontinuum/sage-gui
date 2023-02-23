import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { Button, Alert, FormControl, OutlinedInput, FormLabel } from '@mui/material'

import { useProgress } from '/components/progress/ProgressProvider'
import Clipboard from '/components/utils/Clipboard'
import CopyBtn from '/components/utils/CopyBtn'
import * as User from '/components/apis/user'
import Auth from '/components/auth/auth'


import config from '/config'
const {docs} = config


type Form = {
  ssh_public_keys: User.UserInfo['ssh_public_keys']
}

export default function DevAccess() {
  const {setLoading} = useProgress()

  // presentation
  const [canDev, setCanDev] = useState<boolean>()
  const [error, setError] = useState(null)

  // form
  const [isSaving, setIsSaving] = useState(false)
  const [state, setState] = useState<Form>()


  useEffect(() => {
    setLoading(true)
    User.hasCapability('develop')
      .then(canDev => {
        setCanDev(canDev)

        // set keys
        User.getUserInfo()
          .then(({ssh_public_keys}) => setState({ssh_public_keys}))
          .catch(err => setError(err.message))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [setLoading])


  const handleChange = (evt) => {
    const {name, value} = evt.target
    setState(prev => ({...prev, [name]: value}))
  }

  const handleSave = () => {
    setIsSaving(true)
    User.saveSSHKey(state)
      .then(data => setState(data))
      .catch(err => setError(err.message))
      .finally(() => setIsSaving(false))
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(Auth.token)
  }


  return (
    <Root>
      {canDev &&
        <CopyToken>
          <h1 className="no-margin">Your access token</h1>
          <div className="flex items-center justify-between gap">
            <div className="flex-grow">
              <pre style={{width: 375}}>
                **************************************
                <CopyBtn tooltip="Copy token" onClick={handleCopyToken} />
              </pre>
            </div>
            <div>
              <Alert severity="warning">
                <b>Note:</b> Treat this token as your username & password.
                Please <b><a href={`${docs}/contact-us`}>contact us</a></b> if you have any questions.
              </Alert>
            </div>
          </div>
        </CopyToken>
      }

      <h1 className="no-margin">Update SSH public keys</h1>

      <p>Please update and submit your SSH public keys below.</p>

      {state &&
        <FormControl className="flex column">
          <FormLabel id="ssk-keys">SSH Public Keys:</FormLabel>
          <OutlinedInput
            placeholder={
              `sh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK0LT3jNyfUtkJwxiv/7YfPU4PIOsQzeCVKlLCAfwlg3\\n` +
              `\n\n(no ssh key provided)`
            }
            shrink="true"
            id="ssh-keys"
            aria-label="ssh keys"
            name="ssh_public_keys"
            onChange={handleChange}
            value={state.ssh_public_keys}
            multiline
            minRows={8}
            style={{width: 800}}
          />
        </FormControl>
      }

      <Button
        className="save"
        variant="contained"
        type="submit"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </Button>

      {error &&
        <Alert severity="error">{error}</Alert>
      }

      <h2>Finish setting up node access</h2>

      {!canDev &&
        <Alert severity="info">
          Note you do not have dev access on any nodes.
          Please <b><a href={`${docs}/contact-us`}>contact us</a></b> if you'd like access to a node.
        </Alert>
      }

      <p>Once you've updated your SSH public key above, you'll need to do the following steps:</p>

      <h3>1. Request dev key</h3>

      First, <b><a href={`${docs}/contact-us`}>email us</a></b> us with subject "Dev Key Request",
      along with your name and organization so that we can provide you with an SSH key.
      You should save the key to <code>~/.ssh/ecdsa_waggle_dev</code>.

      This is a legacy step which will no longer be required in the future.

      <h3>2. Update SSH config</h3>
      Next, you'll need to update your <code>~/.ssh/config</code> file to include the following lines:


      <Clipboard content={
        <div>
          Host waggle-dev-sshd<br/>
          {'    ' }HostName 192.5.86.5<br/>
          {'    '}Port 49190<br/>
          {'    '}User waggle<br/>
          {'    '}IdentityFile ~/.ssh/id_ed25519 # &lt;---- your personal key<br/>
          {'    '}IdentitiesOnly yes<br/>
          <br/>
          Host waggle-dev-node-*<br/>
          {'    '}ProxyCommand ssh waggle-dev-sshd connect-to-node $(echo %h | sed "s/waggle-dev-node-//" )<br/>
          {'    '}User waggle<br/>
          {'    '}IdentityFile ~/.ssh/ecdsa_waggle_dev # &lt;---- dev key from previous step<br/>
          {'    '}IdentitiesOnly yes<br/>
          {'    '}StrictHostKeyChecking no<br/>
        </div>
      } />


      <h3>3. SSH to node</h3>

      You can access a specific node by its VSN, if you have permissions. For example, you can SSH to node V030 using:

      <Clipboard content={'ssh waggle-dev-node-V030'} />

      Note that upon first connecting to a node, please check that the fingerprint matches:

      <pre>
        ED25519 key fingerprint is SHA256:0EZvahC0dry74dmu7DBjweZwGWMt2zvV7rWZTb3Ao9g.
      </pre>
    </Root>
  )
}

const Root = styled.div`
  // todo(nc)
  .delete {
    border-color: #660000;
  }

  [type=submit] {
    margin: 2em 0;
  }
`

const CopyToken = styled.div`
  margin-bottom: 2em;
`


