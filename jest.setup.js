import fetch from 'node-fetch'
import {prettyDOM as prettyPrint} from '@testing-library/react'

window.fetch = fetch
window.prettyDOM = (node) => console.log(prettyPrint(node))
