import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

// --- TRIPLE MMM CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDVfPvFLoL5eqQ3WQB96n08K3thdclYXRQ",
  authDomain: "triple-mmm-body-repairs.firebaseapp.com",
  projectId: "triple-mmm-body-repairs",
  storageBucket: "triple-mmm-body-repairs.firebasestorage.app",
  messagingSenderId: "110018101133",
  appId: "1:110018101133:web:63b0996c7050c4967147c4",
  measurementId: "G-NRDPCR0SR2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const EstimateApp = ({ userId }) => {
    const [name, setName] = useState('');
    const [reg, setReg] = useState('');
    const [itemDesc, setItemDesc] = useState('');
    const [itemCost, setItemCost] = useState('');
    const [items, setItems] = useState([]);
    
    // Financial Settings
    const [laborHours, setLaborHours] = useState('');
    const [laborRate, setLaborRate] = useState('50');
    const [vatRate, setVatRate] = useState('0');
    const [excess, setExcess] = useState(''); // NEW: Customer Excess
    
    const [savedEstimates, setSavedEstimates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'estimates'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => setSavedEstimates(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }, []);

    const addItem = () => {
        if (!itemDesc) return;
        setItems([...items, { desc: itemDesc, cost: parseFloat(itemCost) || 0 }]);
        setItemDesc('');
        setItemCost('');
    };

    const calculateTotal = (currentItems = items) => {
        const parts = currentItems.reduce((acc, i) => acc + i.cost, 0);
        const labor = (parseFloat(laborHours) || 0) * (parseFloat(laborRate) || 0);
        const sub = parts + labor;
        const vatPercent = parseFloat(vatRate) || 0;
        const vat = sub * (vatPercent / 100);
        const grandTotal = sub + vat;
        const excessAmount = parseFloat(excess) || 0;
        const finalDue = grandTotal - excessAmount;
        
        return { parts, labor, sub, vat, grandTotal, excessAmount, finalDue };
    };

    const totals = calculateTotal();

    const saveEstimate = async () => {
        if (!name || !reg) return alert("Enter Customer Details");
        setLoading(true);
        await addDoc(collection(db, 'estimates'), {
            customer: name, reg, items, laborHours, laborRate, vatRate, excess,
            totals: calculateTotal(),
            createdAt: serverTimestamp(), createdBy: userId
        });
        setName(''); setReg(''); setItems([]); setLaborHours(''); setExcess('');
        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2563eb', paddingBottom: '10px' }}>
                <h1 style={{ margin: 0, color: '#2563eb' }}>Triple MMM Estimator</h1>
                <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Print / PDF</button>
            </div>

            {/* CUSTOMER DETAILS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                <input placeholder="Customer Name" value={name} onChange={e => setName(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                <input placeholder="Vehicle Reg" value={reg} onChange={e => setReg(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            {/* REPAIR ITEMS */}
            <div style={{ marginTop: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3>Repair Items & Costs</h3>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                    <input placeholder="Description (e.g. Bumper)" value={itemDesc} onChange={e => setItemDesc(e.target.value)} style={{ flexGrow: 1, padding: '8px' }} />
                    <input type="number" placeholder="Cost (£)" value={itemCost} onChange={e => setItemCost(e.target.value)} style={{ width: '80px', padding: '8px' }} />
                    <button onClick={addItem} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px' }}>Add</button>
                </div>
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }}>
                        <span>{item.desc}</span>
                        <span>£{item.cost.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* LABOR & TOTALS */}
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <div style={{ marginBottom: '5px' }}>
                    <label>Labor Hours: </label>
                    <input type="number" value={laborHours} onChange={e => setLaborHours(e.target.value)} style={{ width: '60px', padding: '5px' }} />
                    x £{laborRate}/hr
                </div>
                
                <div style={{ marginBottom: '15px', color: '#666' }}>
                    <label>VAT Rate (%): </label>
                    <input type="number" value={vatRate} onChange={e => setVatRate(e.target.value)} style={{ width: '60px', padding: '5px', border: '1px solid #ccc' }} />
                </div>

                <div style={{ fontSize: '1.1em', lineHeight: '1.5', borderTop: '2px solid #eee', paddingTop: '10px' }}>
                    <div>Parts: £{totals.parts.toFixed(2)}</div>
                    <div>Labor: £{totals.labor.toFixed(2)}</div>
                    <div>Subtotal: £{totals.sub.toFixed(2)}</div>
                    <div>VAT ({vatRate}%): £{totals.vat.toFixed(2)}</div>
                    <div style={{ fontWeight: 'bold' }}>Grand Total: £{totals.grandTotal.toFixed(2)}</div>
                    
                    {/* NEW: EXCESS BOX */}
                    <div style={{ marginTop: '10px', color: '#dc2626' }}>
                        <label>Less Excess: -£</label>
                        <input type="number" value={excess} onChange={e => setExcess(e.target.value)} style={{ width: '80px', padding: '5px', border: '1px solid #dc2626', color: '#dc2626', fontWeight: 'bold' }} />
                    </div>

                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#16a34a', marginTop: '10px', borderTop: '2px solid #16a34a', paddingTop: '5px' }}>
                        Balance Due: £{totals.finalDue.toFixed(2)}
                    </div>
                </div>
            </div>

            <button onClick={saveEstimate} disabled={loading} style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.2em', cursor: 'pointer' }}>
                {loading ? 'Saving...' : 'SAVE ESTIMATE'}
            </button>

            {/* HISTORY */}
            <h3 style={{ marginTop: '40px', borderBottom: '1px solid #ccc' }}>Saved Estimates</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
                {savedEstimates.map(est => (
                    <div key={est.id} style={{ background: 'white', border: '1px solid #ddd', padding: '15px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <strong>{est.customer}</strong> ({est.reg})
                            <div style={{ fontSize: '0.9em', color: '#666' }}>{est.items?.length} items</div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#2563eb' }}>£{est.totals?.finalDue.toFixed(2)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const App = () => {
    const [u, sU] = useState(null);
    useEffect(() => onAuthStateChanged(auth, (user) => user ? sU(user.uid) : signInAnonymously(auth)), []);
    if (!u) return <div style={{padding:'20px'}}>Loading System...</div>;
    return <EstimateApp userId={u} />;
};

export default App;
