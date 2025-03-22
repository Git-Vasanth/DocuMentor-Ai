import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { auth, db } from './firebase.config';  // Import db for Realtime Database
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { FirebaseError } from "firebase/app";
import { ref, set, push } from 'firebase/database';  // For storing sessions

const customStyles = {
  title: {
    fontFamily: 'Gill Sans, sans-serif',
    color: '#fffff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
    color: '#fffff',
    placeholderColor: '#999',
    marginBottom: 15,
  },
  button: {
    backgroundImage: 'linear-gradient(to right, #8e2de2, #4a00e0)',
    color: '#fff',
    fontSize: 16,
    fontFamily: 'system-ui',
    fontWeight: 'bold',
    '&:hover': {
      backgroundImage: 'linear-gradient(to right, #8e2de2, #4a00e0)',
    },
  },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store the session for this user
      const userSessionRef = ref(db, 'users/' + user.uid + '/sessions');
      const sessionRef = push(userSessionRef);  // Create a new session

      await set(sessionRef, {
        loginTime: new Date().toISOString(),  // Current time when user logs in
        logoutTime: '',  // Will update when user logs out
        sessionDuration: '',  // Duration to be calculated upon logout
        conversations: [],  // Empty array to store conversations
      });

      setSuccess("Login successful! Redirecting to chat...");
      setTimeout(() => {
        navigate("/chat");  // Redirect to the chat page
      }, 2000);

    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === "auth/user-not-found") {
          setError("No user found with this email.");
        } else if (error.code === "auth/wrong-password") {
          setError("Incorrect password.");
        } else {
          setError("An unknown error occurred. Please try again.");
        }
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Card variant="outlined" sx={{ width: 400, borderRadius: '16px', borderColor: '#AAFF00' }}>
        <CardContent>
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontFamily: customStyles.title.fontFamily,
              color: customStyles.title.color,
              fontSize: `${customStyles.title.fontSize}px`,
              fontWeight: customStyles.title.fontWeight,
              marginBottom: customStyles.title.marginBottom,
            }}
          >
            Login
          </Typography>

          {/* Display Alerts for Success/Error */}
          {error && (
            <Stack sx={{ width: '100%' }} spacing={2}>
              <Alert severity="error">{error}</Alert>
            </Stack>
          )}
          {success && (
            <Stack sx={{ width: '100%' }} spacing={2}>
              <Alert severity="success">{success}</Alert>
            </Stack>
          )}

          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputProps={{
              style: { fontSize: customStyles.input.fontSize, color: customStyles.input.color },
            }}
            InputLabelProps={{ style: { color: customStyles.input.color } }}
            InputProps={{ style: { fontSize: customStyles.input.fontSize } }}
            placeholder="Enter your email"
          />

          <TextField
            label="Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputProps={{
              style: { fontSize: customStyles.input.fontSize, color: customStyles.input.color },
            }}
            InputLabelProps={{ style: { color: customStyles.input.color } }}
            InputProps={{ style: { fontSize: customStyles.input.fontSize } }}
            placeholder="Enter your password"
          />
        </CardContent>

        <CardActions sx={{ justifyContent: 'center' }}>
          <Button
            size="large"
            variant="contained"
            sx={customStyles.button}
            onClick={handleLogin}
          >
            Login
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}
