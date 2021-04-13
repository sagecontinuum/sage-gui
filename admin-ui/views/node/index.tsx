import React from 'react'
import {useParams} from 'react-router-dom'


export default function NodeView() {
  const {node} = useParams()

  return (
    <>
      <h3>{node}</h3>
      <p>This is a placeholder</p>
    </>
  )
}


