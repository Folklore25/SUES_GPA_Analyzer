import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, CardContent, Typography, TextField, Box, CircularProgress, Snackbar, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const ApiKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '' });

  const providers = useMemo(() => {
    // Filter out freemium models and get unique providers
    const userProviders = models.filter(m => m.type === 'user');
    const uniqueProviders = [...new Map(userProviders.map(item => [item.provider, item])).values()];
    return uniqueProviders;
  }, [models]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const availableModels = await window.electronAPI.getAiModels();
        const userModels = availableModels.filter(m => m.type === 'user');
        setModels(userModels);
        if (userModels.length > 0) {
          const initialProvider = userModels[0];
          setSelectedProvider(initialProvider.provider);
          const key = await window.electronAPI.loadApiKey(initialProvider.apiKeyService);
          setApiKey(key);
        }
      } catch (error) {
        setNotification({ open: true, message: `Error loading initial data: ${error.message}` });
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleProviderChange = async (event) => {
    const providerName = event.target.value;
    setSelectedProvider(providerName);
    const providerConfig = providers.find(p => p.provider === providerName);
    if (providerConfig) {
      setIsLoading(true);
      try {
        const key = await window.electronAPI.loadApiKey(providerConfig.apiKeyService);
        setApiKey(key);
      } catch (error) {
        setNotification({ open: true, message: `Error loading API Key: ${error.message}` });
        setApiKey('');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = async () => {
    const providerConfig = providers.find(p => p.provider === selectedProvider);
    if (!providerConfig) {
      setNotification({ open: true, message: 'Please select a valid provider.' });
      return;
    }
    setIsSaving(true);
    try {
      await window.electronAPI.saveApiKey(apiKey, providerConfig.apiKeyService);
      setNotification({ open: true, message: `${selectedProvider} API Key saved successfully!` });
    } catch (error) {
      setNotification({ open: true, message: `Error saving API Key: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">AI Planner API Keys</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          在此处管理并输入您的 AI 提供商的 API Key。
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="provider-select-label">AI Provider</InputLabel>
          <Select
            labelId="provider-select-label"
            value={selectedProvider}
            label="AI Provider"
            onChange={handleProviderChange}
          >
            {providers.map(p => (
              <MenuItem key={p.provider} value={p.provider}>{p.provider}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {isLoading ? (
          <CircularProgress />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label={`${selectedProvider} API Key`}
              variant="outlined"
              type="password"
              fullWidth
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`请输入您的 ${selectedProvider} API Key`}
            />
            <Button variant="contained" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <CircularProgress size={24} /> : '保存'}
            </Button>
          </Box>
        )}
      </CardContent>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </Card>
  );
};

export default ApiKeyManager;
