import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InsightsIcon from '@mui/icons-material/Insights';

const AIPlanDisplay = ({ plan }) => {
  if (!plan) return null;

  return (
    <Card sx={{ mt: 4, animation: 'fadeIn 0.5s ease-in-out' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InsightsIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">AI 智能规划建议</Typography>
        </Box>
        
        <List>
          {plan.recommendations.map((rec, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemIcon>
                <CheckCircleOutlineIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary={rec.course_name}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      理由: {rec.reason}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="text.secondary">
                      预期GPA影响: {rec.expected_gpa_impact}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          总结:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {plan.summary}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AIPlanDisplay;
