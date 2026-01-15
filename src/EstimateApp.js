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
    // Mode: 'ESTIMATE' or 'INVOICE'
    const [mode, setMode] = useState('ESTIMATE');
    const [invoiceNum, setInvoiceNum] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');

    // Inputs
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [reg, setReg] = useState('');
    const [mileage, setMileage] = useState('');
    const [makeModel, setMakeModel] = useState('');

    // Line Items
    const [itemDesc, setItemDesc] = useState('');
    const [itemCost, setItemCost] = useState('');
    const [items, setItems] = useState([]);
    
    // Financials
    const [laborHours, setLaborHours] = useState('');
    const [laborRate, setLaborRate] = useState('50');
    const [vatRate, setVatRate] = useState('0');
    const [excess, setExcess] = useState('');
    
    // Data
    const [savedEstimates, setSavedEstimates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'estimates'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => setSavedEstimates(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }, []);

    // History Lookup
    const checkHistory = async (regInput) => {
        if(regInput.length < 3) return;
        const q = query(collection(db, 'estimates'), where("reg", "==", regInput), orderBy('createdAt', 'desc'));
        try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const prev = querySnapshot.docs[0].data();
                setMakeModel(prev.makeModel || ''); 
                setName(prev.customer || '');
                setPhone(prev.phone || '');
                setEmail(prev.email || '');
                setAddress(prev.address || '');
                alert("Found previous details for " + regInput);
            }
        } catch(e) { }
    };

    const addItem = () => {
        if (!itemDesc) return;
        setItems([...items, { desc: itemDesc, cost: parseFloat(itemCost) || 0 }]);
        setItemDesc('');
        setItemCost('');
    };

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

    const clearForm = () => {
        if(window.confirm("Start fresh?")) {
            setMode('ESTIMATE');
            setInvoiceNum(''); setInvoiceDate('');
            setName(''); setAddress(''); setPhone(''); setEmail('');
            setReg(''); setMileage(''); setMakeModel('');
            setItems([]); setLaborHours(''); setExcess('');
        }
    }

    const saveToCloud = async (type) => {
        if (!name || !reg) return alert("Enter Customer Name & Reg");
        setLoading(true);
        // If generating invoice, create number
        let finalInvNum = invoiceNum;
        if(type === 'INVOICE' && !finalInvNum) {
            // Simple numbering: Count existing estimates + 1000
            finalInvNum = `INV-${1000 + savedEstimates.length + 1}`;
            setInvoiceNum(finalInvNum);
            setInvoiceDate(new Date().toLocaleDateString());
            setMode('INVOICE');
        }

        await addDoc(collection(db, 'estimates'), {
            type: type, // 'ESTIMATE' or 'INVOICE'
            invoiceNumber: finalInvNum,
            customer: name, address, phone, email,
            reg, mileage, makeModel,
            items, laborHours, laborRate, vatRate, excess,
            totals: calculateTotal(),
            createdAt: serverTimestamp(), createdBy: userId
        });
        
        if(type === 'ESTIMATE') alert("Estimate Saved!");
        setLoading(false);
    };

    return (
        <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif', background: 'white' }}>
            
            {/* LETTERHEAD */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #2563eb', paddingBottom: '20px', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#2563eb', fontSize: '2.5em' }}>TRIPLE MMM</h1>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '1.2em' }}>BODY REPAIRS</h2>
                    <div style={{ marginTop: '10px', color: '#555', fontSize: '0.9em' }}>
                        20A New Street<br/>Stonehouse<br/>ML9 3LT
                    </div>
                </div>
                <div style={{ textAlign: 'right', color: '#555' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: mode === 'INVOICE' ? '#16a34a' : '#666' }}>
                        {mode}
                    </div>
                    {mode === 'INVOICE' && (
                        <div style={{ marginTop: '10px' }}>
                            <div><strong>Invoice #:</strong> {invoiceNum}</div>
                            <div><strong>Date:</strong> {invoiceDate}</div>
                        </div>
                    )}
                    <div style={{ marginTop: '15px' }}>
                        <div><strong>Tel:</strong> 07501 728319</div>
                        <div><strong>Email:</strong> markmonie72@gmail.com</div>
                    </div>
                </div>
            </div>

            {/* CUSTOMER & VEHICLE GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
                <div>
                    <h3 style={headerStyle}>Customer</h3>
                    <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                    <textarea placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} style={{...inputStyle, height: '60px'}} />
                    <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
                    <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                </div>
                <div>
                    <h3 style={headerStyle}>Vehicle</h3>
                    <div style={{display:'flex', gap:'10px'}}>
                        <input placeholder="Reg" value={reg} onChange={e => setReg(e.target.value)} onBlur={() => checkHistory(reg)} style={{...inputStyle, fontWeight:'bold', textTransform:'uppercase'}} />
                        <input placeholder="Mileage" value={mileage} onChange={e => setMileage(e.target.value)} style={inputStyle} />
                    </div>
                    <input placeholder="Make / Model" value={makeModel} onChange={e => setMakeModel(e.target.value)} style={inputStyle} />
                </div>
            </div>

            {/* REPAIRS (Hidden input in print mode) */}
            <div style={{ marginBottom: '30px' }}>
                <div className="no-print" style={{ background: '#f8fafc', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input placeholder="Add Repair Item..." value={itemDesc} onChange={e => setItemDesc(e.target.value)} style={{ flexGrow: 1, padding: '10px' }} />
                        <input type="number" placeholder="Cost" value={itemCost} onChange={e => setItemCost(e.target.value)} style={{ width: '80px', padding: '10px' }} />
                        <button onClick={addItem} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px' }}>Add</button>
                    </div>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{textAlign:'left', borderBottom:'2px solid #ddd'}}>
                            <th style={{padding:'10px'}}>Description</th>
                            <th style={{textAlign:'right', padding:'10px'}}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{padding:'10px'}}>{item.desc}</td>
                                <td style={{textAlign:'right', padding:'10px'}}>£{item.cost.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TOTALS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px', textAlign: 'right' }}>
                    <div className="no-print" style={{marginBottom:'10px'}}>
                        Labor: <input type="number" value={laborHours} onChange={e => setLaborHours(e.target.value)} style={{width:'50px'}} /> hrs @ £{laborRate}
                    </div>
                    <div style={rowStyle}><span>Labor Total:</span> <span>£{totals.labor.toFixed(2)}</span></div>
                    <div style={rowStyle}><span>Parts Total:</span> <span>£{totals.parts.toFixed(2)}</span></div>
                    <div style={rowStyle}><span>Subtotal:</span> <span>£{totals.sub.toFixed(2)}</span></div>
                    <div style={rowStyle}>
                        <span>VAT ({vatRate}%):</span> 
                        <span className="no-print"><input type="number" value={vatRate} onChange={e => setVatRate(e.target.value)} style={{width:'40px'}} /></span>
                        <span style={{marginLeft:'5px'}}>£{totals.vat.toFixed(2)}</span>
                    </div>
                    <div style={{...rowStyle, fontSize:'1.2em', fontWeight:'bold', borderTop:'2px solid #333', marginTop:'5px'}}>
                        <span>GRAND TOTAL:</span> <span>£{totals.grandTotal.toFixed(2)}</span>
                    </div>
                    <div style={{...rowStyle, color:'#dc2626'}}>
                        <span>Less Excess:</span>
                        <span className="no-print"><input type="number" value={excess} onChange={e => setExcess(e.target.value)} style={{width:'60px'}} /></span> 
                        <span>-£{totals.excessAmount.toFixed(2)}</span>
                    </div>
                    <div style={{...rowStyle, fontSize:'1.4em', fontWeight:'bold', color:'#16a34a', borderTop:'2px solid #16a34a', marginTop:'5px', paddingTop:'5px'}}>
                        <span>BALANCE DUE:</span> <span>£{totals.finalDue.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* BANK DETAILS (Only Visible in Invoice Mode) */}
            {mode === 'INVOICE' && (
                <div style={{ marginTop: '40px', borderTop: '2px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <strong>Bank Transfer Details:</strong><br/>
                        Account Name: TRIPLE MMM BODY REPAIRS<br/>
                        Account: <strong>06163462</strong><br/>
                        Sort Code: <strong>80-22-60</strong><br/>
                        Bank: BANK OF SCOTLAND
                    </div>
                    <div style={{ textAlign: 'center', width: '300px' }}>
                        <div style={{ borderBottom: '1px solid #333', height: '40px', marginBottom: '5px' }}></div>
                        Signed
                        <div style={{ borderBottom: '1px solid #333', height: '30px', marginBottom: '5px', width: '50%', marginLeft: 'auto', marginRight: 'auto' }}></div>
                        Date
                    </div>
                </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="no-print" style={{ marginTop: '50px', display: 'flex', gap: '15px', padding: '20px', background: '#eee', borderRadius: '8px' }}>
                <button onClick={() => saveToCloud('ESTIMATE')} disabled={loading} style={primaryBtn}>SAVE ESTIMATE</button>
                <button onClick={() => saveToCloud('INVOICE')} style={{...primaryBtn, background: '#7c3aed'}}>GENERATE INVOICE</button>
                <button onClick={() => window.print()} style={{...primaryBtn, background: '#333'}}>PRINT / PDF</button>
                <button onClick={clearForm} style={{...primaryBtn, background: '#ef4444'}}>CLEAR FORM</button>
            </div>

            {/* SAVED LIST */}
            <div className="no-print" style={{marginTop:'30px'}}>
                <h3>Recent Activity</h3>
                {savedEstimates.map(est => (
                    <div key={est.id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', color: est.type === 'INVOICE' ? '#7c3aed' : '#333'}}>
                        <span>{est.type === 'INVOICE' ? `📄 ${est.invoiceNumber}` : '📝 Estimate'} - {est.customer} ({est.reg})</span>
                        <strong>£{est.totals?.finalDue.toFixed(2)}</strong>
                    </div>
                ))}
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 0; margin: 0; background: white; }
                    input, textarea { border: none !important; resize: none; }
                }
            `}</style>
        </div>
    );
};

// Styles
const inputStyle = { width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const headerStyle = { borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '2px 0' };
const primaryBtn = { flex: 1, padding: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };

const App = () => {
    const [u, sU] = useState(null);
    useEffect(() => onAuthStateChanged(auth, (user) => user ? sU(user.uid) : signInAnonymously(auth)), []);
    if (!u) return <div style={{padding:'20px'}}>System Loading...</div>;
    return <EstimateApp userId={u} />;
};

export default App;
