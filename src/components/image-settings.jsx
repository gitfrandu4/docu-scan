import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Drawer,
  IconButton,
  Slider,
  Typography,
  SpeedDial,
  SpeedDialIcon
} from '@mui/material'
import { MdSettings, MdClose } from 'react-icons/md'

const defaultSettings = {
  minAreaRatio: 0.25,
  maxAngleRange: 50,
  gaussianBlurSize: 3,
  sharpenWeight: 1.5,
  morphKernelSize: 9,
  cannyLow: 0,
  cannyHigh: 84
}

const ImageSettings = ({ settings, onSettingsChange }) => {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  const handleChange = (key) => (event, newValue) => {
    onSettingsChange({ ...settings, [key]: newValue })
  }

  return (
    <>
      <SpeedDial
        ariaLabel={t('settings.openMenu')}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon icon={<MdSettings />} />}
        onClick={() => setOpen(true)}
      />

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: 320, padding: 2 }
        }}
      >
        <Box sx={{ width: '100%', paddingTop: 1 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Typography variant="h6">{t('settings.title')}</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <MdClose />
            </IconButton>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>{t('settings.minAreaRatio')}</Typography>
            <Slider
              value={settings.minAreaRatio}
              onChange={handleChange('minAreaRatio')}
              min={0.1}
              max={0.5}
              step={0.05}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>{t('settings.maxAngleRange')}</Typography>
            <Slider
              value={settings.maxAngleRange}
              onChange={handleChange('maxAngleRange')}
              min={20}
              max={90}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              {t('settings.gaussianBlurSize')}
            </Typography>
            <Slider
              value={settings.gaussianBlurSize}
              onChange={handleChange('gaussianBlurSize')}
              min={1}
              max={9}
              step={2}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>{t('settings.sharpenWeight')}</Typography>
            <Slider
              value={settings.sharpenWeight}
              onChange={handleChange('sharpenWeight')}
              min={1}
              max={3}
              step={0.1}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              {t('settings.morphKernelSize')}
            </Typography>
            <Slider
              value={settings.morphKernelSize}
              onChange={handleChange('morphKernelSize')}
              min={3}
              max={15}
              step={2}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              {t('settings.cannyThresholds')}
            </Typography>
            <Slider
              value={[settings.cannyLow, settings.cannyHigh]}
              onChange={(event, newValue) => {
                onSettingsChange({
                  ...settings,
                  cannyLow: newValue[0],
                  cannyHigh: newValue[1]
                })
              }}
              min={0}
              max={255}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

ImageSettings.defaultProps = {
  settings: defaultSettings
}

export { defaultSettings }
export default ImageSettings
