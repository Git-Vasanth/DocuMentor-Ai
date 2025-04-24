import React, { useState, useRef, useEffect, memo } from "react";
import { Box, IconButton, Chip, Paper, Typography, Stack, Container } from "@mui/material";
import { styled } from "@mui/system";
import { IoSend } from "react-icons/io5";
import { FaPeopleGroup } from "react-icons/fa6";
import { FaUserCircle } from "react-icons/fa";
import { TbWorldUpload } from "react-icons/tb";
import { MdDownloading } from "react-icons/md";
import { GiMoebiusTriangle } from "react-icons/gi";
import CircularProgress from '@mui/material/CircularProgress';
import { LuSettings } from "react-icons/lu";
import Profile from './profile-test'; // Import Profile-test component
import FileUploadWindow from './fileuploadform';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';
import { getDatabase, ref, push, set, get, child, query, orderByKey, limitToLast, orderByChild, startAt, endAt } from "firebase/database";

const ChatContainer = styled(Paper)(({ theme }) => ({
  height: "93vh",
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(2),
  backgroundColor: "",  
  borderRadius: "16px",
}));

const Overlay = styled(Box)(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",  // Dimming effect
  zIndex: 999,  // Make sure it's on top of other elements
}));

const MessagesContainer = styled(Box)({
  flex: 1,
  overflowY: "auto",
  marginBottom: "1rem",
  padding: "1rem",
  display: "flex",
  flexDirection: "column"
});

