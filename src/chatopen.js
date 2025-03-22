import React, { useState, useRef, useEffect, memo } from "react";
import { Box, IconButton, Chip, Paper, Typography, Avatar, Stack, Container } from "@mui/material";
import { styled } from "@mui/system";
import { IoSend } from "react-icons/io5";
import { GiRobotHelmet } from "react-icons/gi";
import { FaPeopleGroup } from "react-icons/fa6";
import { FaUserCircle } from "react-icons/fa";
import { TbWorldUpload } from "react-icons/tb";
import { MdDownloading } from "react-icons/md";
import { GiMoebiusTriangle } from "react-icons/gi";
import { LuSettings } from "react-icons/lu";
import { getFirestore, collection, addDoc, query, orderBy, getDocs } from "firebase/database";
import { db } from "./firebase.config";
import Profile from './profile-test'; // Import Profile-test component
import FileUploadWindow from './fileuploadform'

const ChatContainer = styled(Paper)(({ theme }) => ({
  height: "93vh",
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(2),
  backgroundColor: "",  
  borderRadius: "16px",
}));

const MessagesContainer = styled(Box)({
  flex: 1,
  overflowY: "auto",
  marginBottom: "1rem",
  padding: "1rem",
  display: "flex",
  flexDirection: "column"
});

const MessageBubble = memo(({ isUser, text }) => (
  <Box
    maxWidth="70%"
    margin="0.5rem"
    padding="0.8rem"
    borderRadius="1rem"
    backgroundColor={isUser ? "#1976d2" : "#fff"}
    color={isUser ? "#fff" : "#000"}
    alignSelf={isUser ? "flex-start" : "flex-end"}
    boxShadow="0 1px 2px rgba(0,0,0,0.1)"
    display="flex"
    alignItems="center"
    gap="0.5rem"
  >
    {!isUser && (
      <Avatar sx={{ bgcolor: "#1976d2", width: 30, height: 30 }}>
        <GiRobotHelmet size={20} />
      </Avatar>
    )}
    <Typography variant="body1" sx={{ fontFamily: "Courier New, Courier, monospace" }}>
      {text}
    </Typography>
  </Box>
));

const InputContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "1rem"
});

const SuggestionsContainer = styled(Stack)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: "0.5rem",
  flexWrap: "nowrap",  // Prevent wrapping of items
  overflowX: "auto",   // Enable horizontal scroll when needed
  maxWidth: "100%",    // Ensure full width of the parent container
  paddingBottom: theme.spacing(1), // Optional: to add some space at the bottom
  
  // Custom scrollbar styling
  "&::-webkit-scrollbar": {
    height: "6px",  // Horizontal scrollbar height
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(255, 255, 255, 0.7)",  // Thumb color
    borderRadius: "3px",  // Rounded corners for the thumb
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "rgba(255, 255, 255, 1)",  // Thumb color on hover
  },
}));



const StyledInput = styled("textarea")({
  border: "none",
  backgroundColor: "transparent",
  color: "#ffffff",
  padding: "5px 10px",
  fontSize: "16px",
  outline: "none",
  width: "100%",
  fontFamily: "Courier New, Courier, monospace", // Ensure Courier font for input
 //choose this for the presentation  fontWeight: 600,
  resize: "none",  // Prevent resizing
  minHeight: "50px", // Minimum height for textarea
  "&::placeholder": {
    color: "#aaaaa",  // Placeholder color
  },
  caretColor: "#fffff",  // Set the color of the cursor to white (or any color you prefer)
  "::selection": {
    backgroundColor: "transparent",  // Optional, to prevent text selection background
  },

  // Custom scrollbar styles
  "&::-webkit-scrollbar": {
    width: "8px",  // Width of the scrollbar
    height: "8px", // Height of the scrollbar (for horizontal)
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#1976d2",  // Thumb color
    borderRadius: "10px",  // Round the corners of the thumb
    border: "2px solid #fff", // Optional: Border around thumb
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "#f1f1f1", // Track color
    borderRadius: "10px", // Round the corners of the track
  },
});

