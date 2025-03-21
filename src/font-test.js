import React, { useState, useEffect } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Button, IconButton, Typography, Box } from '@mui/material';
import { BsGearWideConnected } from "react-icons/bs";  // Gear icon for the header

// Dialog component
const FontDialog = ({ open, handleClose, heading, icon, dialogSize, onFontChange }) => {
  // State to manage selected font
  const [selectedFont, setSelectedFont] = useState('Georgia');

  // Handle radio button change
  const handleFontChange = (event) => {
    setSelectedFont(event.target.value);
  };

  // Handle submit
  const handleSubmit = () => {
    console.log('Selected font:', selectedFont);
    onFontChange(selectedFont); // Apply font change to the page
    handleClose(); // Close the dialog after submission
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"  // You can control maxWidth with 'sm', 'md', 'lg', etc.
      sx={{
        width: dialogSize?.width || '400px', // Set width here (in px or any other unit)
        height: dialogSize?.height || 'auto', // Set height here (in px or other unit)
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ width: '100%' }}>
          {/* Centering the icon and heading */}
          <IconButton edge="start" color="inherit" aria-label="close" onClick={handleClose} sx={{ mr: 2 }}>
            {icon} {/* Gear icon here */}
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {heading}
          </Typography>
        </Box>
      </DialogTitle>

      {/* Content Section */}
      <DialogContent>
        <FormControl component="fieldset">
          <Typography variant="body1" fontWeight="bold" sx={{ display: 'inline', marginRight: '10px' }}>
            Font
          </Typography>

          {/* Radio buttons placed horizontally */}
          <RadioGroup
            value={selectedFont}
            onChange={handleFontChange}
            aria-label="font"
            name="font"
            sx={{ display: 'flex', flexDirection: 'row' }}  // This arranges the radio buttons horizontally
          >
            <FormControlLabel value="Georgia" control={<Radio />} label="Georgia" />
            <FormControlLabel value="Courier New" control={<Radio />} label="Courier New" />
          </RadioGroup>
        </FormControl>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main App component
const App = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [font, setFont] = useState('Georgia'); // This state will hold the selected font

  // Open dialog
  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  // Close dialog
  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  // Handle font change
  const handleFontChange = (newFont) => {
    setFont(newFont);  // Change the font for the whole app
  };

  // To apply the selected font to the entire page dynamically
  useEffect(() => {
    document.body.style.fontFamily = font; // Apply the font to the whole body
  }, [font]);

  return (
    <div>
      {/* Button to open the dialog */}
      <Button variant="outlined" onClick={handleDialogOpen}>
        Open Font Selection Dialog
      </Button>

      {/* Font Selection Dialog */}
      <FontDialog
        open={openDialog}
        handleClose={handleDialogClose}
        heading="Select Your Font"
        icon={<BsGearWideConnected />}  // Gear icon (imported from react-icons)
        dialogSize={{ width: '400px', height: 'auto' }}  // Adjust these dimensions for your dialog box
        onFontChange={handleFontChange}  // Pass the font change handler to the dialog
      />
      
      {/* Content to show font change */}
      <Typography variant="h5" sx={{ marginTop: '20px' }}>
        This is a sample text to preview the font.
      </Typography>
    </div>
  );
};

export default App;