const MessageBubble = memo(({ isUser, text, percentage1 }) => {

  // Function to get color based on percentage ranges
  const getColorBasedOnPercentage = (percentage) => {
    if (percentage >= 0 && percentage <= 25) {
      return "#f44336"; // Red for 0-25%
    } else if (percentage >= 26 && percentage <= 50) {
      return "#ffcf33"; // Yellow for 26-50%
    } else if (percentage >= 51 && percentage <= 75) {
      return "#00b0ff"; // Blue for 51-75%
    } else {
      return "#76ff03"; // Green for 76-100%
    }
  };

  // Determine color based on percentage1
  const progressColor = getColorBasedOnPercentage(percentage1);
  

  return (
    <Box
      alignSelf={isUser ? "flex-start" : "flex-end"}
      maxWidth="80%"
      margin="0.4rem 0rem"
    >
      <Box
        padding="0.6rem 0.6rem"
        borderRadius="16px"
        backgroundColor={isUser ? "#e0f2fe" : "#f0f0f0"}
      >
        <Typography
          variant="body1"
          sx={{
            fontFamily: "Courier New, Courier, monospace",
            fontSize: "0.9rem",
            fontWeight: 600,
            wordWrap: "break-word",
            color: "#333",
          }}
        >
          <ReactMarkdown>{text}</ReactMarkdown>
          {percentage1 !== undefined && (
            <Box display="flex" justifyContent="center" marginTop="1rem">
              <Box display="flex" flexDirection="column" alignItems="center">
                <CircularProgress
                  variant="determinate"
                  value={percentage1}
                  size={30}
                  sx={{
                    color: progressColor, // Apply the dynamic color
                  }}
                />
                <Typography variant="caption">{percentage1}%</Typography>
              </Box>
            </Box>
          )}
        </Typography>
      </Box>
    </Box>
  );
});

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
  fontWeight: 600,
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
  justifyContent: "center", 
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  width: "100%",
  backgroundColor: "transparent", 
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
  const [userId, setUserId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);


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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const db = getDatabase();
        const sessionListRef = ref(db, `users/${user.uid}/sessions`);
        get(sessionListRef)
          .then((snapshot) => {
            let activeSessionId = null;
            if (snapshot.exists()) {
              const sessions = snapshot.val();
              activeSessionId = Object.keys(sessions).find(id => sessions[id].logoutTime === "");
            }
  
            if (activeSessionId) {
              sendInitialMessage(activeSessionId);
            } else {
              // No active session found, create a new one
              const newSessionRef = push(ref(db, `users/${user.uid}/sessions`), {
                startTime: Date.now(),
                logoutTime: "",
              });
              const newSessionId = newSessionRef.key;
              if (newSessionId) {
                setCurrentSessionId(newSessionId); // Update local state with the new session ID
                sendInitialMessage(newSessionId);
              } else {
                console.error("Error creating new session.");
                // Optionally, display an error to the user
              }
            }
          })
          .catch((error) => {
            console.error("Error finding or creating active session:", error);
            // Optionally, display an error to the user
          });
      } else {
        setUserId(null);
        setMessages([]);
      }
    });
  
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDailyMessages = async () => {
      if (!userId) return;

      const db = getDatabase();
      const sessionListRef = ref(db, `users/${userId}/sessions`);

      try {
        const snapshot = await get(sessionListRef);
        if (snapshot.exists()) {
          const sessions = snapshot.val();
          const activeSessionId = Object.keys(sessions).find(id => sessions[id].logoutTime === "");

          if (activeSessionId) {
            setCurrentSessionId(activeSessionId);

            const messagesRef = ref(db, `users/<span class="math-inline">\{userId\}/sessions/</span>{activeSessionId}/messages`);

            // Get the start and end of the current day in milliseconds (using local time)
            const now = new Date();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            const q = query(
              messagesRef,
              orderByChild('timestamp'),
              startAt(startOfDay.getTime()),
              endAt(endOfDay.getTime())
            );

            const msgSnapshot = await get(q);
            if (msgSnapshot.exists()) {
              const msgs = Object.values(msgSnapshot.val());
              const sortedMessages = msgs.sort((a, b) => a.timestamp - b.timestamp);
              setMessages(sortedMessages);
            } else {
              setMessages([]); // No messages for today
            }

            // REMOVE THIS LINE:
            // sendInitialMessage(activeSessionId);

          } else {
            console.log("No active session found.");
            setMessages([]);
            // Optionally, trigger a new session creation here if needed
          }
        }
      } catch (error) {
        console.error("Error fetching daily messages from Firebase:", error);
        setErrorMessage("Failed to load messages.");
      }
    };

    if (userId) {
      fetchDailyMessages();
    }
  }, [userId]);

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

  const handleDownloadChat = async () => {
    if (!userId || !currentSessionId) {
      console.error("User ID or Session ID not available.");
      return;
    }
  
    try {
      const response = await fetch('http://127.0.0.1:5000/download_chat', { // Ensure this matches your app.py route
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          sessionId: currentSessionId,
          messages: messages,
        }),
      });
  
      if (response.ok) {
        if (response.headers.get('Content-Disposition')) {
          console.log("PDF download initiated by the backend.");
        } else {
          console.error("Backend did not set Content-Disposition header.");
          // Optionally show an error message
        }
      } else {
        console.error(`HTTP error! status: ${response.status}`);
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        // Optionally show an error message
      }
  
    } catch (error) {
      console.error("Network error:", error);
      // Optionally show an error message
    }
  };

  const saveMessageToFirebase = async (messageObj) => {
    if (!userId || !currentSessionId) return;
  
    const db = getDatabase();
    const sessionRef = ref(db, `users/${userId}/sessions/${currentSessionId}/messages`);
    await push(sessionRef, messageObj);
  };
  

  const sendInitialMessage = async (activeSessionId) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/docai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: "Introduce yourself in a warm and welcoming way.", user_id: userId }),
      });
  
      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.generated_code;
        const dummyPercentage1 = Math.floor(Math.random() * 101);
        const newMsg = { text: aiResponse, isUser: false, percentage1: dummyPercentage1, timestamp: Date.now() };
        setMessages((prev) => [...prev, newMsg]);
        await saveMessageToFirebase(newMsg);
      } else {
        console.error('Error:', response.status);
      }
    } catch (error) {
      console.error('Network error:', error);
      setErrorMessage("Failed to connect to AI.");
    }
  };
  
  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      const userMessage = inputValue;
      setInputValue('');
      const newUserMsg = { text: userMessage, isUser: true, timestamp: Date.now() }; // Ensure timestamp is here
      setMessages((prev) => [...prev, newUserMsg]);
      await saveMessageToFirebase(newUserMsg);
  
      if (userId) {
        try {
          const response = await fetch('http://127.0.0.1:5000/docai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: userMessage, user_id: userId }),
          });
  
          if (response.ok) {
            const data = await response.json();
            const aiResponse = data.generated_code;
            const dummyPercentage = Math.floor(Math.random() * 101);
            const botMsg = { text: aiResponse, isUser: false, percentage1: dummyPercentage, timestamp: Date.now() };
            setMessages((prev) => [...prev, botMsg]);
            await saveMessageToFirebase(botMsg);
          } else {
            console.error('Error:', response.status);
          }
        } catch (error) {
          console.error('Network error:', error);
        }
      } else {
        console.log("User not logged in.");
      }
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
    const newUserSuggestion = { text: suggestion, isUser: true, timestamp: Date.now() }; // Ensure timestamp is here
    setMessages(prev => [...prev, newUserSuggestion]);
    saveMessageToFirebase(newUserSuggestion);
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
  };

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
              <IconButton sx={{ marginRight: "10px" }} aria-label="world upload" onClick={handleFileUploadToggle}>
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
              <IconButton sx={{ color: "#91ff35" }} aria-label="download" onClick={handleDownloadChat}>
                <MdDownloading size={24} />
              </IconButton>
            </Box>
          </Box>
        </HeaderContainer>

        {/* Profile Section - Conditionally Rendered */}
        {showProfile && <Overlay />}
        {showProfile && <Profile onClose={handleCloseProfile} />}

        {/* Upload Section - Conditionally Rendered */}
        {showFileUpload && <Overlay />}
        {showFileUpload && <FileUploadWindow onClose={handleCloseFileUpload} />}

        {/* Messages Section */}
        <MessagesContainer>
          {isTyping && (
            <MessageBubble isUser={false} text={`Typing${typingDots[typingState]}`} />
          )}
          {messages.map((message, index) => (
            <MessageBubble key={index} isUser={message.isUser} text={message.text} percentage1={message.percentage1}
            percentage2={message.percentage2} />
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
