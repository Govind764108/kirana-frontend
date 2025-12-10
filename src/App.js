import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = "https://kirana-backend-4e93.onrender.com"; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Customer States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFather, setNewFather] = useState(''); 
  const [newCity, setNewCity] = useState('');     
  const [newMobile, setNewMobile] = useState('');

  // Transaction States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [txnAmount, setTxnAmount] = useState('');
  const [txnDesc, setTxnDesc] = useState('');
  const [txnType, setTxnType] = useState('GAVE_GOODS');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedLogin = localStorage.getItem('isLoggedIn');
    if (savedLogin === 'true') { setIsLoggedIn(true); fetchCustomers(); }
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/customers`);
      setCustomers(res.data);
    } catch (err) { console.error("Error"); }
  };

  const submitLogin = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/login`, { pin });
      if (res.data.success) { setIsLoggedIn(true); localStorage.setItem('isLoggedIn','true'); fetchCustomers(); }
    } catch (e) { alert("Wrong PIN"); setPin(''); }
  };
  const handlePin = (n) => { if (pin.length < 4) setPin(pin + n); };

  const handleAddCustomer = async () => {
    if (!newName) return alert("Name is mandatory!");
    await axios.post(`${BACKEND_URL}/api/customers`, {
      name: newName, fatherName: newFather, city: newCity, mobile: newMobile
    });
    setNewName(''); setNewFather(''); setNewCity(''); setNewMobile('');
    setShowAddModal(false);
    fetchCustomers();
  };

  const openHistory = async (customer) => {
    setSelectedCustomer(customer);
    const res = await axios.get(`${BACKEND_URL}/api/transactions/${customer._id}`);
    setHistory(res.data);
  };

  const saveTransaction = async () => {
    if (!txnAmount) return;
    await axios.post(`${BACKEND_URL}/api/transaction`, {
      customerId: selectedCustomer._id, type: txnType, amount: Number(txnAmount), description: txnDesc
    });
    setTxnAmount(''); setTxnDesc(''); fetchCustomers(); openHistory(selectedCustomer);
  };

  const deleteTransaction = async (id) => {
    if(!window.confirm("Delete?")) return;
    await axios.delete(`${BACKEND_URL}/api/transaction/${id}`);
    fetchCustomers(); openHistory(selectedCustomer);
  };

  const getCustomersByCity = () => {
    const groups = {};
    customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).forEach(c => {
      const cityName = c.city ? c.city.toUpperCase() : "YOUR CITY";
      if (!groups[cityName]) groups[cityName] = [];
      groups[cityName].push(c);
    });
    return groups;
  };

  // --- AVATAR LOGIC ---
  const getInitials = (name) => {
    if (!name) return "KB";
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const renderCustomerCard = (c) => (
    <div className="card" key={c._id} onClick={() => openHistory(c)}>
      <div className="avatar">{getInitials(c.name)}</div>
      <div className="card-info">
        <h3>{c.name}</h3>
        <p>{c.city ? `📍 ${c.city}` : c.mobile ? `📞 ${c.mobile}` : 'No details'}</p>
      </div>
      <div className="card-right">
        <div className={`balance ${c.totalBalance >= 0 ? 'red' : 'green'}`}>₹ {Math.abs(c.totalBalance)}</div>
        <span className="balance-label">{c.totalBalance >= 0 ? 'You Get' : 'You Pay'}</span>
      </div>
    </div>
  );

  // --- LOCK SCREEN ---
  if (!isLoggedIn) return (
    <div className="login-container">
      <div className="login-box">
        <div style={{fontSize:'3rem', marginBottom:'10px'}}>🔐</div>
        <h2 style={{marginBottom:'30px', color:'white'}}>KiranaBook</h2>
        <div className="pin-dots" style={{color:'white'}}>{pin.split('').map(()=>'•').join('')}</div>
        <div className="num-pad">
          {[1,2,3,4,5,6,7,8,9].map(n=><button key={n} className="num-btn" onClick={()=>handlePin(n)}>{n}</button>)}
          <button className="num-btn clr-btn" onClick={()=>setPin('')}>CLR</button>
          <button className="num-btn" onClick={()=>handlePin(0)}>0</button>
          <button className="num-btn enter-btn" onClick={submitLogin}>→</button>
        </div>
      </div>
    </div>
  );

  // --- HISTORY VIEW ---
  if (selectedCustomer) return (
    <div className="container">
      <div className="app-header">
        <button className="header-btn" onClick={() => setSelectedCustomer(null)}>← Back</button>
        <span className="app-title">{selectedCustomer.name}</span>
        <div style={{width:'50px'}}></div>
      </div>
      <div style={{padding:'30px 0', textAlign:'center'}}>
        <div className="avatar" style={{margin:'0 auto 15px auto', width:'80px', height:'80px', fontSize:'2rem', background:'white', color:'var(--primary)'}}>{getInitials(selectedCustomer.name)}</div>
        <h1 style={{fontSize:'2.8rem', color: selectedCustomer.totalBalance >= 0 ? '#D32F2F' : '#00897B'}}>₹ {Math.abs(selectedCustomer.totalBalance)}</h1>
        <p style={{color: '#666'}}>{selectedCustomer.totalBalance >= 0 ? 'Pending Receive' : 'Advance Payment'}</p>
      </div>
      <div style={{background:'#fff', borderRadius:'30px 30px 0 0', padding:'25px', minHeight:'50vh', boxShadow:'0 -4px 20px rgba(0,0,0,0.05)'}}>
        <h3 style={{marginBottom:'20px', color:'#444'}}>Transactions</h3>
        {history.map(txn => (
          <div className="history-row" key={txn._id}>
            <div>
              <p style={{fontWeight:'700', fontSize:'1rem', color:'#333'}}>{txn.description || (txn.type === 'GAVE_GOODS' ? 'Goods Sold' : 'Payment')}</p>
              <span className="date-badge">{new Date(txn.date).toLocaleDateString()}</span>
            </div>
            <div style={{textAlign:'right', display:'flex', alignItems:'center'}}>
              <span className={`txn-badge ${txn.type === 'GAVE_GOODS' ? 'badge-gave' : 'badge-got'}`}>
                {txn.type === 'GAVE_GOODS' ? '+' : '-'} ₹{txn.amount}
              </span>
              <button onClick={()=>deleteTransaction(txn._id)} style={{border:'none', background:'none', marginLeft:'15px', color:'#ccc', fontSize:'1.2rem'}}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-primary" style={{position:'fixed', bottom:'30px', right:'20px', width:'auto', borderRadius:'50px', padding:'16px 32px', boxShadow:'0 10px 25px rgba(95, 37, 159, 0.4)', zIndex: 150}} onClick={()=> setShowAddModal(true)}>+ New Entry</button>
      
      {/* TRANSACTION MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e)=>e.target.className==='modal-overlay' && setShowAddModal(false)}>
          <div className="modal-content">
            <button className="btn-close" onClick={()=>setShowAddModal(false)}>×</button>
            <h2 className="modal-title">New Entry</h2>
            <div style={{display:'flex', gap:'15px', marginBottom:'25px'}}>
              <button style={{flex:1, padding:'15px', border: txnType==='GAVE_GOODS'?'2px solid #D32F2F':'1px solid #eee', background: txnType==='GAVE_GOODS'?'#FFEBEE':'white', color: txnType==='GAVE_GOODS'?'#D32F2F':'#888', borderRadius:'12px', fontWeight:'bold'}} onClick={()=>setTxnType('GAVE_GOODS')}>🔴 GAVE</button>
              <button style={{flex:1, padding:'15px', border: txnType==='GOT_PAYMENT'?'2px solid #00897B':'1px solid #eee', background: txnType==='GOT_PAYMENT'?'#E0F2F1':'white', color: txnType==='GOT_PAYMENT'?'#00897B':'#888', borderRadius:'12px', fontWeight:'bold'}} onClick={()=>setTxnType('GOT_PAYMENT')}>🟢 GOT</button>
            </div>
            <div className="input-group"><label>Amount</label><input type="number" placeholder="₹ 0" className="modal-input" autoFocus value={txnAmount} onChange={(e)=>setTxnAmount(e.target.value)} style={{fontSize:'1.5rem', fontWeight:'bold', color:'var(--primary)'}} /></div>
            <div className="input-group"><label>Note</label><input type="text" placeholder="e.g. Rice, Sugar" className="modal-input" value={txnDesc} onChange={(e)=>setTxnDesc(e.target.value)} /></div>
            <button className="btn-primary" onClick={()=>{saveTransaction(); setShowAddModal(false);}}>Save</button>
          </div>
        </div>
      )}
    </div>
  );

  // --- DASHBOARD ---
  return (
    <div className="container">
      <div className="app-header">
        <span className="app-title">KiranaBook</span>
        <button className="header-btn" onClick={()=>setShowAddModal(true)}>+ ADD</button>
      </div>
      <input type="text" className="search-bar" placeholder="🔍 Search customers..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />

      {activeTab === 'dashboard' ? <div>{customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(renderCustomerCard)}</div> 
      : <div>{Object.entries(getCustomersByCity()).map(([city, list]) => (<div key={city} className="city-section"><div className="city-header">{city}</div>{list.map(renderCustomerCard)}</div>))}</div>}

      <div className="nav-bar">
        <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}><span className="nav-icon">🏠</span><span>Home</span></button>
        <button className={`nav-item ${activeTab==='cities'?'active':''}`} onClick={()=>setActiveTab('cities')}><span className="nav-icon">🏙️</span><span>Cities</span></button>
        <button className="nav-item" onClick={()=>{setIsLoggedIn(false); localStorage.removeItem('isLoggedIn')}}><span className="nav-icon">👤</span><span>Profile</span></button>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={(e)=>e.target.className==='modal-overlay' && setShowAddModal(false)}>
          <div className="modal-content">
            <button className="btn-close" onClick={()=>setShowAddModal(false)}>×</button>
            <h2 className="modal-title">New Customer</h2>
            <div className="input-group"><label>Name *</label><input className="modal-input" value={newName} onChange={(e)=>setNewName(e.target.value)} /></div>
            <div className="input-group"><label>Father's Name</label><input className="modal-input" value={newFather} onChange={(e)=>setNewFather(e.target.value)} /></div>
            <div className="input-group"><label>City</label><input className="modal-input" value={newCity} onChange={(e)=>setNewCity(e.target.value)} /></div>
            <div className="input-group"><label>Mobile</label><input className="modal-input" type="number" value={newMobile} onChange={(e)=>setNewMobile(e.target.value)} /></div>
            <button className="btn-primary" onClick={handleAddCustomer}>Save Customer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;