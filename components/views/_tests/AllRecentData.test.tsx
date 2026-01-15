import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import AllRecentData from './AllRecentData'

type NodeMeta = {
  name: string
  vsn: string
  description?: string
  shield?: boolean
}

const mockNodeMeta: NodeMeta = {
  name: 'WTST',
  vsn: 'WTST',
  description: 'Test Node',
  shield: true
}

const mockVSN = 'WTST'

test('displays all sections by default', () => {
  const {unmount} = render(
    <AllRecentData 
      vsn={mockVSN} 
      nodeMeta={mockNodeMeta}
    />
  )

  expect(screen.getByText('Recent Data')).toBeInTheDocument()
  expect(screen.getByText('Recent Images')).toBeInTheDocument()
  expect(screen.getByText('Recent Audio')).toBeInTheDocument()

  unmount()
})

test('hides data section when noData prop is true', () => {
  const {unmount} = render(
    <AllRecentData 
      vsn={mockVSN} 
      nodeMeta={mockNodeMeta}
      noData={true}
    />
  )

  expect(screen.queryByText('Recent Data')).not.toBeInTheDocument()
  expect(screen.getByText('Recent Images')).toBeInTheDocument()
  expect(screen.getByText('Recent Audio')).toBeInTheDocument()

  unmount()
})

test('hides images section when noImages prop is true', () => {
  const {unmount} = render(
    <AllRecentData 
      vsn={mockVSN} 
      nodeMeta={mockNodeMeta}
      noImages={true}
    />
  )

  expect(screen.getByText('Recent Data')).toBeInTheDocument()
  expect(screen.queryByText('Recent Images')).not.toBeInTheDocument()
  expect(screen.getByText('Recent Audio')).toBeInTheDocument()

  unmount()
})

test('hides audio section when noAudio prop is true', () => {
  const {unmount} = render(
    <AllRecentData 
      vsn={mockVSN} 
      nodeMeta={mockNodeMeta}
      noAudio={true}
    />
  )

  expect(screen.getByText('Recent Data')).toBeInTheDocument()
  expect(screen.getByText('Recent Images')).toBeInTheDocument()
  expect(screen.queryByText('Recent Audio')).not.toBeInTheDocument()

  unmount()
})

test('shows audio not supported message for nodes without shield', () => {
  const nodeMetaWithoutShield: NodeMeta = {
    ...mockNodeMeta,
    shield: false
  }

  const {unmount} = render(
    <AllRecentData 
      vsn={mockVSN} 
      nodeMeta={nodeMetaWithoutShield}
    />
  )

  expect(screen.getByText('Recent Audio')).toBeInTheDocument()
  expect(screen.getByText('This node does not support audio')).toBeInTheDocument()

  unmount()
})

test('renders with correct VSN prop', () => {
  const {unmount} = render(
    <AllRecentData 
      vsn="WTEST001" 
      nodeMeta={mockNodeMeta}
    />
  )

  expect(screen.getByText('Recent Data')).toBeInTheDocument()
  expect(screen.getByText('Recent Images')).toBeInTheDocument()
  expect(screen.getByText('Recent Audio')).toBeInTheDocument()

  unmount()
})

test('handles null nodeMeta gracefully', () => {
  const {unmount} = render(
    <AllRecentData 
      vsn={mockVSN} 
      nodeMeta={null}
    />
  )

  expect(screen.getByText('Recent Data')).toBeInTheDocument()
  expect(screen.getByText('Recent Images')).toBeInTheDocument()
  expect(screen.getByText('Recent Audio')).toBeInTheDocument()

  unmount()
})

test('applies correct CSS classes', () => {
  const {unmount} = render(
    <AllRecentData 
      vsn={mockVSN} 
      nodeMeta={mockNodeMeta}
    />
  )

  const root = document.querySelector('.flex.column')
  expect(root).toBeInTheDocument()

  unmount()
})

test('renders all sections with correct structure', () => {
  const {unmount} = render(
    <AllRecentData 
      vsn={mockVSN} 
      nodeMeta={mockNodeMeta}
    />
  )

  const headings = screen.getAllByRole('heading', {level: 2})
  expect(headings).toHaveLength(3)
  expect(headings[0]).toHaveTextContent('Recent Data')
  expect(headings[1]).toHaveTextContent('Recent Images')
  expect(headings[2]).toHaveTextContent('Recent Audio')

  unmount()
})