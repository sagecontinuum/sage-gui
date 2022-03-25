import styled from 'styled-components'


const HOT_SPOT_SIZE = 20


export default function Hotspot(props) {
  const {top, left, title} = props

  return (
    <HotspotRoot {...props}>
      <div className="title">{title}</div>
      <HotspotDot>
        <div className="dot"></div>
      </HotspotDot>
    </HotspotRoot>
  )
}

const getLabelTop = (pos) => {
  if (pos == 'left')
    return '0px'
  else if (pos == 'bottom')
    return '20px'
  return '-20px'
}


const getLabelLeft = (pos) => {
  if (pos == 'left')
    return `-${HOT_SPOT_SIZE + 5}px`
  return '0'
}


const getLabelJustifyContent = (pos) => {
  if (pos == 'left')
    return 'right'
  return 'center'
}


const HotspotRoot = styled.div<{top: string, left: string, pos?: 'left' }>`
  position: absolute;
  top: ${props => props.top};
  left: ${props => props.left};

  .title {
    position: absolute;
    white-space: nowrap;
    font-weight: 800;
    font-size: 1.0em;
    color: #1283c8;
    background: none;
    text-shadow: 0 0 1px #1283c8;
    width: 100%;
    height: 100%;
    display: flex;
    top: ${({pos}) => getLabelTop(pos)};
    left: ${({pos}) => getLabelLeft(pos)};
    justify-content: ${({pos}) => getLabelJustifyContent(pos)};
    align-items: center;
  }
`

const HotspotDot = styled.div`
  position: relative;

  .dot {
    width: ${HOT_SPOT_SIZE}px;
    height: ${HOT_SPOT_SIZE}px;
    border: 3px solid rgb(255, 255, 255, 0.8);
    border-radius: 50%;
    animation: pulse 2s ease infinite;
    transition: all 0.2s;
    text-decoration: none;
    font-weight: bold;
    font-family: sans-serif;
    color: #555;
    box-shadow: 0 0 4px #000;
  }

  .dot:after {
    content: "";
    width: ${HOT_SPOT_SIZE - 6}px;
    height: ${HOT_SPOT_SIZE - 6}px;
    background-color: #1283c8;
    border-radius: 50%;
    display: block;
    transition: all 0.2s;
  }

  .dot:hover {
    border-color: #1283c8 !important;
    animation-play-state: paused;
    color: #fff;
  }

  .dot:hover::after {
    background-color: #9ec7e0;
  }

  /*
  @keyframes pulse {
    50% { border-color: rgb(255, 255, 255, 0.2); }
    100% { border-color: rgb(255, 255, 255, 0.8); }
  }*/
`

