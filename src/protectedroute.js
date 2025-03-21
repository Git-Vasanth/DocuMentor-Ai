import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from './firebase.config'; // import your firebase configuration

const ProtectedRoute = ({ component: Component }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe(); // Clean up the subscription when the component is unmounted
  }, []);

  if (loading) {
    // You can show a loading spinner or return null while checking authentication state
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Component />;
};

export default ProtectedRoute;
