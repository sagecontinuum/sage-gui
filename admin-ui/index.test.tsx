import React from 'react';
import { render, screen } from '@testing-library/react';

import SatusPage from './views/status/StatusView'


jest.mock('mapbox-gl/dist/mapbox-gl', () => ({
  Map: () => ({})
}))



describe('App', () => {
  test('renders App component', () => {
    //render(<SatusPage />)
    //screen.debug()
  })
})