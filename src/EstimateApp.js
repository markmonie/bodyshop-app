import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

// --- YOUR TRIPLE MMM CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDVfPvFLoL5eqQ3WQB96n08K3thdclYXRQ",
  authDomain: "triple-mmm-body-repairs.firebaseapp.com",
  projectId: "triple-mmm-body-repairs",
  storageBucket: "triple-mmm-body-repairs.firebasestorage.app",
  messagingSenderId: "110018101133",
  appId: "1:110018101133:web:63b0996c7050c4967147c4",
  measurementId: "G-NRDPCR0SR2"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const EstimateApp = ({ userId }) => {
    const [name, setName] = useState('');
    const [reg, setReg] = useState('');
    const [repair, setRepair] = useState('');
    const [items, setItems] = useState([]); // Current repairs list
    const [savedJobs, setSavedJobs] = useState([]); // Jobs from database
    const [loading, setLoading] = useState(false);

    // Load saved jobs from Database
    useEffect(() => {
        const q = query(collection(db, 'estimates'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSavedJobs(jobs);
        });
        return () => unsubscribe();
    }, []);

    const addItem = () => {
        if (!repair) return;
        setItems([...items, repair]);
        setRepair('');
    };

    const saveJob = async () => {
        if (!name || !reg) return alert("Please enter Name and Reg");
        setLoading(true);
        try {
            await addDoc(collection(db, 'estimates'), {
                customerName: name,
                vehicleReg: reg,
                repairs: items,
                createdAt: serverTimestamp(),
                createdBy: userId
            });
            // Reset form
            setName('');
            setReg('');
            setItems([]);
            alert("Job Saved Successfully!");
        } catch (error) {
            console.error(error);
            alert("Error saving job");
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#2563eb' }}>Triple MMM Estimate Manager</h1>
            
            {/* INPUT FORM */}
            <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3>New Job Sheet</h3>
                <input 
                    style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '10px' }} 
                    placeholder="Customer Name" 
                    value={name} onChange={e => setName(e.target.value)} 
                />
                <input 
                    style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '10px' }} 
                    placeholder="Vehicle Reg (e.g. AB12 CDE)" 
                    value={reg} onChange={e => setReg(e.target.value)} 
                />
                
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                    <input 
                        style={{ flexGrow: 1, padding: '8px' }} 
                        placeholder="Add Repair Item (e.g. Bumper Scratch)" 
                        value={repair} onChange={e => setRepair(e.target.value)} 
                    />
                    <button onClick={addItem} style={{ background: '#4b5563', color: 'white', border: 'none', padding: '8px 15px' }}>Add</button>
                </div>

                <ul style={{ marginBottom: '15px' }}>
                    {items.map((item, index) => <li key={index}>{item}</li>)}
                </ul>

                <button 
                    onClick={saveJob} 
                    disabled={loading}
                    style={{ width: '100%', padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold' }}>
                    {loading ? 'Saving...' : 'SAVE JOB TO CLOUD'}
                </button>
            </div>

            {/* SAVED JOBS LIST */}
            <h3>Recent Jobs (Live from Database)</h3>
            <div>
                {savedJobs.map(job => (
                    <div key={job.id} style={{ background: '#f3f4f6', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{job.customerName} ({job.vehicleReg})</div>
                        <div style={{ color: '#666', fontSize: '0.9em' }}>Repairs: {job.repairs?.join(', ') || 'None'}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Auth Wrapper
const App = () => {
    const [userId, setUserId] = useState(null);
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) setUserId(user.uid);
            else signInAnonymously(auth);
        });
    }, []);
    if (!userId) return <div style={{padding:'20px'}}>Connecting to Triple MMM Database...</div>;
    return <EstimateApp userId={userId} />;
};

export default App;
