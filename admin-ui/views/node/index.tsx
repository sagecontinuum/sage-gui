import React from 'react'
import styled from 'styled-components'
import {useParams} from 'react-router-dom'

type Props = {

}

export default function (props: Props) {
  const {node} = useParams()

  return (
    <>
      <h3>{node}</h3>
      <p>This is a placeholder</p>
    </>
  )
}


