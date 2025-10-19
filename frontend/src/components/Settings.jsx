import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import UpdatePanel from './UpdatePanel';

const Settings = ({ navigateTo }) => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button onClick={() => navigateTo('dashboard')}>返回</Button>
        <Typography variant="h4" component="h1" gutterBottom>
          设置
        </Typography>
        <UpdatePanel />
      </Box>
    </Container>
  );
};

export default Settings;
