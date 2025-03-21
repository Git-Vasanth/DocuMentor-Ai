import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FirebaseError } from "firebase/app";
import { useState } from 'react';
import { db, auth } from './firebase.config.js'; 
import { ref, set } from 'firebase/database'; 
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; 
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

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
  loginButton: {
    backgroundImage: 'linear-gradient(to right, #00c6ff, #0072ff)', 
    color: '#fff',
    fontSize: 16,
    fontFamily: 'system-ui',
    fontWeight: 'bold',
    '&:hover': {
      backgroundImage: 'linear-gradient(to right, #00c6ff, #0072ff)', 
    },
  },
};

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);
    setWarning(null);
    
    if (!name) {
      setWarning("Please enter your name.");
      return;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      setWarning('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setWarning('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setWarning('Password must be at least 8 characters long.');
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set the user's display name in Firebase Authentication
      await updateProfile(user, {
        displayName: name
      });

      // Save user info in Realtime Database
      await set(ref(db, 'users/' + user.uid), {
        displayName: name,
        email: email,
      });

      // Reset form fields
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Success message and redirect to login page
      setSuccess('Account Created! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');  
      }, 2000);

    } catch (error) {
      if(error instanceof FirebaseError) {
        if(error.code === "auth/email-already-in-use"){
          setError("This Email is already in use");
        }else{
          setError("An unknown error occurred. Please try again.")
        }
      }else{
        setError("An error occurred. Please try again.")
      }
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'background.default' }}>
      <Card variant="outlined" sx={{ width: 400, borderRadius: '16px', border: '2px solid #00c6ff' }}>
        <CardContent>
          <Typography variant="h4" align="center" sx={customStyles.title}>
            Sign Up
          </Typography>

          {/* Display Alerts */}
          {error && (
            <Stack sx={{ width: '100%' }} spacing={2}>
              <Alert severity="error">{error}</Alert>
            </Stack>
          )}
          {warning && (
            <Stack sx={{ width: '100%' }} spacing={2}>
              <Alert severity="warning">{warning}</Alert>
            </Stack>
          )}
          {success && (
            <Stack sx={{ width: '100%' }} spacing={2}>
              <Alert severity="success">{success}</Alert>
            </Stack>
          )}

          {/* Name Field */}
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputProps={{ style: { fontSize: customStyles.input.fontSize, color: customStyles.input.color } }}
            InputLabelProps={{ style: { color: customStyles.input.color } }}
            InputProps={{ style: { fontSize: customStyles.input.fontSize } }}
            placeholder="Enter your name"
          />

          {/* Email Field */}
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputProps={{ style: { fontSize: customStyles.input.fontSize, color: customStyles.input.color } }}
            InputLabelProps={{ style: { color: customStyles.input.color } }}
            InputProps={{ style: { fontSize: customStyles.input.fontSize } }}
            placeholder="Enter your email"
          />

          {/* Password Field */}
          <TextField
            label="Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputProps={{ style: { fontSize: customStyles.input.fontSize, color: customStyles.input.color } }}
            InputLabelProps={{ style: { color: customStyles.input.color } }}
            InputProps={{ style: { fontSize: customStyles.input.fontSize } }}
            placeholder="Enter your password"
          />

          {/* Confirm Password Field */}
          <TextField
            label="Confirm Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            inputProps={{ style: { fontSize: customStyles.input.fontSize, color: customStyles.input.color } }}
            InputLabelProps={{ style: { color: customStyles.input.color } }}
            InputProps={{ style: { fontSize: customStyles.input.fontSize } }}
            placeholder="Confirm your password"
          />
        </CardContent>

        <CardActions sx={{ justifyContent: 'center' }}>
          <Button size="large" variant="contained" sx={customStyles.button} onClick={handleSignUp}>
            Sign Up
          </Button>
        </CardActions>

        <CardActions sx={{ justifyContent: 'center' }}>
          <Button size="large" variant="contained" sx={customStyles.loginButton} onClick={handleLoginRedirect}>
            Login
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}


export default SignUp;