
import styled from 'styled-components'

import MuiAccordion from '@mui/material/Accordion'
import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { Theme } from '@mui/material/styles'

export default styled(MuiAccordion) `
  position: relative;
  border: 1px solid #ddd;
  border-radius: 0 2px 2px 0 ;
  border-left: 2px solid #ddd;

  :hover:not(.Mui-expanded) {
    border-left: 2px solid rgb(28, 140, 201);
    .caret {
      color: rgb(28, 140, 201);
    }
  }

  .MuiAccordionSummary-content {
    display: block;
    margin: 10px 0;
  }

  .tag-actions {
    visibility: hidden;
  }

  :hover .tag-actions {
    visibility: visible;
  }
`

// todo(nc): refactor to drop makestyles
export const useAccordionStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginBottom: -1,
      boxShadow: 'none'
    },
    heading: {
      fontWeight: 'bold',
      fontSize: theme.typography.pxToRem(15),
      flexBasis: '33.33%',
      flexShrink: 0,
    },
    secondaryHeading: {
      marginRight: 'auto',
      fontSize: theme.typography.pxToRem(14),
      color: theme.palette.text.secondary,
    },
  })
)

