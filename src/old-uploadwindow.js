import React, { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, TextField, Typography, IconButton, Input, LinearProgress, Alert } from '@mui/material';

const FileUploadForm = ({ onClose }) => {
  const [files, setFiles] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [urls, setUrls] = useState([]);
  const [alert, setAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    if (files.length + newFiles.length <= 5) {
      setFiles([...files, ...newFiles]);
      setAlert(null);
    } else {
      setAlert({ severity: 'error', message: 'You can only upload up to 5 files.' });
    }
  };

  // Handle URL change
  const handleUrlChange = (event) => {
    setUrlInput(event.target.value);
  };

  // Add URL to list
  const handleAddUrl = () => {
    if (urls.length < 5) {
      setUrls([...urls, urlInput]);
      setUrlInput('');
      setAlert(null);
    } else {
      setAlert({ severity: 'error', message: 'You can only add up to 5 URLs.' });
    }
  };

  // Delete file from list
  const handleDeleteFile = (index) => {
    setFiles(files.filter((_, idx) => idx !== index));
  };

  // Delete URL from list
  const handleDeleteUrl = (index) => {
    setUrls(urls.filter((_, idx) => idx !== index));
  };

  // Handle submit action (for example, you could simulate an upload here)
  const handleSubmit = () => {
    setUploading(true);
    let uploadProgress = 0;
    const interval = setInterval(() => {
      if (uploadProgress < 100) {
        uploadProgress += 10;
        setProgress(uploadProgress);
      } else {
        clearInterval(interval);
        setUploading(false);
        setAlert({ severity: 'success', message: 'Files and URLs uploaded successfully!' });
      }
    }, 500);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#333',
        color: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        width: '400px',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          color: '#fff',
        }}
      >
        X
      </IconButton>

      {/* Title */}
      <Typography variant="h6" sx={{ marginBottom: '20px', color: '#fff' }}>
        Upload Files & URLs
      </Typography>

      {/* Alert Message */}
      {alert && (
        <Alert severity={alert.severity} sx={{ marginBottom: '20px' }}>
          {alert.message}
        </Alert>
      )}

      {/* Upload Progress */}
      {uploading ? (
        <Box>
          <Typography variant="body1" sx={{ color: '#fff', marginBottom: '20px' }}>
            Uploading... Please wait.
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ marginBottom: '20px' }} />
          <Typography variant="body2" sx={{ color: '#fff' }}>
            {progress}% completed
          </Typography>
        </Box>
      ) : (
        <>
          {/* File Upload Section */}
          <Box sx={{ marginBottom: '20px' }}>
            <Typography variant="body1" sx={{ color: '#fff' }}>
              File Upload (max 5 files):
            </Typography>
            <Input
              type="file"
              multiple
              onChange={handleFileChange}
              sx={{
                marginBottom: '10px',
                width: '100%',
                color: '#fff',
              }}
              disabled={files.length >= 5}  // Disable input if 5 files are uploaded
            />
            {files.map((file, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {file.name}
                </Typography>
                <IconButton onClick={() => handleDeleteFile(index)} sx={{ color: '#fff' }}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* URL Add Section */}
          <Box sx={{ marginBottom: '20px' }}>
            <Typography variant="body1" sx={{ color: '#fff' }}>
              Add URLs (max 5 URLs):
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={urlInput}
              onChange={handleUrlChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddUrl();  // Add URL on Enter key press
              }}
              sx={{
                marginBottom: '10px',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#444',
                  color: '#fff',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
              }}
            />
            {urls.map((url, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {url.length > 30 ? `www.${url.slice(url.indexOf('www') + 4, url.indexOf('www') + 34)}` : url}
                </Typography>
                <IconButton onClick={() => handleDeleteUrl(index)} sx={{ color: '#fff' }}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Submit Button */}
      {!uploading && (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSubmit}
          sx={{
            backgroundColor: '#5c6bc0',
            '&:hover': {
              backgroundColor: '#3f4c91',
            },
          }}
        >
          Submit
        </Button>
      )}
    </Box>
  );
};


export default FileUploadForm;
