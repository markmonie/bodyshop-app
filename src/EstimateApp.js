import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, getDocs } from 'firebase/firestore';

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
    // Customer Details
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    
    // Vehicle Details
    const [reg, setReg] = useState('');
    const [mileage, setMileage] = useState('');
    const [makeModel, setMakeModel] = useState('');

    // Estimate Data
    const [itemDesc, setItemDesc] = useState('');
    const [itemCost, setItemCost] = useState('');
    const [items, setItems] = useState([]);
    
    // Financials
    const [laborHours, setLaborHours] = useState('');
    const [laborRate, setLaborRate] = useState('50');
    const [vatRate, setVatRate] = useState('0');
    const [excess, setExcess] = useState('');
    
    const [savedEstimates, setSavedEstimates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'estimates'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => setSavedEstimates(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }, []);

    // AUTO-POPULATE: Search for vehicle when Reg changes
    const checkHistory = async (regInput) => {
        if(regInput.length < 3) return;
        const q = query(collection(db, 'estimates'), where("reg", "==", regInput), orderBy('createdAt', 'desc')); // Simple search
        try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const prev = querySnapshot.docs[0].data();
                // Found previous job! Auto-fill basic car details
                setMakeModel(prev.makeModel || ''); 
                setName(prev.customer || '');
                setPhone(prev.phone || '');
                setEmail(prev.email || '');
                setAddress(prev.address || '');
                alert("Welcome Back! Found previous customer details for " + regInput);
            }
        } catch(e) { console.log("New customer"); }
    };

    const addItem = () => {
        if (!itemDesc) return;
        setItems([...items, { desc: itemDesc, cost: parseFloat(itemCost) || 0 }]);
        setItemDesc('');
        setItemCost('');
    };

    const clearForm = () => {
        if(window.confirm("Clear entire form?")) {
            setName(''); setAddress(''); setPhone(''); setEmail('');
            setReg(''); setMileage(''); setMakeModel('');
            setItems([]); setLaborHours(''); setExcess('');
        }
    }

    const calculateTotal = () => {
        const parts = items.reduce((acc, i) => acc + i.cost, 0);
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
        if (!name || !reg) return alert("Enter Customer Name & Reg");
        setLoading(true);
        await addDoc(collection(db, 'estimates'), {
            customer: name, address, phone, email,
            reg, mileage, makeModel,
            items, laborHours, laborRate, vatRate, excess,
            totals: calculateTotal(),
            createdAt: serverTimestamp(), createdBy: userId
        });
        alert("Estimate Saved!");
        setLoading(false);
    };

    return (
        <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif', background: 'white' }}>
            
            {/* HEADER / LETTERHEAD */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #2563eb', paddingBottom: '20px', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#2563eb', fontSize: '2.5em' }}>TRIPLE MMM</h1>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '1.2em' }}>BODY REPAIRS</h2>
                </div>
                <div style={{ textAlign: 'right', lineHeight: '1.6', color: '#555' }}>
                    <div><strong>Tel:</strong> 07501 728319</div>
                    <div><strong>Email:</strong> markmonie72@gmail.com</div>
                    <div>Stonehouse, Scotland</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
                
                {/* CUSTOMER DETAILS */}
                <div>
                    <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Customer Details</h3>
                    <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                    <textarea placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} style={{...inputStyle, height: '60px'}} />
                    <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
                    <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                </div>

                {/* VEHICLE DETAILS */}
                <div>
                    <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Vehicle Details</h3>
                    <div style={{display:'flex', gap:'10px'}}>
                        <input 
                            placeholder="Registration (e.g. AB12 CDE)" 
                            value={reg} 
                            onChange={e => setReg(e.target.value)} 
                            onBlur={() => checkHistory(reg)} // Auto-lookup on finish typing
                            style={{...inputStyle, fontWeight:'bold', textTransform:'uppercase'}} 
                        />
                        <input placeholder="Mileage" value={mileage} onChange={e => setMileage(e.target.value)} style={inputStyle} />
                    </div>
                    <input placeholder="Make / Model" value={makeModel} onChange={e => setMakeModel(e.target.value)} style={inputStyle} />
                </div>
            </div>

            {/* REPAIR ITEMS */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                <h3>Repair Specification</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input placeholder="Description of work..." value={itemDesc} onChange={e => setItemDesc(e.target.value)} style={{ flexGrow: 1, padding: '10px', borderRadius:'4px', border:'1px solid #ccc' }} />
                    <input type="number" placeholder="Cost (£)" value={itemCost} onChange={e => setItemCost(e.target.value)} style={{ width: '100px', padding: '10px', borderRadius:'4px', border:'1px solid #ccc' }} />
                    <button onClick={addItem} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor:'pointer' }}>Add</button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{textAlign:'left', color:'#666', fontSize:'0.9em'}}>
                            <th style={{paddingBottom:'10px'}}>Description</th>
                            <th style={{textAlign:'right', paddingBottom:'10px'}}>Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                                <td style={{padding:'10px 0'}}>{item.desc}</td>
                                <td style={{textAlign:'right', padding:'10px 0'}}>£{item.cost.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TOTALS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px', textAlign: 'right' }}>
                    
                    <div style={{marginBottom:'10px'}}>
                        Labor: <input type="number" value={laborHours} onChange={e => setLaborHours(e.target.value)} style={{width:'50px', textAlign:'center'}} /> hrs @ £{laborRate}
                    </div>

                    <div style={rowStyle}><span>Parts Total:</span> <span>£{totals.parts.toFixed(2)}</span></div>
                    <div style={rowStyle}><span>Labor Total:</span> <span>£{totals.labor.toFixed(2)}</span></div>
                    <div style={rowStyle}><span>Subtotal:</span> <span>£{totals.sub.toFixed(2)}</span></div>
                    
                    <div style={rowStyle}>
                        <span>VAT Rate (%): <input type="number" value={vatRate} onChange={e => setVatRate(e.target.value)} style={{width:'40px'}} /></span> 
                        <span>£{totals.vat.toFixed(2)}</span>
                    </div>

                    <div style={{...rowStyle, fontSize:'1.2em', fontWeight:'bold', borderTop:'2px solid #333', marginTop:'10px', paddingTop:'10px'}}>
                        <span>GRAND TOTAL:</span> <span>£{totals.grandTotal.toFixed(2)}</span>
                    </div>

                    <div style={{...rowStyle, color:'#dc2626'}}>
                        <span>Less Excess:</span> 
                        <input type="number" value={excess} onChange={e => setExcess(e.target.value)} style={{width:'70px', textAlign:'right', color:'#dc2626', fontWeight:'bold'}} />
                    </div>

                    <div style={{...rowStyle, fontSize:'1.4em', fontWeight:'bold', color:'#16a34a', marginTop:'10px', borderTop:'2px solid #16a34a', paddingTop:'10px'}}>
                        <span>BALANCE DUE:</span> <span>£{totals.finalDue.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* FOOTER BUTTONS */}
            <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
                <button onClick={saveEstimate} disabled={loading} style={primaryBtn}>
                    {loading ? 'Saving...' : 'SAVE ESTIMATE'}
                </button>
                <button onClick={() => window.print()} style={secondaryBtn}>PRINT / PDF</button>
                <button onClick={clearForm} style={{...secondaryBtn, background:'#ef4444'}}>CLEAR FORM</button>
            </div>

            {/* HISTORY (Hidden on Print) */}
            <div className="no-print" style={{marginTop:'50px', borderTop:'4px solid #eee', paddingTop:'20px'}}>
                <h3 style={{color:'#888'}}>History</h3>
                {savedEstimates.map(est => (
                    <div key={est.id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                        <span>{est.customer} ({est.reg})</span>
                        <span style={{fontWeight:'bold'}}>£{est.totals?.finalDue.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print, button, input[type="number"] { border: none !important; background: transparent !important; }
                    .no-print { display: none !important; }
                    body { padding: 0; margin: 0; }
                }
            `}</style>
        </div>
    );
};

// Styles
const inputStyle = { width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '5px 0' };
const primaryBtn = { flex: 1, padding: '15px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer' };
const secondaryBtn = { flex: 1, padding: '15px', background: '#333', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.1em', cursor: 'pointer' };

const App = () => {
    const [u, sU] = useState(null);
    useEffect(() => onAuthStateChanged(auth, (user) => user ? sU(user.uid) : signInAnonymously(auth)), []);
    if (!u) return <div style={{padding:'20px'}}>Loading System...</div>;
    return <EstimateApp userId={u} />;
};

export default App;
