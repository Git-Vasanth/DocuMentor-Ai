import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase.config';  
import { ref, set, onValue } from 'firebase/database';  
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Box } from '@mui/material';
import { signOut } from 'firebase/auth';
import Sidebar from './sidebar';
import FileUploadWindow from './fileuploadform';
import { Download } from '@mui/icons-material';



const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadWindowOpen, setIsUploadWindowOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const clearData = () => {
    setUploadedFiles([]); // Clear uploaded files
    setUploadStatus('');  // Clear upload status
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || 'Anonymous');
    } else {
      navigate('/login');
    }

    const messagesRef = ref(db, 'chat/messages');
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.values(data));
      }
    });
  }, [navigate]);

  const sendMessage = async () => {
    if (message.trim() !== '') {
        // Send the user's message to Firebase
        const messagesRef = ref(db, 'chat/messages');
        const newMessageRef = messagesRef.push();
        set(newMessageRef, {
            user: userName,
            message: message,
            timestamp: new Date().toISOString(),
        });
    
        // Clear the message field
        setMessage('');
    
      }
  };

  const toggleSidebar = () => {
    setSidebarOpen(prevState => !prevState); // Toggle sidebar visibility
  };

  const logout = () => {
    signOut(auth)
      .then(() => {
        navigate('/login');
      })
      .catch((error) => {
        console.error('Error logging out: ', error);
      });
  };

  const toggleUploadWindow = () => {
    setIsUploadWindowOpen(!isUploadWindowOpen);  // Toggle the file upload window
  };

  const handleFileUpload = async (newFiles) => {
    try {
      const formData = new FormData();
      newFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('http://127.0.0.1:8000/extract', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('Files received and processing started.');
        setUploadedFiles([...uploadedFiles, ...newFiles]); // Update the uploadedFiles state
        setIsUploadWindowOpen(false); // Close the upload window
      } else {
        setUploadStatus('Error processing files.');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus('Error uploading files.');
    }
  };

  useEffect(() => {
    const chatBox = document.getElementById('chatBox');
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;  // Automatically scroll to the latest message
    }
  }, [messages]);

  return (
    <Box sx={{ display: 'flex', transition: 'margin-left 0.3s ease' }}>
      <Sidebar 
        userName={userName}
        uploadedFiles={uploadedFiles}
        onLogout={logout}
        onFileUpload={handleFileUpload}
        onClose={toggleSidebar}
        sidebarOpen={sidebarOpen}
        onUploadClick={toggleUploadWindow}
        clearData={clearData}  // Ensure clearData is passed here
      />

      {uploadStatus && (
        <Box sx={{ padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>
          <Typography variant="body1">{uploadStatus}</Typography>
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          padding: '20px',
          transition: 'margin-left 0.3s ease',
          marginLeft: sidebarOpen ? '250px' : '0',
        }}
      >
        <Typography 
          variant="h4" 
          align="center" 
          sx={{ 
            marginBottom: '20px', 
            fontSize: '2rem', 
            fontWeight: 'bold', 
          }}
        >
          Cubicle
        </Typography>

        <Button
          variant="contained"
          color="primary"
          sx={{
            position: 'absolute',
            top: '20px',
            right: '15px',
            zIndex: 1000,
            padding: '8px',
            fontSize: '1.2rem',
            borderRadius: '10px',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)', 
            '&:hover': {
              backgroundColor: '#3f4c91', 
            },
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '30px', 
            height: '40px', 
          }}
          startIcon={<Download sx={{ fontSize: '30px' }} />}
        >
          {/* Empty text, just icon */}
        </Button>

        <Button
          variant="contained"
          color="secondary"
          sx={{
            position: 'absolute',
            top: '20px',
            right: '100px',
            zIndex: 1000,
            padding: '5px 5px', 
            fontSize: '1rem', 
            borderRadius: '8px', 
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)', 
            '&:hover': {
              backgroundColor: '#3f4c91', 
            },
          }}
        >
          ClassRoom
        </Button>

        <Box 
          id="chatBox"
          sx={{ 
            marginBottom: '20px',
            padding: '10px',
            maxHeight: '400px',
            overflowY: 'auto',  
          }}
        >
          {messages.map((msg, index) => (
            <Box key={index} sx={{ marginBottom: '10px' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '1rem', 
                  color: msg.user === 'AI' ? '#f44336' : '#3f4c91' // Highlight AI messages in red
                }}
              >
                {msg.user === 'AI' ? 'AI' : msg.user}  {/* Show "AI" if the message is from AI */}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '1rem' }}>
                {msg.message}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <TextField
            label="Type a message"
            variant="outlined"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ 
              marginBottom: '20px', 
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
              },
              '& .MuiInputLabel-root': {
                fontSize: '1rem',
              },
            }}
          />
          <Button
            variant="contained" 
            color="primary" 
            onClick={sendMessage}
            sx={{
              fontSize: '1rem',  
              padding: '10px 20px',  
              height: '100%', 
              '&:hover': {
                backgroundColor: '#3f4c91',
              },
            }}
          >
            Send
          </Button>
        </Box>

        <Button 
          variant="contained" 
          color="primary" 
          onClick={toggleSidebar} 
          sx={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            padding: '3px 3px',  
            fontSize: '1.2rem',  
            height: '30px',  
            width: '30px',  
            borderRadius: '10px',  
            boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',  
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',  
            textAlign: 'center',  
          }}
        >
          |||
        </Button>
      </Box>

      {isUploadWindowOpen && <FileUploadWindow onClose={toggleUploadWindow} />}
    </Box>
  );
};



export default Chat;
