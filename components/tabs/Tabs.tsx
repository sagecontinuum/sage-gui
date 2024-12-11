import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'


const tabLabel = (
  icon: JSX.Element,
  label: string,
  counts: {[tab: string]: number} = {}
) =>
  <div className="flex items-center">
    {icon}&nbsp;{label}&nbsp;
    {label in counts && counts[label] === undefined && '(…)'}
    {counts[label] !== undefined && `(${counts[label]})`}
  </div>



export {
  Tabs,
  Tab,
  tabLabel
}
