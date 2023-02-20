import React, { useEffect, useState } from 'react'
import {Link} from 'react-router-dom'
import styled from 'styled-components'
import {Item} from '../common/Layout'
import Arrow from '@material-ui/icons/PlayCircleOutlineRounded'


import createAppImg from 'url:./create-app.png'


const scienceTexts = [
  'Climate Research',
  'Wildfire Detection',
  'Urban Health & Saftey',
  'Water Segmentation',
  'Weather Prediction',
  'Science',
  'Discovery'
]


export default function Home() {

  return (
    <Root>
      <Banner className="flex">
        <BannerLeft>
          AI @ the Edge<br/>
          for<br/>
          <TypeWriter texts={scienceTexts}>{' '}</TypeWriter>
        </BannerLeft>

        <BannerRight className="flex column justify-center items-center">
          <div>
            <h3>Getting Started</h3>
            <Link to="docs/Overview/">Documentation <Arrow className="shadow" /></Link>
            <Link to="data/">Browse Data <Arrow/></Link>
          </div>
        </BannerRight>
      </Banner>


      <Overview>
        <Subtext>
          Designing and building a new kind of national-scale reusable cyberinfrastructure
          to enable AI at the edge.
        </Subtext>

        <Cards>
          <Card>
            <img src="https://sagecontinuum.org/wp-content/uploads/2019/11/LofT-Wrigley-Jose-Osorio-Chicago-Tribune-.jpg" />
            <h3>Learn</h3>
            <p>[Sage's goal on Education].  Read more the Sage project</p>
          </Card>
          <Card>
            <img src={createAppImg} />
            <h3>Contribute</h3>
            <p>Upload, build, and share <Link to="apps">apps</Link> for AI at the edge</p>
          </Card>
          <Card>
            <img src="https://sagecontinuum.org/wp-content/uploads/2019/11/Wagman-v4.jpg" />
            <h3>Run</h3>
            <p>
              Schedule jobs to run on nodes.<br/>
              <span className="muted">(Expected later 2021)</span>
            </p>
          </Card>
          <Card>
            <h3>Browse</h3>
            <p>Browse <Link to="data">data</Link> from sensors and edge apps</p>
          </Card>
          <Card>
            <img src="https://sagecontinuum.org/wp-content/uploads/2019/11/1820-1024-tweak.jpg" />
            <h3>Analyze</h3>
            <p>Use Sage APIs to fetch, analyze data, or integrate data.</p>
          </Card>
        </Cards>
      </Overview>


      <footer className="flex justify-around">
        <div>
          <h4>About</h4>
          <ul>
            <li><a href="https://sagecontinuum.org/news/" target="_blank" rel="noreferrer">news</a></li>
            <li><Link to="apps/">Apps</Link></li>
          </ul>

        </div>
        <div>
          <h4>Browse</h4>
          <ul>
            <li><Link to="/">browse 1</Link></li>
            <li><Link to="/">browse 2</Link></li>
            <li><Link to="/">foo bar</Link></li>
            <li><Link to="/">some link</Link></li>
          </ul>
        </div>
        <div>
          <h4>contact</h4>
          <ul>
            <li><Link to="/">contact us</Link></li>
          </ul>
        </div>
      </footer>
    </Root>
  )
}

const textPurple = '#51447a'

const Root = styled.div`
  footer {
    color: #f2f2f2;
    height: 500px;
    background: #2b2b2b;

    h5 {

    }
    ul {
      padding:0 ;
      list-style: none;
      a {
        color: #999999;
      }
    }
  }
`


const Banner = styled.div`
  padding: 40px;
  height: 500px;
  background: radial-gradient(farthest-side ellipse at 0% 0,#87baa6 20%,#382d64);
  text-shadow: 0px 0px 6px #666;

  .typed-text {
    color: #daff6b;
    text-shadow: 0px 0px 10px #858585;
  }

`

const BannerLeft = styled.div`
  color: #f9f9f9;
  font-size: 4em;
  flex: 1;
  margin: auto 0;
`

const BannerRight = styled.div`
  flex: 1;
  h3 {
    color: #ccc;
  }
  a {
    color: #f2f2f2;
    font-size: 2em;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .shadow {
    filter: drop-shadow( 0px 0px 2px #414141);
  }
`

const Subtext = styled.div`
  font-size: 2em;
  margin: auto;
  width: 50%;
  padding: 2em;
  text-align: center;
  color: ${textPurple};
`

const Overview = styled.div`
  height: 600px;
  background: #ffffff;
`

const Cards = styled.div`
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
`

const Card = styled(Item)`
  padding: 0;
  max-width: 250px;
  background: #fff;

  img {
    max-width:100%;
    max-height:100px;
    border-radius: 5px 5px 0 0;
  }

  p, h3 {
    padding: 15px;
  }

  border-bottom: 3px solid #7a6bac;
  :hover {
    border: 1px solid #7a6bac;
    border-bottom: 3px solid #7a6bac;
  }
`




function TypeWriter(props) {

  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)

  const [phraseIndex, setPhraseIndex] = useState(0)
  const [fullText, setFullText] = useState(props.texts[phraseIndex] || '')


  // typing effect
  useEffect(() => {
    if (index >= fullText.length)
      return

    const handle = setTimeout(() => {
      setText(`${text}${fullText[index]}`)
      setIndex(index + 1)
    }, 50)

    return () => clearTimeout(handle)
  }, [index, fullText, text])


  // changing text index
  useEffect(() => {
    function update() {
      const handle = setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % props.texts.length)
        update()
      }, 3000)

      return handle
    }

    const handle = update()

    return () => clearTimeout(handle)
  }, [])


  // change actual text, reset index/text
  useEffect(() => {
    setIndex(0)
    setText('')
    setFullText(props.texts[phraseIndex])
  }, [phraseIndex])


  return (
    <div className="typed-text">{text ? text : <>&nbsp;</>}</div>
  )
}