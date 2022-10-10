// see https://github.com/mui/material-ui/issues/18091#issuecomment-1019191094

import { forwardRef, FC } from 'react'
import ToggleButton, { ToggleButtonProps } from '@mui/material/ToggleButton'
import Tooltip, { TooltipProps } from '@mui/material/Tooltip'

type TooltipToggleButtonProps = ToggleButtonProps & {
  TooltipProps: Omit<TooltipProps, 'children'>
}

// eslint-disable-next-line react/display-name
const TooltipToggleButton: FC<TooltipToggleButtonProps> = forwardRef(
  ({ TooltipProps, ...props }, ref) => {
    return (
      <Tooltip {...TooltipProps}>
        <ToggleButton ref={ref} {...props} />
      </Tooltip>
    )
  }
)

export default TooltipToggleButton