import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Grid, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Alert, CircularProgress, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { MdOutlineDriveFolderUpload } from "react-icons/md";
import DeleteIcon from '@mui/icons-material/Delete';
import validator from 'validator';

function FileUploadWindow({ onClose, onLogout }) {
  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [selectedButtons, setSelectedButtons] = useState([false, false, false, false]);
  const [areCheckboxesDisabled, setAreCheckboxesDisabled] = useState(false);  // Always enabled

  const fileCount = files.length;
  const urlCount = urls.length;

  const showAlert = (severity, message) => {
    setAlert(<Alert severity={severity}>{message}</Alert>);
    setTimeout(() => setAlert(null), 5000); // Clears the alert after 5 seconds
  };

  const handleError = (message) => {
    setError(message);
    showAlert('error', message);
  };

  const isValidUrl = (url) => validator.isURL(url, { require_protocol: true });

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const newFileCount = fileCount + newFiles.length;
  
    if (newFileCount > 10) {
      showAlert('error', 'You cannot upload more than 10 files.');
      return;
    }
  
    const duplicateFiles = newFiles.filter((file) => files.some((existingFile) => existingFile.name === file.name));
    if (duplicateFiles.length > 0) {
      showAlert('warning', 'Some files have already been uploaded. Please choose other files.');
      return;
    }
  
    const validFiles = newFiles.filter((file) => {
      const validExtensions = ['.pdf', '.docx', '.txt', '.doc'];
      return validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    });
  
    if (validFiles.length !== newFiles.length) {
      setError('Some files are not supported. Please upload only .pdf, .docx, or .txt files.');
    } else {
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);
      setError('');
    }
  };

  const handleUrlInputChange = (e) => {
    setUrlInput(e.target.value);
  };

  const handleAddUrl = () => {
    const trimmedUrl = urlInput.trim();
    const newUrlCount = urlCount + 1;
  
    if (newUrlCount > 10) {
      showAlert('error', 'You cannot add more than 10 URLs.');
      return;
    }
  
    if (!trimmedUrl) {
      showAlert('error', 'Please enter a valid URL.');
      return;
    }
  
    if (!isValidUrl(trimmedUrl)) {
      showAlert('error', 'Please enter a valid URL starting with http:// or https://.');
      return;
    }
  
    if (urls.includes(trimmedUrl)) {
      showAlert('warning', 'This URL has already been added.');
      return;
    }
  
    setUrls((prevUrls) => [...prevUrls, trimmedUrl]);
    setUrlInput('');
  };

  const handleDeleteFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleDeleteUrl = (index) => {
    setUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  const handleUploadCheckbox = (e) => {
    const updatedButtons = [...selectedButtons];
    updatedButtons[0] = e.target.checked; // Update the "Upload" checkbox state
    setSelectedButtons(updatedButtons);
  };
  
  const handleProcessCheckbox = (e) => {
    const updatedButtons = [...selectedButtons];
    updatedButtons[1] = e.target.checked; // Update the "Process" checkbox state
    setSelectedButtons(updatedButtons);
  };
  
  const handleBuildCheckbox = (e) => {
    const updatedButtons = [...selectedButtons];
    updatedButtons[2] = e.target.checked; // Update the "Build" checkbox state
    setSelectedButtons(updatedButtons);
  };
  
  const handleDestroyCheckbox = (e) => {
    const updatedButtons = [...selectedButtons];
    updatedButtons[3] = e.target.checked; // Update the "Destroy" checkbox state
    setSelectedButtons(updatedButtons);
  };
  

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
  
    // Append files and URLs to form data
    if (files.length >= 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }
  
    if (urls.length >= 0) {
      urls.forEach((url) => {
        formData.append('urls', url);
      });
    }
  
    try {
      // Sequentially check which checkboxes are selected and trigger the corresponding endpoint.
      if (selectedButtons[0]) {
        const uploadResponse = await fetch('http://127.0.0.1:5000/upload', {
          method: 'POST',
          body: formData,
        });
  
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Upload error:', errorText);
          throw new Error('Network response was not ok');
        }
  
        const uploadResult = await uploadResponse.json();
        console.log('Upload Success:', uploadResult);
      }
  
      if (selectedButtons[1]) {
        const processResponse = await fetch('http://127.0.0.1:5000/process', {
          method: 'POST',
        });
  
        if (!processResponse.ok) {
          const errorText = await processResponse.text();
          console.error('Process error:', errorText);
          throw new Error('Processing failed');
        }
  
        const processResult = await processResponse.json();
        console.log('Process Success:', processResult);
      }
/*  
      if (selectedButtons[2]) {
        const buildResponse = await fetch('http://127.0.0.1:5000/build', {
          method: 'POST',
        });
  
        if (!buildResponse.ok) {
          const errorText = await buildResponse.text();
          console.error('Build error:', errorText);
          throw new Error('Build failed');
        }
  
        const buildResult = await buildResponse.json();
        console.log('Build Success:', buildResult);
      }
*/  
      if (selectedButtons[3]) {
        const destroyResponse = await fetch('http://127.0.0.1:5000/destroy', {
          method: 'POST',
        });
  
        if (!destroyResponse.ok) {
          const errorText = await destroyResponse.text();
          console.error('Destroy error:', errorText);
          throw new Error('Destroy failed');
        }
  
        const destroyResult = await destroyResponse.json();
        console.log('Destroy Success:', destroyResult);
      }
  
      // After successful submission, reset states
      setFiles([]);
      setUrls([]);
      setUrlInput('');
      setError('');
      showAlert('success', 'Files and URLs uploaded, processed, and built successfully!');
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError('Something went wrong. Please try again.');
      showAlert('error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open onClose={onClose} sx={{ '& .MuiDialog-paper': { borderRadius: '16px', backgroundColor: '#000000' } }}>
      <DialogTitle sx={{ color: '#ffffff' }}>Upload </DialogTitle>
      <DialogContent sx={{
        maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden',
        '&::-webkit-scrollbar': { width: '12px', height: '12px' }, 
        '&::-webkit-scrollbar-thumb': { backgroundColor: '#888', borderRadius: '6px' },
        '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#555' },
        '&::-webkit-scrollbar-track': { backgroundColor: '#333', borderRadius: '6px' }
      }}>
        <Box sx={{ p: 3, width: 400 }}>
          {/* File Upload */}
          <Button
            variant="outlined"
            component="label"
            startIcon={<MdOutlineDriveFolderUpload />}
            fullWidth
            disabled={fileCount >= 10}
            sx={{ borderRadius: '16px' }}
          >
            Upload Files
            <input
              type="file"
              multiple
              hidden
              accept=".pdf,.docx,.txt,.doc"
              onChange={handleFileChange}
              disabled={fileCount >= 10}
            />
          </Button>

          <Grid container spacing={1} mt={2}>
            {files.map((file, index) => (
              <Grid item key={index} xs={12} container alignItems="center" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: '#ffffff' }}>{file.name}</Typography>
                <IconButton onClick={() => handleDeleteFile(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Grid>
            ))}
          </Grid>

          {/* URL Input (unchanged) */}
          <TextField
            label="Add a URL"
            variant="outlined"
            value={urlInput}
            onChange={handleUrlInputChange}
            fullWidth
            margin="normal"
            helperText="You can add up to 10 URLs"
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleAddUrl}
            disabled={urlCount >= 10 || urlInput.trim() === ''}
            sx={{ mt: 2, borderRadius: '16px' }}
          >
            Add URL
          </Button>

          <Grid container spacing={1} mt={2}>
            {urls.map((url, index) => (
              <Grid item key={index} xs={12} container alignItems="center" justifyContent="space-between">
                <Typography variant="body2" sx={{ color: '#ffffff' }}>{url}</Typography>
                <IconButton onClick={() => handleDeleteUrl(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Grid>
            ))}
          </Grid>

          {error && <Typography color="error" variant="body2">{error}</Typography>}
          {alert}

          {/* Checkboxes with individual handlers */}
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={selectedButtons[0]} onChange={handleUploadCheckbox} disabled={areCheckboxesDisabled} />}
              label="Upload"
            />
            <FormControlLabel
              control={<Checkbox checked={selectedButtons[1]} onChange={handleProcessCheckbox} disabled={areCheckboxesDisabled} />}
              label="Process"
            />

            <FormControlLabel
              control={<Checkbox checked={selectedButtons[3]} onChange={handleDestroyCheckbox} disabled={areCheckboxesDisabled} />}
              label="Destroy"
            />
          </FormGroup>

          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmit}
            fullWidth
            sx={{ mt: 3, borderRadius: '16px' }}
            disabled={loading || (fileCount + urlCount > 20)}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FileUploadWindow;
