import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { Button, Alert, FormControl, OutlinedInput, FormLabel } from '@mui/material'

import { useProgress } from '/components/progress/ProgressProvider'
import Clipboard from '/components/utils/Clipboard'
import CopyBtn from '/components/utils/CopyBtn'
import useHasCapability from '/components/hooks/useHasCapability'
import * as User from '/components/apis/user'
import Auth from '/components/auth/auth'


import config from '/config'
const { contactUs } = config

const requestInfo =
`Name:
Organization or affiliation:
Sponsor:
Short description of the project:
Type of access:
  [Do you need development (shell) access, or only scheduling access?]
Nodes:
  [If known, please list the project or nodes you need access to.]
`


type Form = {
  ssh_public_keys: User.UserInfo['ssh_public_keys']
}

export default function DevAccess() {
  const {setLoading} = useProgress()

  const [error, setError] = useState(null)

  // form
  const [isSaving, setIsSaving] = useState(false)
  const [state, setState] = useState<Form>({ssh_public_keys: ''})

  const {hasCapability: isPermitted} = useHasCapability(['develop', 'schedule'])
  const {hasCapability: canDev} = useHasCapability('develop')

  useEffect(() => {
    if (!isPermitted) return

    setLoading(true)
    User.getUserInfo()
      .then(({ssh_public_keys}) => setState({ssh_public_keys}))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [setLoading, isPermitted])


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

      <CopyToken>
        <h1 className="no-margin">Your Access Token</h1>

        {isPermitted === true &&
          <div className="flex items-center justify-between gap">
            <div className="flex-grow">
              <pre style={{width: 375}}>
                **************************************
                <CopyBtn tooltip="Copy token" onClick={handleCopyToken} />
              </pre>
            </div>
            <div>
              <Alert severity="warning">
                <b>Note:</b> Treat this token as sensitive information, similar to a username and password.
                Please <b><a href={contactUs}>contact us</a></b> if you have any questions.
              </Alert>
            </div>
          </div>
        }

        {isPermitted === false && <p>
          <Alert severity="info">
            <b>Note</b> you do not have scheduling or developer access to any nodes.<br/>
            Please <b><a href={contactUs}>contact us</a></b> if you'd like access to a
            node. Once you have some permissions, your dev token will appear here
          </Alert>
        </p>}
      </CopyToken>

      <h1 className="no-margin">Update SSH Public Keys</h1>

      {!canDev && <p>
        <Alert severity="info">
          <b>Note</b> you do not have dev access on any nodes.
        </Alert>
      </p>}

      <p>
        To create SSH key pair on your machine, use:
        <Clipboard content="ssh-keygen -t ed25519 -f ~/.ssh/sage_key" />
        [Provide a password to secure the key]
      </p>

      <p>
        Next, copy the <b>public key</b> portion of the key into the input below.
        <Clipboard content="cat ~/.ssh/sage_key.pub" />
      </p>

      {state &&
        <FormControl className="flex column">
          <FormLabel id="ssk-keys">My SSH Public Keys</FormLabel>
          <OutlinedInput
            placeholder={
              `sh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK0LT3jNyfUtkJwxiv/7YfPU4PIOsQzeCVKlLCAfwlg3\\n` +
              `\n\n(no ssh key provided)`
            }
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

      <h2>Finish Setup for Node Access</h2>

      <p>Once you've updated your SSH public key above, you'll need to do the following steps.</p>

      <h3>1. Request dev access</h3>

      <p>
        First, <b><a href={contactUs} target="_blank" rel="noreferrer">email us</a></b> with
        the subject "Dev Access", along with with the following info about your request:
      </p>

      <Clipboard content={requestInfo} />

      <h3>2. Update SSH config</h3>

      <p>
        Next, you'll need to update your <code>~/.ssh/config</code> file to include the following lines:
      </p>

      <Clipboard content={
        <div>
          Host waggle-dev-sshd<br/>
          {'    '}HostName 192.5.86.5<br/>
          {'    '}Port 49190<br/>
          {'    '}User waggle<br/>
          {'    '}IdentityFile ~/.ssh/sage_key # &lt;---- your private key<br/>
          {'    '}IdentitiesOnly yes<br/>
          <br/>
          Host waggle-dev-node-*<br/>
          {'    '}ProxyCommand ssh waggle-dev-sshd connect-to-node $(echo %h | sed "s/waggle-dev-node-//" )<br/>
          {'    '}User waggle<br/>
          {'    '}IdentityFile ~/.ssh/sage_key<br/>
          {'    '}IdentitiesOnly yes<br/>
          {'    '}StrictHostKeyChecking no<br/>
        </div>
      } />


      <h3>3. SSH to node</h3>

      <p>
        You can access a specific node by its VSN, if you have permissions. For example, you can SSH to node V030 using:
      </p>

      <Clipboard content={'ssh waggle-dev-node-V030'} />

      <p>
        Note that upon first connecting to a node, please check that the fingerprint matches:
      </p>

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

  .clipboard-content {
    overflow-x: auto;
  }
`

const CopyToken = styled.div`
  margin-bottom: 2em;
`


