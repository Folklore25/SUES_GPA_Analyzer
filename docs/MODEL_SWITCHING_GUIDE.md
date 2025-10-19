# AI Model Switching - Implementation Guide

This document outlines the plan to refactor the application to support multiple AI models, starting with Zhipu GLM-4 and DeepSeek Chat.

## 1. Core Objective

Allow users to select their preferred AI model for the "Retake Planner" feature and manage the API keys for different AI providers separately and securely.

## 2. Proposed Changes

### 2.1. AI Model Configuration

A new configuration file, `src/utils/aiModels.json`, will be created to define the properties of each supported AI model.

```json
[
  {
    "id": "glm-4",
    "name": "Zhipu GLM-4",
    "provider": "Zhipu",
    "apiUrl": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    "apiKeyService": "SUES_GPA_Analyzer_Zhipu_AI"
  },
  {
    "id": "deepseek-chat",
    "name": "DeepSeek Chat",
    "provider": "DeepSeek",
    "apiUrl": "https://api.deepseek.com/chat/completions",
    "apiKeyService": "SUES_GPA_Analyzer_DeepSeek_AI"
  }
]
```

### 2.2. Backend Refactoring

*   **`main.js` (IPC Handlers):**
    *   The `save-api-key` and `load-api-key` handlers will be modified to accept a `serviceName` parameter, allowing them to manage keys for any AI provider (e.g., `save-api-key(apiKey, serviceName)`).
    *   The `invoke-ai-planner` handler will be modified to accept a `modelId` and pass it to the `aiService`.

*   **`src/utils/aiService.js`:**
    *   The `getAIRetakePlan` function will be updated to `getAIRetakePlan(coursesData, username, modelId)`.
    *   It will read `aiModels.json` to find the selected model's configuration (API URL, API key service name).
    *   It will use the `apiKeyService` from the config to fetch the correct API key from `keytar`.
    *   It will use the `apiUrl` and `modelId` to make the request. The request body will be dynamically constructed based on the selected model.

### 2.3. Frontend Refactoring

*   **`Settings.jsx` & `ApiKeyManager.jsx`:**
    *   A new `Select` dropdown will be added to `ApiKeyManager.jsx` to allow users to choose a provider ("Zhipu" or "DeepSeek").
    *   The input field will now be for the selected provider's API key. Saving the key will call `saveApiKey(apiKey, selectedProvider.apiKeyService)`.

*   **`RetakePlanner.jsx`:**
    *   A new `Select` dropdown will be added near the "AI 智能规划" button, listing the available models ("Zhipu GLM-4", "DeepSeek Chat").
    *   The user's selection will be stored in state.
    *   When the user clicks the "Start Analysis" button, the selected `modelId` will be passed to the `invokeAiPlanner` function.

*   **User Preferences:**
    *   The user's last selected model will be saved to the `user-info.ini` file to ensure it persists across sessions. A new IPC handler `save-selected-model` and `load-selected-model` will be created.

## 3. Development Steps

1.  Create `src/utils/aiModels.json`.
2.  Refactor IPC handlers in `main.js` for multi-key support.
3.  Refactor `aiService.js` to be model-agnostic.
4.  Refactor `ApiKeyManager.jsx` and `Settings.jsx` with the provider selection dropdown.
5.  Refactor `RetakePlanner.jsx` with the model selection dropdown.
6.  Implement saving/loading of the user's model preference.
