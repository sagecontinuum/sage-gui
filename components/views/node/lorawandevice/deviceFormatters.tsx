import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'
import InactiveIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import QuestionIcon from '@mui/icons-material/HelpOutline';

import Tooltip from '@mui/material/Tooltip'

export function status(val,obj) {
    if(!val)
    {
        return (
            <Tooltip
                title={`No activity from device`}
                componentsProps={{tooltip: { sx: { background: '#000' }}}}
                placement="top"
                >
                <InactiveIcon className="inactive status-icon" />
            </Tooltip>
        )
    }

    // Convert the last_seen_at from ISO string to Date
    const lastSeenDate = new Date(val);

    // Calculate the current time in milliseconds
    const currentTime = new Date().getTime();

    // Format lastSeenDate in the desired format
    const formattedLastSeenDate = lastSeenDate.toLocaleString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        });

    // Determine the status based on the comparison
    let icon;
    let interval_tooltip;

    if(obj.expected_uplink_interval_sec === null || obj.expected_uplink_interval_sec === undefined)
    {
        interval_tooltip = 'Expected Interval: Not set'

        icon = <QuestionIcon className="QuestionIcon status-icon" />
    }
    else
    {
        // Calculate the expected last seen time based on expected_uplink_interval_sec
        const expectedLastSeenTime = new Date(currentTime - obj.expected_uplink_interval_sec * 1000);

        if (lastSeenDate >= expectedLastSeenTime) {
            icon = <CheckIcon className="success status-icon" />;
        } else {
            icon = <ErrorIcon className="failed status-icon" />;
        }

        interval_tooltip = `Expected Interval: ${obj.expected_uplink_interval_sec} sec`
    }

    return (
        <Tooltip
        title={
            <>
                Last Seen: {formattedLastSeenDate}<br/>
                {interval_tooltip}
            </>
        }
        componentsProps={{tooltip: { sx: { background: '#000' }}}}
        placement="top"
        >
        {icon}
        </Tooltip>
    )
}
