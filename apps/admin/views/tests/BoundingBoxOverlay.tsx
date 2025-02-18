import { FC } from 'react'
import styled from 'styled-components'

const ImageContainer = styled.div`
  position: relative;
  width: 350px;
`

const Image = styled.img`
  width: 100%;
`

interface BoundingBoxOverlayProps {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const BoundingBoxOverlay: FC<BoundingBoxOverlayProps> = ({ src, x, y, width, height }) => {
  return (
    <ImageContainer>
      <Image src={src} />
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke="red"
          strokeWidth="2"
        />
      </svg>
    </ImageContainer>
  )
}

export default BoundingBoxOverlay



/*
                const box = {
                  top: 50,
                  left: 30,
                  width: 100,
                  height: 150,
                };

                // Usage
                <BoundingBoxOverlay imageUrl="path/to/your/image.jpg" box={box} />
                */