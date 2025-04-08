import React, { useState, useEffect } from 'react';
import { auth } from './firebase.config'; // Correct import for Firebase authentication
import { signOut, onAuthStateChanged } from 'firebase/auth'; // Import the required Firebase authentication method
import { Alert} from '@mui/material';
import Dialog  from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { FaUserCircle } from "react-icons/fa";
import { Box, Typography, Radio, RadioGroup, FormControlLabel, FormControl, Button, IconButton, Stack } from '@mui/material';
import { ref, update, get,getDatabase } from 'firebase/database';

const New_profile = (onClose, onLogout, onSendInfo, onSave,sessionId, userId) => {
      const [status, setStatus] = useState(''); // No default value for status
      const [proficiency, setProficiency] = useState(''); // No default value for proficiency
      const [studyMode, setStudyMode] = useState(''); // No default value for study mode
      const [userName, setUserName] = useState('');
      const [alertMessage, setAlertMessage] = useState('');
      const [alertSeverity, setAlertSeverity] = useState('');

      useEffect(() => {
        // Listen for authentication state changes to get the user's name
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setUserName(user.displayName || 'Guest'); // Set the user's display name or default to 'Guest'
          } else {
            setUserName('Guest'); // If no user is logged in, set as 'Guest'
          }
        });
    
        return () => unsubscribe(); // Clean up the listener on component unmount
      }, []);

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

  const handleReset = () => {
    // Reset all selections to default (empty string or "no selection")
    setStatus('');
    setProficiency('');
    setStudyMode('');
  };

  const handleLogoutWithSessionUpdate = async () => {
    try {
      if(!auth.currentUser){
          console.error("user is not logged in");
          return;
      }
      const logoutTime = new Date().toISOString();
      const db = getDatabase();
      const sessionRef = ref(db, `users/${auth.currentUser.uid}/sessions/${sessionId}`); // Corrected path
  
      console.log("Session ID:", sessionId);
      console.log("Current User UID:", auth.currentUser.uid);
  
      const snapshot = await get(sessionRef);
      const sessionData = snapshot.val();
  
      console.log("Session Data:", sessionData);
  
      if (!sessionData || !sessionData.loginTime) {
        console.error("Session data or loginTime missing.");
        return;
      }
  
      const loginTime = sessionData.loginTime;
  
      const loginDate = new Date(loginTime);
      const logoutDate = new Date(logoutTime);
      const duration = logoutDate - loginDate;
  
      const seconds = Math.floor(duration / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const sessionDuration = `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  
      await update(sessionRef, {
        logoutTime: logoutTime,
        sessionDuration: sessionDuration,
      });
  
      console.log("Logout update successful");
  
      await signOut(auth);
  
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

    return(
        <Dialog open onClose={onClose} sx={{ '& .MuiDialog-paper': { borderRadius: '16px', backgroundColor: '#000000' } }}>
             <IconButton color="primary" sx={{ marginRight: "10px" }} aria-label="user profile">
                <FaUserCircle size={24} />
              </IconButton>
            <DialogContent sx={{
                    maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden',
                    '&::-webkit-scrollbar': { width: '12px', height: '12px' }, 
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#888', borderRadius: '6px' },
                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#555' },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#333', borderRadius: '6px' }
                  }}>
                <Typography>
                    Welcome {userName}
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
            onClick={handleLogoutWithSessionUpdate}
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
        
            </DialogContent>
        </Dialog>
    )

}

export default New_profile;