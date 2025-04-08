import React, { useState, useEffect } from 'react';
import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl, Button, IconButton, Stack } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { auth } from './firebase.config'; // Correct import for Firebase authentication
import { signOut,onAuthStateChanged } from 'firebase/auth'; // Import the required Firebase authentication method
import { Alert } from '@mui/material';
import { getDatabase, ref, update, get } from 'firebase/database';


const Profile = ({ onClose, onLogout, onSendInfo, onSave }) => {
  // States for status, proficiency, study mode, and username
  const [status, setStatus] = useState(''); // No default value for status
  const [proficiency, setProficiency] = useState(''); // No default value for proficiency
  const [studyMode, setStudyMode] = useState(''); // No default value for study mode
  const [userName, setUserName] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('');
  const [userId, setUserId] = useState(null);
  const [sessionId, setSessionId] = useState(null); // Add this state


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || 'Guest');
        setUserId(user.uid);
        console.log("User Id is:", user.uid); // Added log
        fetchSessionId(user.uid);
      } else {
        setUserName('Guest');
        setUserId(null);
        setSessionId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchSessionId = async (uid) => {
    const db = getDatabase();
    const sessionsRef = ref(db, `users/${uid}/sessions`); // Correct path
  
    try {
      const snapshot = await get(sessionsRef);
      if (snapshot.exists()) {
        const sessions = snapshot.val();
        let latestSessionId = null;
        let latestLoginTime = null;
  
        for (const sessionId in sessions) {
          const loginTime = new Date(sessions[sessionId].loginTime).getTime();
          if (!latestLoginTime || loginTime > latestLoginTime) {
            latestLoginTime = loginTime;
            latestSessionId = sessionId;
          }
        }
        console.log("session Id is:", latestSessionId); //added log
        setSessionId(latestSessionId);
      }
    } catch (error) {
      console.error('Error fetching session ID:', error);
    }
  };


  // Handle changes for the status radio buttons
  const handleStatusChange = (event) => {
    setStatus(event.target.value); // Update the status based on selected radio button
  };

  // Handle changes for the proficiency radio buttons
  const handleProficiencyChange = (event) => {
    setProficiency(event.target.value); // Update proficiency based on selected radio button
  };

  // Handle changes for the study mode radio buttons
  const handleStudyModeChange = (event) => {
    setStudyMode(event.target.value); // Update study mode based on selected radio button
  };

  const handleSave = () => {
    // Save only the status to the system or send it to the server
    onSave(status);
  };

  const handleSendInfo = () => {
    const message = `User with username ${userName} has ${proficiency} level knowledge and wants to study in a ${studyMode} way.`;
  
    fetch('http://127.0.0.1:5000/prefai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Response from AI:', data);
      setAlertMessage("AI has received your preferences!");
      setAlertSeverity('success'); // Success alert when data is successfully received
      setTimeout(() => setAlertMessage(''), 5000); // Hide the alert after 5 seconds
    })
    .catch(error => {
      console.error('Error sending info to backend:', error);
      setAlertMessage("Failed to send preferences. Please try again.");
      setAlertSeverity('error'); // Error alert when there's an issue
      setTimeout(() => setAlertMessage(''), 5000); // Hide the alert after 5 seconds
    });
  
    // Reset selections after sending
    setStatus('');
    setProficiency('');
    setStudyMode('');
  };

  const handleLogout = () => {
    console.log("logout button pressed");
    console.log(userId, sessionId);
    if (!userId || !sessionId) {
      console.error('User ID or Session ID not available.');
      return;
    }
  
    const db = getDatabase();
    const sessionRef = ref(db, `users/${userId}/sessions/${sessionId}`); // Correct path
    const logoutTime = new Date().toISOString();
  
    get(ref(db, `users/${userId}/sessions/${sessionId}/loginTime`)).then((snapshot) => { // Correct path
      if (snapshot.exists()) {
        const loginTime = new Date(snapshot.val());
        const duration = new Date(logoutTime).getTime() - loginTime.getTime();
        const durationInSeconds = Math.round(duration / 1000);
  
        update(sessionRef, { logoutTime: logoutTime, sessionDuration: durationInSeconds })
          .then(() => {
            console.log('Logout time and session duration updated successfully.');
            signOut(auth)
              .then(() => {
                console.log('User signed out successfully.');
                onClose();
              })
              .catch((error) => {
                console.error('Error signing out:', error);
              });
          })
          .catch((error) => {
            console.error('Error updating logout time:', error);
          });
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  };
  
  const handleReset = () => {
    // Reset all selections to default (empty string or "no selection")
    setStatus('');
    setProficiency('');
    setStudyMode('');
  };

  return (
    <Box
      sx={{
        width:470, // Width of the profile window
        padding: '20px', // Padding inside the window
        backgroundColor: '#000', // Solid background color for opacity
        color: '#fff', // Text color (default is white, change as needed)
        borderRadius: '16px', // Border radius for rounded corners
        boxShadow: '2px 2px 20px rgba(0, 0, 0, 0.3)', // Shadow effect for the profile window
        display: 'flex',
        flexDirection: 'column', // Stack elements vertically inside the box
        justifyContent: 'flex-start', // Start from the top
        alignItems: 'flex-start', // Align the items to the left
        gap: '20px', // Space between elements
        position: 'fixed', // Fixed position relative to the viewport
        top: '50%', // Vertically center the window
        left: '50%', // Horizontally center the window
        transform: 'translate(-50%, -50%)', // Center the box exactly in the middle
        maxHeight: '90vh', // Maximum height of the profile window
        zIndex: 9999, // Keep it on top of other elements
        overflow: 'auto', // Add scroll if content exceeds the box height
        '&::-webkit-scrollbar': {
          width: '6px', // Scrollbar width
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.7)', // Scrollbar thumb color
          borderRadius: '3px', // Rounded corners for the thumb
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: 'rgba(255, 255, 255, 1)', // Thumb color on hover
        },
        border: `2px solid #444`, // Slight border around the profile window
      }}
    >
      {/* Close button (X) in the top-right corner */}
      <IconButton
        onClick={onClose} // Trigger onClose function when the close button is clicked
        sx={{
          position: 'absolute', // Absolute positioning for the close button
          top: '10px', // Position it 10px from the top of the window
          right: '10px', // Position it 10px from the right side of the window
          color: '#fff', // Close button color (white)
        }}
      >
        <CloseIcon /> {/* Close icon */}
      </IconButton>

      {/* Welcome message with the user's name */}
      <Typography variant="h6" sx={{ textAlign: 'left', marginBottom: '20px', fontWeight: 600 }}>
        Welcome, {userName} {/* Display the user's name */}
      </Typography>

      {/* Status selection (Radio Buttons) */}
      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <Typography variant="body1" sx={{ marginBottom: '10px', textAlign: 'left', fontWeight: 600 }}>
          Status: {/* Label for the status section */}
        </Typography>
        <RadioGroup
          value={status} // The selected value (status)
          onChange={handleStatusChange} // Update status when a new option is selected
          sx={{
            display: 'flex',
            flexDirection: 'column', // Stack the radio buttons vertically
            alignItems: 'flex-start', // Left-align the radio buttons
          }}
        >
          {/* Group option */}
          <FormControlLabel
            value="Group"
            control={<Radio />}
            label="Group"
            sx={{
              fontWeight: 600, // Ensure font weight consistency
            }}
          />
          {/* LoneRanger option */}
          <FormControlLabel
            value="LoneRanger"
            control={<Radio />}
            label="LoneRanger"
            sx={{
              fontWeight: 600, // Ensure font weight consistency
            }}
          />
        </RadioGroup>
      </FormControl>

      {/* Proficiency selection (Radio Buttons) */}
      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <Typography variant="body1" sx={{ marginBottom: '10px', textAlign: 'left', fontWeight: 600 }}>
          Proficiency: {/* Label for the proficiency section */}
        </Typography>
        <RadioGroup
          value={proficiency} // The selected value (proficiency)
          onChange={handleProficiencyChange} // Update proficiency when a new option is selected
          sx={{
            display: 'flex',
            flexDirection: 'column', // Stack the radio buttons vertically
            alignItems: 'flex-start', // Left-align the radio buttons
          }}
        >
          {/* Scratch option */}
          <FormControlLabel
            value="scratch"
            control={<Radio />}
            label="I don't know Anything [0]"
            sx={{
              fontWeight: 600, // Ensure font weight consistency
            }}
          />
          {/* Beginner option */}
          <FormControlLabel
            value="beginner"
            control={<Radio />}
            label="Beginner [1-3]"
            sx={{
              fontWeight: 600, // Ensure font weight consistency
            }}
          />
          {/* Intermediate option */}
          <FormControlLabel
            value="intermediate"
            control={<Radio />}
            label="Intermediate [4-7]"
            sx={{
              fontWeight: 600, // Ensure font weight consistency
            }}
          />
          {/* Expert option */}
          <FormControlLabel
            value="expert"
            control={<Radio />}
            label="Expert [8-10]"
            sx={{
              fontWeight: 600, // Ensure font weight consistency
            }}
          />
        </RadioGroup>
      </FormControl>

      {/* Study Mode selection (Radio Buttons) */}
      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <Typography variant="body1" sx={{ marginBottom: '10px', textAlign: 'left', fontWeight: 600 }}>
          Study Mode: {/* Label for the study mode section */}
        </Typography>
        <RadioGroup
          value={studyMode} // The selected value (study mode)
          onChange={handleStudyModeChange} // Update study mode when a new option is selected
          sx={{
            display: 'flex',
            flexDirection: 'column', // Stack the radio buttons vertically
            alignItems: 'flex-start', // Left-align the radio buttons
          }}
        >
          {/* Focused Mode option */}
          <FormControlLabel
            value="Exam_mode"
            control={<Radio />}
            label="Exam Mode"
            sx={{
              fontWeight: 600, // Ensure font weight consistency
            }}
          />
          {/* Relaxed Mode option */}
          <FormControlLabel
            value="relaxed"
            control={<Radio />}
            label="Relaxed Mode"
            sx={{
              fontWeight: 600, // Ensure font weight consistency
            }}
          />
        </RadioGroup>
      </FormControl>

      {/* Success Alert */}
      {alertMessage && (  
        <Alert severity={alertSeverity}>
          {alertMessage}  {/* Show the success or error message */}
        </Alert>
      )}


      {/* Footer with four buttons */}
      <Stack direction="row" spacing={2} sx={{ width: '100%', marginTop: 'auto' }}>
  <Button
    variant="contained"
    color="error"
    fullWidth
    sx={{ borderRadius: '16px', textTransform: 'none', fontWeight: 600 }}
    onClick={onLogout}
  >
    Log Out
  </Button>

  <Button
    variant="outlined"
    color="primary"
    fullWidth
    sx={{ borderRadius: '16px', textTransform: 'none', fontWeight: 600 }}
    onClick={handleSave}
  >
    Save
  </Button>

  <Button
    variant="text"
    color="secondary"
    fullWidth
    sx={{ borderRadius: '16px', textTransform: 'none', fontWeight: 600 }}
    onClick={handleSendInfo}
  >
    Send Info
  </Button>

  {/* Reset button */}
  <Button
  variant="contained"
  fullWidth
  sx={{
    borderRadius: '16px',
    textTransform: 'none',
    fontWeight: 600,
    backgroundColor: '#d1ff33', // Custom background color (light yellow-green)
    color: 'black', // Black text color
    '&:hover': {
      backgroundColor: '#b1e632', // Darker shade on hover for the background
      color: 'black', // Keep the text black on hover
    },
  }}
  onClick={handleReset} // Reset the form values
>
  Reset
</Button>


</Stack>

    </Box>
  );
};

export default Profile;
