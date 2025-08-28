import React, { useState, useRef, useEffect } from 'react';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

function PlanFAB({ retakePlan, onRemoveFromPlan, onNavigateToPlanner }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });
  // Ref to track if a drag operation just finished
  const justDraggedRef = useRef(false);
  // Ref to track if the window is being resized
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      isResizingRef.current = true;
      // Reset to default position (bottom-right corner)
      setPosition({ 
        x: window.innerWidth - 80, 
        y: window.innerHeight - 80 
      });
      
      // Reset the resizing flag after a short delay
      setTimeout(() => {
        isResizingRef.current = false;
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleClick = (event) => {
    // If a drag operation just finished, prevent the click
    if (justDraggedRef.current) {
       justDraggedRef.current = false; // Reset the flag
       event.preventDefault();
       event.stopPropagation();
       return;
    }
    // Only trigger click if not dragging
    if (!dragRef.current.isDragging) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMouseDown = (e) => {
    // Don't start dragging if window is being resized
    if (isResizingRef.current) return;
    
    dragRef.current = {
      isDragging: false, // Initially not dragging
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
      startX: e.clientX, // Record starting position
      startY: e.clientY,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current.isDragging) {
      // Check if movement exceeds a threshold to start dragging
      const deltaX = Math.abs(e.clientX - dragRef.current.startX);
      const deltaY = Math.abs(e.clientY - dragRef.current.startY);
      if (deltaX > 3 || deltaY > 3) { // 3px threshold
         dragRef.current.isDragging = true;
         setIsDragging(true);
         // Update cursor to indicate dragging
         if (e.target.closest('.MuiFab-root')) {
            e.target.closest('.MuiFab-root').style.cursor = 'grabbing';
         }
      } else {
         return; // Don't update position yet
      }
    }
    setPosition({
      x: e.clientX - dragRef.current.offsetX,
      y: e.clientY - dragRef.current.offsetY,
    });
  };

  const handleMouseUp = (e) => {
     // Reset dragging state and cursor
     if (dragRef.current.isDragging) {
        justDraggedRef.current = true; // Set flag if dragging occurred
        // Optional: Add a small delay to reset the flag, just to be safe
        // setTimeout(() => { justDraggedRef.current = false; }, 10);
     }
     dragRef.current.isDragging = false;
     setIsDragging(false);
     const fabElement = e.target.closest('.MuiFab-root');
     if (fabElement) {
        fabElement.style.cursor = 'grab';
     }
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