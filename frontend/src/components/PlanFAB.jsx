import React, { useState, useRef, useEffect } from 'react';
import { 
  Fab, Badge, Popover, List, ListItem, ListItemText, IconButton, 
  Typography, Box, Paper, Divider, Button
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

function PlanFAB({ retakePlan, onRemoveFromPlan, onNavigateToPlanner }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const dragRef = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const handleResize = () => {
      setPosition(prevPosition => {
        const fabSizeWithPadding = 80; // FAB size (56px) + some padding
        const newX = Math.min(prevPosition.x, window.innerWidth - fabSizeWithPadding);
        const newY = Math.min(prevPosition.y, window.innerHeight - fabSizeWithPadding);
        const finalX = Math.max(16, newX); // Keep some padding from left edge
        const finalY = Math.max(16, newY); // Keep some padding from top edge
        return { x: finalX, y: finalY };
      });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMouseDown = (e) => {
    dragRef.current = {
      isDragging: true,
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current.isDragging) return;
    setPosition({
      x: e.clientX - dragRef.current.offsetX,
      y: e.clientY - dragRef.current.offsetY,
    });
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'retake-plan-popover' : undefined;

  return (
    <Box>
      <Fab
        color="primary"
        aria-label="retake plan"
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        sx={{ position: 'fixed', left: position.x, top: position.y, cursor: 'grab' }}
      >
        <Badge badgeContent={retakePlan.length} color="error">
          <ShoppingCartIcon />
        </Badge>
      </Fab>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Paper sx={{ width: 350, maxHeight: 400, overflowY: 'auto' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">我的重修计划</Typography>
          </Box>
          <List dense>
            {retakePlan.length > 0 ? retakePlan.map(course => (
              <ListItem 
                key={course.course_code} 
                secondaryAction={
                  <IconButton edge="end" aria-label="remove" onClick={() => onRemoveFromPlan(course.course_code)}>
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                }
              >
                <ListItemText 
                  primary={course.course_name} 
                  secondary={`绩点: ${course.course_gpa} | 学分: ${course.course_weight}`}
                />
              </ListItem>
            )) : (
              <ListItem>
                <ListItemText primary="计划为空，请在课程列表中添加课程。" />
              </ListItem>
            )}
          </List>
          {retakePlan.length > 0 && (
            <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={() => {
                  onNavigateToPlanner();
                  handleClose();
                }}
              >
                创建我的重修计划
              </Button>
            </Box>
          )}
        </Paper>
      </Popover>
    </Box>
  );
}

export default PlanFAB;