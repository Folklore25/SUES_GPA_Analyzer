import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, LinearProgress } from '@mui/material';

function DownloadProgress({ open, message, progress }) {
  const percent = progress || 0;

  return (
    <Dialog
      open={open}
      aria-labelledby="download-progress-title"
    >
      <DialogTitle id="download-progress-title">环境准备</DialogTitle>
      <DialogContent sx={{ width: 400 }}>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Typography gutterBottom>{message || '正在准备...'}</Typography>
          <LinearProgress variant="determinate" value={percent} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">{percent}%</Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default DownloadProgress;