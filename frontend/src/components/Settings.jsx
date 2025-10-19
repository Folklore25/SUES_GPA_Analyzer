import React from 'react';
import { Container, Typography, Box, Button, Divider } from '@mui/material';
import UpdatePanel from './UpdatePanel';
import ApiKeyManager from './ApiKeyManager';

const Settings = ({ navigateTo }) => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button onClick={() => navigateTo('dashboard')}>返回</Button>
        <Typography variant="h4" component="h1" gutterBottom>
          设置
        </Typography>
        
        <ApiKeyManager />

        <Divider sx={{ my: 4 }} />

        <UpdatePanel />
      </Box>
    </Container>
  );
};

export default Settings;
