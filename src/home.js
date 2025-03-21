import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom'; 

// Customization for Title, Paragraph, Button
const customStyles = {
  title: {
    fontFamily: 'Gill Sans, sans-serif',
    color: '#FFFFFF',
    fontSize: 35,
    fontWeight: 'bold',
  },
  paragraph: {
    fontFamily: 'Arial, sans-serif',
    color: '#FFFFFF',
    fontSize: 20,
  },
  button: {
    color: '#ffffff',
    backgroundImage: 'linear-gradient(to right, #8e2de2, #4a00e0)',
    fontSize: 16,
    fontFamily: 'system-ui',
    fontWeight: 'bold',
  },
};

export default function OutlinedCard() {
  const navigate = useNavigate(); 

  const handleGetStarted = () => {
    navigate('/signup'); 
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
      <Card
        variant="outlined"
        sx={{
          width: 600,
          borderColor: 'purple',
          borderRadius: '25px',
        }}
      >
        <CardContent>
          <Typography
            variant="h4"
            component="div"
            align="center"
            sx={{
              marginBottom: 2,
              fontFamily: customStyles.title.fontFamily,
              fontWeight: customStyles.title.fontWeight,
              color: customStyles.title.color,
              fontSize: `${customStyles.title.fontSize}px`,
            }}
          >
            DocuMentor-AI
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mt: 2,
              mb: 2,
              textAlign: 'center',
              fontFamily: customStyles.paragraph.fontFamily,
              color: customStyles.paragraph.color,
              fontSize: `${customStyles.paragraph.fontSize}px`,
            }}
          >
            Documentor-AI is an intelligent assistant designed to help you in Exploring the information.
          
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'center' }}>
          <Button
            size="large"
            variant="contained"
            sx={{
              backgroundImage: customStyles.button.backgroundImage,
              color: customStyles.button.color,
              fontSize: `${customStyles.button.fontSize}px`,
              fontFamily: customStyles.button.fontFamily,
              fontWeight: customStyles.button.fontWeight,
              '&:hover': {
                backgroundImage: customStyles.button.backgroundImage,
              },
            }}
            onClick={handleGetStarted} // Trigger navigate on button click
          >
            Get Started
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}
