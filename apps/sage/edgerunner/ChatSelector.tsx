import { useCallback, useEffect, useState } from 'react'
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItemButton, ListItemText, Divider,
  Typography, CircularProgress, Box, Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { ListSubheader } from '/components/layout/Layout'
import * as SES from '/components/apis/ses'
import Auth from '/components/auth/auth'

const PLUGIN_NAME_PREFIX = 'edgerunner-demo'

const newChatButtonSx = {
  justifyContent: 'center',
  textTransform: 'none',
  fontSize: '0.85rem',
  fontWeight: 700,
  borderRadius: 1.25,
  borderColor: 'primary.light',
  color: 'primary.main',
  bgcolor: 'primary.50',
  py: 0.9,
  px: 1.25,
  '&:hover': {
    borderColor: 'primary.main',
    bgcolor: 'primary.100'
  }
}

function getJobPrompt(job: SES.Job): string {
  const args = job.plugins?.[0]?.plugin_spec?.args
  if (!Array.isArray(args)) return ''
  const idx = args.indexOf('--prompt')
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1]
  const inline = args.find(a => a.startsWith('--prompt='))
  return inline ? inline.slice('--prompt='.length) : ''
}

type Props = {
  currentJobId?: string | number
  onSelect: (job: SES.Job) => void
  onNew: () => void
  openSignal?: number
}

export default function ChatSelector({ currentJobId, onSelect, onNew, openSignal }: Props) {
  const [open, setOpen] = useState(false)
  const [jobs, setJobs] = useState<SES.Job[] | null>(null)
  const [loading, setLoading] = useState(false)
  const currentUser = Auth.user

  const handleOpen = useCallback(async () => {
    setOpen(true)
    if (jobs !== null) return
    setLoading(true)
    try {
      const all = await SES.getJobs()
      const chats = all.filter(j =>
        j.plugins?.some(p => p.name?.startsWith(PLUGIN_NAME_PREFIX)) &&
        (j.status === 'Running' || j.status === 'Suspended')
      )
      setJobs(chats)
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [jobs])

  useEffect(() => {
    if (!openSignal) return
    handleOpen()
  }, [openSignal, handleOpen])

  const handleSelect = (job: SES.Job) => {
    onSelect(job)
    setOpen(false)
  }

  const handleNew = () => {
    onNew()
    setOpen(false)
  }

  const myChats = jobs?.filter(j => j.user === currentUser) ?? []
  const otherChats = jobs?.filter(j => j.user !== currentUser) ?? []

  const currentJob = jobs?.find(j => String(j.job_id) === String(currentJobId))
  const currentPrompt = currentJob ? getJobPrompt(currentJob) : ''
  const truncated = currentPrompt.length > 40 ? currentPrompt.slice(0, 40) + '…' : currentPrompt
  const label = currentJobId ? (`Chat: #${currentJobId} - ${truncated}` || `Chat: #${currentJobId}`) : 'Select a chat'

  return (
    <>
      <Button
        size="small"
        variant="text"
        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: '1rem !important' }} />}
        onClick={handleOpen}
        sx={{ textTransform: 'none', fontSize: '0.8rem', color: 'text.secondary', ml: 1 }}
      >
        {label}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Select a chat</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {!loading && (
            <List dense disablePadding>
              <Box sx={{ p: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                  onClick={handleNew}
                  sx={newChatButtonSx}
                >
                  New chat
                </Button>
              </Box>

              <Divider />

              {myChats.length > 0 && (
                <>
                  <br/>
                  <ListSubheader>My chats</ListSubheader>
                  {myChats.map(job => (
                    <ListItemButton
                      key={job.job_id}
                      selected={String(job.job_id) === String(currentJobId)}
                      onClick={() => handleSelect(job)}
                    >
                      <ListItemText
                        primary={getJobPrompt(job) || job.name}
                        secondary={
                          <Box component="span"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}>
                            <Chip size="small" label={job.status} sx={{ fontSize: '0.65rem', height: 16 }} />
                            {(job.nodes as string[])?.map(vsn => (
                              <Chip
                                key={vsn}
                                size="small"
                                variant="outlined"
                                label={vsn}
                                sx={{ fontSize: '0.65rem', height: 16 }}
                              />
                            ))}
                            <span>{new Date(job.state?.last_updated).toLocaleDateString()}</span>
                          </Box>
                        }
                        primaryTypographyProps={{ noWrap: true }}
                      />
                    </ListItemButton>
                  ))}
                </>
              )}

              {otherChats.length > 0 && (
                <>
                  <br/>
                  <Divider />
                  <ListSubheader>Others' chats</ListSubheader>
                  {otherChats.map(job => (
                    <ListItemButton
                      key={job.job_id}
                      selected={String(job.job_id) === String(currentJobId)}
                      onClick={() => handleSelect(job)}
                    >
                      <ListItemText
                        primary={getJobPrompt(job) || job.name}
                        secondary={
                          <Box
                            component="span"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}
                          >
                            <Typography component="span" variant="caption" fontWeight={600}>{job.user}</Typography>
                            <span>·</span>
                            <Chip size="small" label={job.status} sx={{ fontSize: '0.65rem', height: 16 }} />
                            {(job.nodes as string[])?.map(vsn => (
                              <Chip
                                key={vsn}
                                size="small"
                                variant="outlined"
                                label={vsn}
                                sx={{ fontSize: '0.65rem', height: 16 }}
                              />
                            ))}
                          </Box>
                        }
                        primaryTypographyProps={{ noWrap: true }}
                      />
                    </ListItemButton>
                  ))}
                </>
              )}

              {!loading && jobs?.length === 0 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">No previous chats found.</Typography>
                </Box>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
