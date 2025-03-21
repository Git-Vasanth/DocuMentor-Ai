import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './home'; 
import SignUp from "./signup"
import Login from "./login"
import Chat from './chat';
import ProtectedRoute from './protectedroute'
import ChatInterface from './chatopen'
import fontest  from './font-test';


const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Routes> 
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<ProtectedRoute component={Chat} />} />
          <Route path='/chatopen' element={<ProtectedRoute component={ChatInterface} />} />
          <Route path='/font-test' element={<ProtectedRoute component={fontest} />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

