import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import axios from 'axios';

// --- YOUR FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDVfPvFLoL5eqQ3WQB96n08K3thdclYXRQ",
  authDomain: "triple-mmm-body-repairs.firebaseapp.com",
  projectId: "triple-mmm-body-repairs",
  storageBucket: "triple-mmm-body-repairs.firebasestorage.app",
  messagingSenderId: "110018101133",
  appId: "1:110018101133:web:63b0996c7050c4967147c4",
  measurementId: "G-NRDPCR0SR2"
};

// --- INITIALIZE FIREBASE ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// --- MAIN APP COMPONENT ---
const EstimateApp = ({ userId }) => {
    const [status, setStatus] = useState('System Ready');

    return (
        <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Bodyshop Estimate Manager</h1>
            
            <div style={{ background: '#e0f2fe', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#0369a1' }}>
                <strong>Status:</strong> {status} <br/>
                <strong>User ID:</strong> {userId}
            </div>

            <fieldset style={{ marginBottom: '20px', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
                <legend style={{ fontWeight: 'bold' }}>Customer Details</legend>
                <input type="text" placeholder="Customer Name" style={{ padding: '8px', width: '100%', marginBottom: '10px' }} />
                <input type="text" placeholder="Vehicle Reg" style={{ padding: '8px', width: '100%' }} />
            </fieldset>

            <fieldset style={{ marginBottom: '20px', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
                <legend style={{ fontWeight: 'bold' }}>Repair Items</legend>
                <p style={{ fontStyle: 'italic', color: '#666' }}>Repair items list will appear here.</p>
                <button style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Item</button>
            </fieldset>

            <button style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>Save Estimate</button>
        </div>
    );
};

// --- AUTHENTICATION WRAPPER ---
const App = () => {
    const [userId, setUserId] = useState(null);
    const [authStatus, setAuthStatus] = useState("Authenticating...");

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                signInAnonymously(auth).catch((error) => {
                    console.error("Auth Error:", error);
                    setAuthStatus("Error: Could not login to database.");
                });
            }
        });
    }, []);

    if (!userId) {
        return <div style={{ padding: '20px' }}><h2>Loading Bodyshop App...</h2><p>{authStatus}</p></div>;
    }

    return <EstimateApp userId={userId} />;
};

export default App;
