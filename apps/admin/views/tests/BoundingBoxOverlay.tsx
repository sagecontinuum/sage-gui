import { FC } from 'react'
import styled from 'styled-components'

const ImageContainer = styled.div`
  position: relative;
  width: 350px;
`

const OverlayBox = styled.svg<{ top: number; left: number; width: number; height: number }>`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  border: 2px solid red;
`

const Image = styled.img`
  width: 100%;
`

interface BoundingBoxOverlayProps {
  imageUrl: string;
  box: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

const BoundingBoxOverlay: FC<BoundingBoxOverlayProps> = ({ imageUrl, box }) => {
  return (
    <ImageContainer>
      <Image src={imageUrl} alt="Overlay Image" />
      <OverlayBox
        top={box.top}
        left={box.left}
        width={box.width}
        height={box.height}
        viewBox={`0 0 ${box.width} ${box.height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100%" height="100%" fill="none" stroke="red" strokeWidth="2" />
      </OverlayBox>
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