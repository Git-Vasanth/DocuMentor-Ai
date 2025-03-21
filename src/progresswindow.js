// ProgressWindow.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const ProgressWindow = ({ setIsProcessing }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress update (You can replace this with actual progress from your backend)
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress < 100) {
          return prevProgress + 1;
        } else {
          clearInterval(interval);
          setIsProcessing(false);  // Close the progress window after completion
          return 100;
        }
      });
    }, 100);  // Increment every 100ms

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [setIsProcessing]);

  return (
    <Box 
      sx={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 1000,
      }}
    >
      <Box sx={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', width: '300px', textAlign: 'center' }}>
        <Typography variant="h6" sx={{ marginBottom: '10px' }}>Status</Typography>
        <Typography variant="body1" sx={{ marginBottom: '20px' }}>Data Processing</Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ marginTop: '20px' }} />
        <Typography variant="body2" sx={{ marginTop: '10px' }}>{progress}%</Typography>
      </Box>
    </Box>
  );
};

export default ProgressWindow;
