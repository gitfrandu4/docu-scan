import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Drawer,
  IconButton,
  Slider,
  Typography,
  SpeedDial,
  SpeedDialIcon,
  Popover,
  Paper
} from '@mui/material'
import { MdSettings, MdClose, MdInfo } from 'react-icons/md'

const defaultSettings = {
  minAreaRatio: 0.15,
  maxAngleRange: 70,
  gaussianBlurSize: 3,
  sharpenWeight: 1.2,
  morphKernelSize: 5,
  cannyLow: 20,
  cannyHigh: 60,
  adaptiveBlockSize: 21,
  adaptiveC: 10
}

const settingsInfo = {
  minAreaRatio: {
    title: 'Minimum Area Ratio',
    description:
      'Controls how small a detected document can be relative to the image size. Lower values allow smaller documents to be detected, higher values require documents to occupy more of the frame.',
    effect: '↑ More strict detection\n↓ More permissive detection'
  },
  maxAngleRange: {
    title: 'Maximum Angle Range',
    description:
      'Maximum allowed difference between the angles in the detected document. Controls how skewed or rotated a document can be.',
    effect: '↑ Accepts more skewed documents\n↓ Requires more aligned documents'
  },
  gaussianBlurSize: {
    title: 'Blur Kernel Size',
    description:
      'Size of the Gaussian blur kernel. Controls how much the image is smoothed before processing.',
    effect:
      '↑ More blur, reduces noise but loses detail\n↓ Less blur, keeps detail but may include noise'
  },
  sharpenWeight: {
    title: 'Sharpening Strength',
    description:
      'Controls how much the image is sharpened after processing. Enhances edges and text.',
    effect:
      '↑ Stronger sharpening, clearer text but may amplify noise\n↓ Softer sharpening, smoother image'
  },
  morphKernelSize: {
    title: 'Morphological Kernel Size',
    description:
      'Size of the kernel used for morphological operations. Affects how edges and shapes are processed.',
    effect:
      '↑ Stronger morphological effect, better for poor lighting\n↓ Softer effect, better for clear images'
  },
  cannyThresholds: {
    title: 'Edge Detection Thresholds',
    description:
      'Controls how edges are detected in the image. Lower values detect more edges, higher values detect only stronger edges.',
    effect: '↑ Detects only strong edges\n↓ Detects more subtle edges'
  },
  adaptiveBlockSize: {
    title: 'Adaptive Block Size',
    description:
      'Size of the pixel neighborhood used for adaptive thresholding. Must be odd.',
    effect:
      '↑ Better for larger text and features\n↓ Better for smaller text and details'
  },
  adaptiveC: {
    title: 'Adaptive Threshold Constant',
    description:
      'Constant subtracted from the mean in adaptive thresholding. Controls contrast sensitivity.',
    effect:
      '↑ Higher contrast, may lose detail\n↓ Lower contrast, may keep more detail'
  }
}

const SettingItem = ({
  label,
  value,
  onChange,
  info,
  min,
  max,
  step,
  marks,
  range
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const handlePopoverOpen = (event) => setAnchorEl(event.currentTarget)
  const handlePopoverClose = () => setAnchorEl(null)
  const open = Boolean(anchorEl)

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography>{label}</Typography>
        <IconButton size="small" onClick={handlePopoverOpen} sx={{ ml: 1 }}>
          <MdInfo />
        </IconButton>
      </Box>
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        marks={marks}
        valueLabelDisplay="auto"
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <Paper sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {info.title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {info.description}
          </Typography>
          <Typography
            variant="caption"
            component="pre"
            sx={{
              whiteSpace: 'pre-line',
              backgroundColor: 'rgba(0,0,0,0.05)',
              p: 1,
              borderRadius: 1
            }}
          >
            {info.effect}
          </Typography>
        </Paper>
      </Popover>
    </Box>
  )
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

          <SettingItem
            label={t('settings.minAreaRatio')}
            value={settings.minAreaRatio}
            onChange={handleChange('minAreaRatio')}
            info={settingsInfo.minAreaRatio}
            min={0.1}
            max={0.5}
            step={0.05}
          />

          <SettingItem
            label={t('settings.maxAngleRange')}
            value={settings.maxAngleRange}
            onChange={handleChange('maxAngleRange')}
            info={settingsInfo.maxAngleRange}
            min={20}
            max={90}
          />

          <SettingItem
            label={t('settings.gaussianBlurSize')}
            value={settings.gaussianBlurSize}
            onChange={handleChange('gaussianBlurSize')}
            info={settingsInfo.gaussianBlurSize}
            min={1}
            max={9}
            step={2}
            marks
          />

          <SettingItem
            label={t('settings.sharpenWeight')}
            value={settings.sharpenWeight}
            onChange={handleChange('sharpenWeight')}
            info={settingsInfo.sharpenWeight}
            min={1}
            max={3}
            step={0.1}
          />

          <SettingItem
            label={t('settings.morphKernelSize')}
            value={settings.morphKernelSize}
            onChange={handleChange('morphKernelSize')}
            info={settingsInfo.morphKernelSize}
            min={3}
            max={15}
            step={2}
            marks
          />

          <SettingItem
            label={t('settings.cannyThresholds')}
            value={[settings.cannyLow, settings.cannyHigh]}
            onChange={(event, newValue) => {
              onSettingsChange({
                ...settings,
                cannyLow: newValue[0],
                cannyHigh: newValue[1]
              })
            }}
            info={settingsInfo.cannyThresholds}
            min={0}
            max={255}
          />

          <SettingItem
            label={t('settings.adaptiveBlockSize')}
            value={settings.adaptiveBlockSize}
            onChange={handleChange('adaptiveBlockSize')}
            info={settingsInfo.adaptiveBlockSize}
            min={3}
            max={51}
            step={2}
            marks
          />

          <SettingItem
            label={t('settings.adaptiveC')}
            value={settings.adaptiveC}
            onChange={handleChange('adaptiveC')}
            info={settingsInfo.adaptiveC}
            min={0}
            max={30}
            step={1}
          />
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
