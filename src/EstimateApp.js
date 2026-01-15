
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
    // Modes: 'ESTIMATE', 'INVOICE', 'SATISFACTION'
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
    
    // System
    const [savedEstimates, setSavedEstimates] = useState([]);
    const [saveStatus, setSaveStatus] = useState('IDLE'); // IDLE, SAVING, SUCCESS

    useEffect(() => {
        const q = query(collection(db, 'estimates'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => setSavedEstimates(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }, []);

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
            setSaveStatus('IDLE');
        }
    }

    const saveToCloud = async (type) => {
        if (!name || !reg) return alert("Enter Customer Name & Reg");
        setSaveStatus('SAVING');
        
        let finalInvNum = invoiceNum;
        if(type === 'INVOICE' && !finalInvNum) {
            finalInvNum = `INV-${1000 + savedEstimates.length + 1}`;
            setInvoiceNum(finalInvNum);
            setInvoiceDate(new Date().toLocaleDateString());
            setMode('INVOICE');
        }

        await addDoc(collection(db, 'estimates'), {
            type: type,
            invoiceNumber: finalInvNum,
            customer: name, address, phone, email,
            reg, mileage, makeModel,
            items, laborHours, laborRate, vatRate, excess,
            totals: calculateTotal(),
            createdAt: serverTimestamp(), createdBy: userId
        });
        
        setSaveStatus('SUCCESS');
        setTimeout(() => setSaveStatus('IDLE'), 3000); 
    };

    return (
        <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif', background: 'white' }}>
            
            {/* BRANDED HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #cc0000', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                    <div style={{ fontSize: '3em', fontWeight: '900', letterSpacing: '-2px', lineHeight:'0.9' }}>
                        <span style={{color: 'black'}}>TRIPLE</span><br/>
                        <span style={{color: '#cc0000'}}>MMM</span>
                    </div>
                    <div style={{ borderLeft: '2px solid #333', paddingLeft: '20px', height: '60px', display: 'flex', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#333', letterSpacing: '2px' }}>BODY REPAIRS</div>
                    </div>
                </div>
                
                <div style={{ textAlign: 'right', fontSize: '0.9em', color: '#333', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '5px' }}>20A New Street, Stonehouse, ML9 3LT</div>
                    <div>Tel: <strong>07501 728319</strong></div>
                    <div>Email: markmonie72@gmail.com</div>
                </div>
            </div>

            {/* TITLE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '2em', color: mode === 'SATISFACTION' ? '#d97706' : '#333', textTransform: 'uppercase' }}>
                        {mode === 'SATISFACTION' ? 'SATISFACTION NOTE' : mode}
                    </h2>
                </div>
                {mode !== 'ESTIMATE' && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{invoiceNum}</div>
                        <div>{invoiceDate}</div>
                    </div>
                )}
            </div>

            {/* CUSTOMER GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                <div>
                    <h4 style={headerStyle}>CLIENT DETAILS</h4>
                    <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                    <textarea placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} style={{...inputStyle, height: '60px', fontFamily: 'inherit'}} />
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px'}}>
                        <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
                        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                    </div>
                </div>
                <div>
                    <h4 style={headerStyle}>VEHICLE DETAILS</h4>
                    <div style={{display:'flex', gap:'10px'}}>
                        <input placeholder="Reg" value={reg} onChange={e => setReg(e.target.value)} onBlur={() => checkHistory(reg)} style={{...inputStyle, fontWeight:'bold', textTransform:'uppercase', background:'#f0f9ff'}} />
                        <input placeholder="Mileage" value={mileage} onChange={e => setMileage(e.target.value)} style={inputStyle} />
                    </div>
                    <input placeholder="Make / Model" value={makeModel} onChange={e => setMakeModel(e.target.value)} style={inputStyle} />
                </div>
            </div>

            {/* MODE SWITCHER */}
            {mode !== 'SATISFACTION' && (
                <>
                    <div className="no-print" style={{ background: '#f8fafc', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder="Add Repair Item..." value={itemDesc} onChange={e => setItemDesc(e.target.value)} style={{ flexGrow: 1, padding: '10px' }} />
                            <input type="number" placeholder="Cost" value={itemCost} onChange={e => setItemCost(e.target.value)} style={{ width: '80px', padding: '10px' }} />
                            <button onClick={addItem} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                        </div>
                    </div>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                        <thead>
                            <tr style={{textAlign:'left', borderBottom:'2px solid #333', color: '#333'}}>
                                <th style={{padding:'10px'}}>DESCRIPTION OF WORK</th>
                                <th style={{textAlign:'right', padding:'10px'}}>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{padding:'12px 10px'}}>{item.desc}</td>
                                    <td style={{textAlign:'right', padding:'12px 10px'}}>£{item.cost.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

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
                            <div style={{...rowStyle, fontSize:'1.4em', fontWeight:'bold', color:'#333', borderTop:'2px solid #333', marginTop:'5px', paddingTop:'10px'}}>
                                <span>BALANCE DUE:</span> <span>£{totals.finalDue.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {mode === 'INVOICE' && (
                        <div style={{ marginTop: '50px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', border: '1px solid #ddd' }}>
                            <div>
                                <h4 style={{margin:'0 0 10px 0'}}>PAYMENT DETAILS</h4>
                                <div style={{fontSize:'0.9em', lineHeight:'1.6'}}>
                                    Account Name: <strong>TRIPLE MMM BODY REPAIRS</strong><br/>
                                    Account No: <strong>06163462</strong><br/>
                                    Sort Code: <strong>80-22-60</strong><br/>
                                    Bank: <strong>BANK OF SCOTLAND</strong>
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', width: '250px', marginTop: '20px' }}>
                                <div style={{ borderBottom: '1px solid #333', height: '40px', marginBottom: '5px' }}></div>
                                <div style={{fontSize:'0.8em', color:'#666'}}>AUTHORISED SIGNATURE</div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* SATISFACTION NOTE */}
            {mode === 'SATISFACTION' && (
                <div style={{ marginTop: '20px', padding: '30px', border: '2px solid #333' }}>
                    <p style={{ lineHeight: '1.8', fontSize: '1.1em' }}>
                        I/We being the owner/policyholder of vehicle registration <strong>{reg}</strong> hereby confirm that the repairs attended to by <strong>TRIPLE MMM BODY REPAIRS</strong> have been completed to my/our entire satisfaction.
                    </p>
                    <p style={{ lineHeight: '1.8', fontSize: '1.1em' }}>
                        I/We authorize payment to be made directly to the repairer in respect of the invoice number <strong>{invoiceNum}</strong> relative to this claim.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '80px' }}>
                        <div style={{ width: '45%' }}>
                            <div style={{ borderBottom: '1px solid #333', height: '1px', marginBottom: '10px' }}></div>
                            <strong>Customer Signature</strong>
                        </div>
                        <div style={{ width: '45%' }}>
                            <div style={{ borderBottom: '1px solid #333', height: '1px', marginBottom: '10px' }}></div>
                            <strong>Date</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="no-print" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '15px', background: 'white', borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'center', gap: '15px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
                <button onClick={() => saveToCloud('ESTIMATE')} disabled={saveStatus === 'SAVING'} style={saveStatus === 'SUCCESS' ? successBtn : primaryBtn}>
                    {saveStatus === 'SAVING' ? 'SAVING...' : (saveStatus === 'SUCCESS' ? '✅ SAVED!' : 'SAVE ESTIMATE')}
                </button>
                {mode === 'ESTIMATE' && <button onClick={() => saveToCloud('INVOICE')} style={secondaryBtn}>GENERATE INVOICE</button>}
                {mode === 'INVOICE' && <button onClick={() => setMode('SATISFACTION')} style={{...secondaryBtn, background: '#d97706'}}>CREATE SATISFACTION NOTE</button>}
                <button onClick={() => window.print()} style={{...secondaryBtn, background: '#333'}}>PRINT / PDF</button>
                <button onClick={clearForm} style={{...secondaryBtn, background: '#ef4444'}}>NEW JOB</button>
            </div>

            {/* SAVED LIST */}
            <div className="no-print" style={{marginTop:'100px', paddingBottom:'80px'}}>
                <h3 style={{color:'#888', borderBottom:'1px solid #eee'}}>Recent Jobs</h3>
                {savedEstimates.map(est => (
                    <div key={est.id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', color: est.type === 'INVOICE' ? '#16a34a' : '#333'}}>
                        <span>{est.type === 'INVOICE' ? `📄 ${est.invoiceNumber}` : '📝 Estimate'} - {est.customer} ({est.reg})</span>
                        <strong>£{est.totals?.finalDue.toFixed(2)}</strong>
                    </div>
                ))}
            </div>

            {/* Styles for Printing */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 0; margin: 0; background: white; }
                    input, textarea { border: none !important; resize: none; font-family: inherit; }
                    input::placeholder, textarea::placeholder { color: transparent; }
                }
            `}</style>
        </div>
    );
};

// Styles
const inputStyle = { width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1em' };
const headerStyle = { borderBottom: '2px solid #cc0000', paddingBottom: '5px', marginBottom: '10px', color: '#cc0000', fontSize: '0.9em' };
const primaryBtn = { padding: '12px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const successBtn = { padding: '12px 24px', background: '#15803d', color: 'white', border: '2px solid #16a34a', borderRadius: '6px', fontWeight: 'bold', cursor: 'default' };
const secondaryBtn = { padding: '12px 24px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };

const App = () => {
    const [u, sU] = useState(null);
    useEffect(() => onAuthStateChanged(auth, (user) => user ? sU(user.uid) : signInAnonymously(auth)), []);
    if (!u) return <div style={{padding:'20px'}}>Loading System...</div>;
    return <EstimateApp userId={u} />;
};

export default App;
