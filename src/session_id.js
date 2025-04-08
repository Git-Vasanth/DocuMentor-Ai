import { getDatabase, ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { auth } from './firebase.config';
import { useState, useEffect } from 'react';

function SessionId() {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const extractSessionId = () => {
      if (!auth.currentUser) {
        console.error("User not authenticated.");
        return;
      }

      const db = getDatabase();
      const sessionsRef = ref(db, 'sessions');
      const userId = auth.currentUser.uid;

      const userSessionsQuery = query(
        sessionsRef,
        orderByChild('userId'),
        limitToLast(1) // Get the most recent session
      );

      onValue(userSessionsQuery, (snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const sessionData = childSnapshot.val();
            if (sessionData.userId === userId) {
              setSessionId(childSnapshot.key);
              console.log('Extracted Session ID:', childSnapshot.key);
            }
          });
        } else {
          console.log('No sessions found for this user.');
        }
      });
    };

    if (auth.currentUser) {
      extractSessionId();
    }
  }, []);

  return (
    <div>
      {sessionId ? (
        <p>Session ID: {sessionId}</p>
      ) : (
        <p>Loading Session ID...</p>
      )}
    </div>
  );
}

export default SessionId;