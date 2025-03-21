import React from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import { deepOrange, deepPurple, red, blue, green, yellow, pink, teal, amber, lime, indigo, cyan, brown, grey, orange, purple } from '@mui/material/colors';

const Sidebar = ({ userName, onLogout, onClose, sidebarOpen, onUploadClick, clearData }) => {
  const handleLogout = () => {
    clearData();  
    onLogout();   
  };

const avatarColors = [
    deepOrange[500], deepPurple[500], red[500], blue[500], green[500], yellow[500], pink[500], teal[500], amber[500], lime[500],
    indigo[500], cyan[500], brown[500], grey[500], orange[500], purple[500]
  ];

  const getAvatarColor = (name) => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return deepPurple[500];  // Default color in case name is invalid
    }
  
    const firstLetter = name.charAt(0).toUpperCase();
    const letterIndex = firstLetter.charCodeAt(0) - 65;
    if (letterIndex >= 0 && letterIndex < 26) {
      return avatarColors[letterIndex % avatarColors.length];
    }
    return deepPurple[500];  // Default color if something goes wrong
  };
  

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 250,
        height: '100vh',
        backgroundColor: '#333',
        color: '#fff',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 5px rgba(0, 0, 0, 0.2)',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      <IconButton onClick={onClose} sx={{ alignSelf: 'flex-end', color: '#fff' }}>
        <CloseIcon />
      </IconButton>

      <Typography variant="h6" sx={{ paddingBottom: '20px' }}>
        Welcome
      </Typography>

      
      {/* Display User's Avatar with the first letter of their name */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: getAvatarColor(userName), color: 'white' }}>
          {userName.charAt(0).toUpperCase() || '.'}
        </Avatar>
        {/* Display User's Name */}
        <div style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
          <strong>{userName || 'Guest'}</strong> {/* Display the username */}
        </div>
      </Stack>

      <Button
        variant="contained"
        color="primary"
        sx={{ marginBottom: '20px' }}
        onClick={onUploadClick} 
      >
        Files - Urls - Embds
      </Button>

      <Button
        onClick={handleLogout}
        variant="contained"
        color="error"
        fullWidth
        sx={{ marginTop: 'auto' }}
      >
        Log Out
      </Button>
    </Box>
  );
};

export default Sidebar;
