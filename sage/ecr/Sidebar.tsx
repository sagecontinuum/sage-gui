import React from 'react'
import styled from 'styled-components'
import { NavLink, Link, useLocation} from 'react-router-dom'

import Button from '@material-ui/core/Button'
import UserIcon from '@material-ui/icons/AccountCircleRounded'
import SharedIcon from '@material-ui/icons/SupervisedUserCircle'
import PublicIcon from '@material-ui/icons/PublicRounded'
import AddIcon from '@material-ui/icons/AddRounded'
import Divider from '@material-ui/core/Divider'



export default function Sidebar() {
  let location = useLocation()

  return (
    <Root>
      <NewApp>
        <Button
          component={Link}
          to="/apps/create-app"
          variant="contained"
          color="primary"
          disabled={location.pathname == '/apps/create-app'}
          fullWidth
        >
          <AddIcon/> Add App
        </Button>
      </NewApp>

      <Divider style={{margin: '20px 10px'}}/>


      {/*<Item to="/apps/certified-apps">
        <span className="material-icons">
          verified
        </span>&nbsp;Certified Apps
      </Item>*/}

      <Item to="/apps/explore"><PublicIcon /> Explore</Item>
      <Item to="/apps/my-apps"><UserIcon/> My Apps</Item>
      <Item to="/apps/shared-with-me"><SharedIcon /> Shared with Me</Item>
    </Root>
  )
}

const Root = styled.div`
  padding-top: 20px;
  min-width: 200px;
  border-right: 1px solid #ddd;
`

const NewApp = styled.div`
  margin: 10px;
`


const primaryColor = 'rgb(28, 140, 201)'
const secondaryColor = '#8166a0'

const Item = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 10px;
  width: 100%;
  color: #444;
  font-size: 1.1em;

  :hover{
    text-decoration: none;
  }

  :hover:not(.active) {
    color: #000;
  }

  .MuiSvgIcon-root {
    margin-right: 5px;
  }

  &.active {
    border-right: 3px solid ${primaryColor};
    background: rgb(243, 243, 243);
    font-weight: 800;
  }

  &.active .MuiSvgIcon-root {
    color: ${primaryColor};
  }
`