const handleKeyPress = (e) => {
  // Prevent submitting the message if Shift + Enter is pressed
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    //handleSendMessage();
  }
};

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center", // Center the content horizontally
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  width: "100%",
  backgroundColor: "transparent", // No background box here
}));

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([
    "Tell me more",
    "Can you explain with a real time example?",
    "Whats the Summary of Document ?"
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false); // State for Profile visibility
  const [showFileUpload, setShowFileUpload] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const typingDots = ['.', '..', '...'];
  const [typingState, setTypingState] = useState(0);

  useEffect(() => {
    const typingInterval = setInterval(() => {
      setTypingState((prevState) => (prevState + 1) % typingDots.length);
    }, 500);

    return () => clearInterval(typingInterval);
  }, []);

  const generateBotResponse = (userMessage) => {
    setIsTyping(true);
    setTimeout(() => {
      const botResponse = `Thanks for your message: "${userMessage}". How can I help you further?`;
      setMessages(prev => [...prev, { text: botResponse, isUser: false }]);
      setIsTyping(false);
      setSuggestions([
        "Tell me more about this",
        "What are the next steps?",
        "Can you provide examples?"
      ]);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages(prev => [...prev, { text: inputValue, isUser: true }]);
      generateBotResponse(inputValue);
      setInputValue("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setMessages(prev => [...prev, { text: suggestion, isUser: true }]);
    generateBotResponse(suggestion);
    setInputValue("");
  };

  const handleProfileClick = () => {
    setShowProfile(prev => !prev); // Toggle the state of the profile visibility
  };
  
  
  // Function to close the profile window
  const handleCloseProfile = () => {
    setShowProfile(false); // Close profile window
  };
  
  const handleFileUploadToggle = () => {
    setShowFileUpload(prev => !prev); // Toggle FileUploadWindow visibility
  };

  const handleCloseFileUpload = () => {
    setShowFileUpload(false); // close the upload window.
  }

  return (
    <Container maxWidth="xl" sx={{ marginTop: "20px" }}>
      <ChatContainer elevation={3}>
        <HeaderContainer>
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            {/* Left Section */}
            <Box display="flex" alignItems="center">
              <IconButton color="primary" sx={{ marginRight: "10px" }} aria-label="user profile" onClick={handleProfileClick}>
                <FaUserCircle size={24} />
              </IconButton>
              <IconButton sx={{ marginRight: "10px" }} aria-label="world upload" onClick={handleFileUploadToggle} >
                <TbWorldUpload size={24} />
              </IconButton>
            </Box>

            {/* Center Section */}
            <Box display="flex" alignItems="center" justifyContent="center">
              <GiMoebiusTriangle size={40} style={{ marginRight: "10px" }} />
            </Box>

            {/* Right Section */}
            <Box display="flex" alignItems="center">
              <IconButton color="primary" sx={{ marginRight: "10px" }} aria-label="group">
                <FaPeopleGroup size={24} />
              </IconButton>
              <IconButton color="primary" sx={{ marginRight: "10px" }} aria-label="group">
                <LuSettings size={24} />
              </IconButton>
              <IconButton sx={{ color: "#91ff35" }} aria-label="download">
                <MdDownloading size={24} />
              </IconButton>
            </Box>
          </Box>
        </HeaderContainer>

        {/* Profile Section - Conditionally Rendered */}
        {showProfile && <Profile onClose={handleCloseProfile} />}

         {/* Upload Section - Conditionally Rendered */}
        {showFileUpload && <FileUploadWindow onClose={handleCloseFileUpload} />}

        {/* Messages Section */}
        <MessagesContainer>
          {isTyping && (
            <MessageBubble isUser={false} text={`Typing${typingDots[typingState]}`} />
          )}
          {messages.map((message, index) => (
            <MessageBubble key={index} isUser={message.isUser} text={message.text} />
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        {/* Input Section */}
        <InputContainer>
          <SuggestionsContainer>
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                variant="outlined"
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  fontFamily: "Courier New, Courier, monospace", 
                  "&:hover": {
                    backgroundColor: "#e3f2fd",
                    cursor: "block"
                  }
                }}
              />
            ))}
          </SuggestionsContainer>

          <Box sx={{ display: "flex", gap: 1 }}>
            <StyledInput
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              aria-label="send message"
            >
              <IoSend />
            </IconButton>
          </Box>
        </InputContainer>
      </ChatContainer>
    </Container>
  );
};

export default ChatInterface;
