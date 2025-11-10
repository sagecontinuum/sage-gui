import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { Button, Alert, FormControl, OutlinedInput, FormLabel } from '@mui/material'

import { useProgress } from '/components/progress/ProgressProvider'
import Clipboard from '/components/utils/Clipboard'
import CopyBtn from '/components/utils/CopyBtn'
import useHasCapability from '/components/hooks/useHasCapability'
import useIsApproved from '/components/hooks/useIsApproved'
import * as User from '/components/apis/user'
import Auth from '/components/auth/auth'
import { Step, StepTitle } from '/components/layout/FormLayout'


import config from '/config'
const { contactUs } = config

const DEV_SCHEDULE_PERMS = ['develop', 'schedule'] as User.AccessPerm[]
const DEV_PERM = 'develop' as User.AccessPerm


const requestInfo =
`Name:
Organization or affiliation:
Short description of the project:
Sponsor:
  [Please provide your PI's name and/or all funding sources associated with this request]
Type of access (check all that apply):
  [ ] Protected file download access
  [ ] Development (shell) access
  [ ] Scheduling access
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

  const {isApproved} = useIsApproved()
  const {hasCapability: isPermitted} = useHasCapability(DEV_SCHEDULE_PERMS)
  const {hasCapability: canDev} = useHasCapability(DEV_PERM)

  useEffect(() => {
    if (!isApproved) return

    setLoading(true)
    User.getUserInfo()
      .then(({ssh_public_keys}) => setState({ssh_public_keys}))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [isApproved, setLoading])


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

        {(isPermitted || isApproved) ?
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
          :
          <Alert severity="info">
            <b>Note:</b> your account hasn't been approved or you do not have file access,
            scheduling permissions, or developer access to any nodes.<br/>
            Once you have permissions, your access token will appear here<br/>
            <br/>
            <b>Need developer and/or scheduling access?</b>  Please follow the rest of the
            instructions on this page.<br/>
            <b>Only need file access for protected data?</b> Please complete
            the <b>"Request access"</b> section below.
          </Alert>
        }
      </CopyToken>

      <h1 className="no-margin">Update SSH Public Keys</h1>

      {!canDev && <p>
        <Alert severity="info">
          <b>Note:</b> you do not have dev access on any nodes.  Please <b><a href={contactUs}>contact us</a></b> if
          you'd like developer access.
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

      <StepTitle icon="1" label="Request access" />
      <Step>
        <p>
          First, <b><a href={contactUs} target="_blank" rel="noreferrer">email us</a></b> with
          the subject "Access Request", along with with the following info about your request:
        </p>

        <Clipboard content={requestInfo} />
      </Step>

      <StepTitle icon="2" label="Update SSH config" />
      <Step>
        <p>
          Next, you'll need to update your <code>~/.ssh/config</code> file to include the following lines:
        </p>

        <Clipboard content={
          <div>
            Host waggle-dev-sshd<br/>
            {'    '}HostName beekeeper.sagecontinuum.org<br/>
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
      </Step>

      <StepTitle icon="3" label="SSH to node" />
      <Step>
        <p>
          You can access a specific node by its VSN, if you have permissions.
          For example, you can SSH to node V030 using:
        </p>

        <Clipboard content={'ssh waggle-dev-node-V030'} />

        <p>
          Note that upon first connecting to a node, please check that the fingerprint matches:
        </p>

        <pre>
          ED25519 key fingerprint is SHA256:0EZvahC0dry74dmu7DBjweZwGWMt2zvV7rWZTb3Ao9g.
        </pre>
      </Step>
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


  h3 {
    margin:0;
  }
`

const CopyToken = styled.div`
  margin-bottom: 2em;
`


