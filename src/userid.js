import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const UserInfo = () => {
    const [userId, setUserId] = useState(null);
    const [user, setUser] = useState(null); //store the whole user object.

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, see docs for a list of available properties
                // https://firebase.google.com/docs/reference/js/firebase.User
                const uid = user.uid; // Get the user's UID
                setUserId(uid);
                setUser(user);
            } else {
                // User is signed out
                setUserId(null);
                setUser(null);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    if (userId) {
        return (
            <div>
                <p>User ID: {userId}</p>
                <p>User Email: {user.email}</p>
                {/* Add other user details you want to display */}
            </div>
        );
    } else {
        return <p>User not signed in.</p>;
    }
};

export default UserInfo;