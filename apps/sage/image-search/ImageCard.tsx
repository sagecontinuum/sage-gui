import { useState } from 'react'
import {
  Box, Typography, Chip, IconButton, Tooltip, Dialog,
  DialogContent, Popover, useTheme
} from '@mui/material'

import { Download, InfoOutlined, Fullscreen, ChatBubbleOutline } from '@mui/icons-material'
import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'


export function CaptionWithKeywords({ caption, sx }: { caption: string, sx?: object }) {
  let captionText = caption
  let keywords: string[] = []
  if (caption) {
    const match = caption.match(/^caption:\s*(.*?)\s*keywords:\s*(.*)$/)
    if (match) {
      captionText = match[1]
      keywords = match[2].split(',').map(k => k.trim()).filter(Boolean)
    }
  }
  return (
    <Box sx={sx}>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 1 }}>{captionText}</Typography>
      {keywords.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {keywords.map((kw, idx) => (
            <Chip key={idx} label={kw} size="small" color="primary" />
          ))}
        </Box>
      )}
    </Box>
  )
}

export function ImageCard({ obj }) {
  const theme = useTheme()
  const [showCaption, setShowCaption] = useState(false)
  const [captionAnchor, setCaptionAnchor] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const imageContainerRef = useState(null)
  const [fullscreen, setFullscreen] = useState(false)

  const handleDownload = () => {
    window.open(obj.link, '_blank', 'noopener,noreferrer')
  }

  // For alt text, parse caption only
  let altText = obj.caption || 'image'
  if (obj.caption) {
    const match = obj.caption.match(/^caption:\s*(.*?)\s*keywords:/)
    if (match) altText = match[1]
  }

  return (
    <Box
      ref={el => imageContainerRef[1](el)}
      sx={{
        width: { xs: 250, sm: 300, md: 350 },
        height: { xs: 250, sm: 300, md: 350 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        background: theme.palette.background.paper,
        overflow: 'hidden',
        position: 'relative',
        '&:hover .image-actions': { opacity: 1 },
      }}
    >
      <img
        src={obj.link}
        alt={altText}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block',
          margin: 'auto',
        }}
        onClick={() => setFullscreen(true)}
      />
      <Box
        className="image-actions"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          opacity: 0,
          transition: 'opacity 0.2s',
          background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.7)',
          borderRadius: 2,
          padding: '4px 12px',
          alignItems: 'center',
        }}
      >
        <Tooltip title="Download image">
          <IconButton size="small" onClick={handleDownload} sx={{ color: '#fff' }}>
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>

        {obj.caption &&
          <Tooltip title="Show caption">
            <IconButton
              size="small"
              onClick={() => {
                setCaptionAnchor(imageContainerRef[0])
                setShowCaption(true)
              }}
              sx={{ color: '#fff' }}
            >
              <ChatBubbleOutline fontSize="small" sx={{ color: '#fff' }} />
            </IconButton>
          </Tooltip>
        }
        <Tooltip title="Full screen">
          <IconButton size="small" onClick={() => setFullscreen(true)} sx={{ color: '#fff' }}>
            <Fullscreen fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Show all details">
          <IconButton
            size="small"
            onClick={() => {
              setShowDetails(true)
            }}
            sx={{ color: '#fff' }}
          >
            <InfoOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Popover
        open={showCaption}
        anchorEl={captionAnchor}
        onClose={() => setShowCaption(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ sx: { p: 2, minWidth: { xs: 220, sm: 340, md: 400 }, maxWidth: 800 } }}
      >
        <CaptionWithKeywords caption={obj.caption} />
      </Popover>
      {showDetails && (
        <ConfirmationDialog
          title="Image Details"
          fullScreen={false}
          cancelBtn={false}
          confirmBtnText="Close"
          onClose={() => setShowDetails(false)}
          onConfirm={() => setShowDetails(false)}
          content={
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <img
                  src={obj.link}
                  alt={obj.caption || 'image'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 8,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 2px 8px rgba(0,0,0,0.5)'
                      : '0 2px 8px rgba(0,0,0,0.13)'
                  }}
                />
              </Box>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {Object.entries(obj).map(([key, value]) => (
                  <Box component="li" key={key} sx={{ mb: 1, display: 'flex', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ minWidth: 120, color: 'text.secondary' }}>{key}</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{String(value)}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          }
        />
      )}
      <Dialog open={fullscreen}
        onClose={() => setFullscreen(false)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0 }}>
          <img
            src={obj.link}
            alt={altText}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
