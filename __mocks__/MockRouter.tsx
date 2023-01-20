import React from 'react'
import { BrowserRouter } from 'react-router-dom'


export default function MockRouter({ children }: any) {
  return <BrowserRouter>{children}</BrowserRouter>
}

