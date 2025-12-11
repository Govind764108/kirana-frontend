/* App.js - Added Edit Customer Feature */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = "https://kirana-backend-4e93.onrender.com"; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('home'); 
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Customer & Edit States
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // NEW: Track if we are editing
  const [editId, setEditId] = useState(null);        // NEW: Track who we are editing
  
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

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const savedLogin = localStorage.getItem('isLoggedIn');
    if (savedLogin === 'true') { setIsLoggedIn(true); fetchCustomers(); }
  }, []);

  // --- 2. BACK BUTTON HANDLER ---
  useEffect(() => {
    const handlePopState = (event) => {
      if (selectedCustomer) {
        setSelectedCustomer(null);
      } else if (showAddModal) {
        setShowAddModal(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedCustomer, showAddModal]);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/customers`);
      setCustomers(res.data);
    } catch (err) { console.error("Error fetching customers"); }
  };

  const submitLogin = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/login`, { pin });
      if (res.data.success) { setIsLoggedIn(true); localStorage.setItem('isLoggedIn','true'); fetchCustomers(); }
    } catch (e) { alert("Wrong PIN"); setPin(''); }
  };
  const handlePin = (n) => { if (pin.length < 4) setPin(pin + n); };
  
  const handleLogout = () => {
    if(window.confirm("Do you want to logout?")) {
        setIsLoggedIn(false); 
        localStorage.removeItem('isLoggedIn');
        setPin('');
    }
  };

  // --- NEW: HANDLE SAVE (Create OR Edit) ---
  const handleSaveCustomer = async () => {
    if (!newName) return alert("Name is mandatory!");
    
    try {
      if (isEditing) {
        // UPDATE EXISTING CUSTOMER
        await axios.put(`${BACKEND_URL}/api/customers/${editId}`, {
          name: newName, fatherName: newFather, city: newCity, mobile: newMobile
        });
        
        // Update the selected customer view locally so changes show immediately
        if (selectedCustomer && selectedCustomer._id === editId) {
            setSelectedCustomer(prev => ({ ...prev, name: newName, fatherName: newFather, city: newCity, mobile: newMobile }));
        }
      } else {
        // CREATE NEW CUSTOMER
        await axios.post(`${BACKEND_URL}/api/customers`, {
          name: newName, fatherName: newFather, city: newCity, mobile: newMobile
        });
      }

      // Cleanup
      setNewName(''); setNewFather(''); setNewCity(''); setNewMobile('');
      if(showAddModal) window.history.back(); 
      fetchCustomers();

    } catch (error) {
      alert("Error saving customer. Backend might not support updates yet.");
      console.error(error);
    }
  };

  // Setup Modal for ADDING new customer
  const openAddModal = () => {
    setIsEditing(false);
    setNewName(''); setNewFather(''); setNewCity(''); setNewMobile('');
    window.history.pushState({ page: 'modal' }, '', '');
    setShowAddModal(true);
  };

  // Setup Modal for EDITING existing customer
  const openEditModal = () => {
    if(!selectedCustomer) return;
    setIsEditing(true);
    setEditId(selectedCustomer._id);
    // Pre-fill data
    setNewName(selectedCustomer.name);
    setNewFather(selectedCustomer.fatherName || '');
    setNewCity(selectedCustomer.city || '');
    setNewMobile(selectedCustomer.mobile || '');
    
    window.history.pushState({ page: 'modal' }, '', '');
    setShowAddModal(true);
  };

  // DELETE Customer
  const deleteCustomer = async (id) => {
    if(!window.confirm("ARE YOU SURE?\n\nThis will permanently delete this customer.")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/customers/${id}`);
      setSelectedCustomer(null); 
      fetchCustomers();          
      window.history.back();     
    } catch (err) {
      alert("Backend Error: The server does not allow deleting customers.");
    }
  };

  // Open Transaction History
  const openHistory = async (customer) => {
    window.history.pushState({ page: 'details' }, '', '');
    setSelectedCustomer(customer);
    const res = await axios.get(`${BACKEND_URL}/api/transactions/${customer._id}`);
    setHistory(res.data);
  };

  const closeHistory = () => {
    window.history.back(); 
  };

  // --- TRANSACTION ACTIONS ---
  const saveTransaction = async () => {
    if (!txnAmount) return;
    await axios.post(`${BACKEND_URL}/api/transaction`, {
      customerId: selectedCustomer._id, type: txnType, amount: Number(txnAmount), description: txnDesc
    });
    setTxnAmount(''); setTxnDesc(''); fetchCustomers(); 
    const res = await axios.get(`${BACKEND_URL}/api/transactions/${selectedCustomer._id}`);
    setHistory(res.data);
    setShowAddModal(false);
    window.history.back(); 
  };

  const deleteTransaction = async (id) => {
    if(!window.confirm("Delete this entry?")) return;
    await axios.delete(`${BACKEND_URL}/api/transaction/${id}`);
    fetchCustomers(); 
    const res = await axios.get(`${BACKEND_URL}/api/transactions/${selectedCustomer._id}`);
    setHistory(res.data);
  };

  const getCustomersByCity = () => {
    const groups = {};
    customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).forEach(c => {
      const cityName = c.city ? c.city.toUpperCase() : "OTHER";
      if (!groups[cityName]) groups[cityName] = [];
      groups[cityName].push(c);
    });
    return groups;
  };

  // === INITIALS HELPER ===
  const getInitials = (name) => {
    if (!name) return "KB";
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // === CARD RENDERER ===
  const renderCustomerCard = (c) => {
    const isCredit = c.totalBalance >= 0; 
    return (
      <div className="card" key={c._id} onClick={() => openHistory(c)}>
        <div className={`card-icon ${isCredit ? 'icon-credit' : 'icon-paid'}`}>
          {getInitials(c.name)}
        </div>
        <div className="card-info">
          <h3>{c.name}</h3>
          <p className="card-details">
             {c.city ? `📍 ${c.city}` : c.mobile ? `📞 ${c.mobile}` : 'No details'}
          </p>
        </div>
        <div className="card-right">
          <div className={`amount ${isCredit ? 'txt-credit' : 'txt-paid'}`}>
            ₹ {Math.abs(c.totalBalance)}
          </div>
          <span className={`status ${isCredit ? 'txt-credit' : 'txt-paid'}`}>
            {isCredit ? 'Given' : 'Advance'}
          </span>
        </div>
      </div>
    );
  }

  // --- LOCK SCREEN ---
  if (!isLoggedIn) return (
    <div className="login-container">
      <div className="login-box">
        <div style={{fontSize:'3rem', marginBottom:'10px'}}>🔐</div>
        <h2 style={{marginBottom:'10px', color:'white', fontWeight:'800'}}>KiranaBook</h2>
        <p style={{color:'rgba(255,255,255,0.8)', marginBottom:'30px'}}>Secure Login</p>
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

  // --- CUSTOMER DETAILS VIEW ---
  if (selectedCustomer) return (
    <div style={{minHeight:'100vh', background:'var(--bg)'}}>
      <div className="app-header">
        <button className="icon-btn" onClick={closeHistory}>←</button>
        <span className="app-title">{selectedCustomer.name}</span>
        
        <div style={{display:'flex', gap:'10px'}}>
           {/* EDIT BUTTON */}
           <button 
            className="icon-btn" 
            onClick={openEditModal}
            style={{fontSize:'1.2rem', opacity: 0.9}}
            title="Edit Customer"
          >
            ✏️
          </button>
           {/* DELETE BUTTON */}
          <button 
            className="icon-btn" 
            onClick={() => deleteCustomer(selectedCustomer._id)}
            style={{fontSize:'1.2rem', opacity: 0.9}}
            title="Delete Customer"
          >
            🗑️
          </button>
        </div>
      </div>

      <div style={{padding:'30px 20px', textAlign:'center', background:'var(--primary)', color:'white', borderRadius:'0 0 24px 24px'}}>
        <p style={{fontSize:'0.9rem', opacity:0.9, marginBottom:'5px'}}>Total Balance</p>
        <h1 style={{fontSize:'3rem', fontWeight:'800'}}>₹ {Math.abs(selectedCustomer.totalBalance)}</h1>
        <span style={{background:'rgba(255,255,255,0.2)', padding:'6px 12px', borderRadius:'20px', fontSize:'0.85rem', fontWeight:'600', marginTop:'10px', display:'inline-block'}}>
            {selectedCustomer.totalBalance >= 0 ? 'You will Receive' : 'You need to Pay'}
        </span>
      </div>
      
      <div className="container" style={{marginTop:'-20px'}}>
        <div style={{background:'var(--surface)', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)'}}>
          <h3 className="section-title">Transactions</h3>
          {history.length === 0 ? <p style={{textAlign:'center', color:'#aaa', padding:'20px'}}>No transactions yet</p> : null}
          {history.map(txn => (
            <div className="history-row" key={txn._id}>
              <div>
                <p style={{fontWeight:'600', marginBottom:'4px'}}>{txn.description || (txn.type === 'GAVE_GOODS' ? 'Goods Sold' : 'Payment Received')}</p>
                <p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{new Date(txn.date).toLocaleDateString()}</p>
              </div>
              <div style={{textAlign:'right', display:'flex', alignItems:'center'}}>
                <span className={`txn-badge ${txn.type === 'GAVE_GOODS' ? 'badge-gave' : 'badge-got'}`}>
                  {txn.type === 'GAVE_GOODS' ? '+' : '-'} ₹{txn.amount}
                </span>
                <button onClick={()=>deleteTransaction(txn._id)} style={{border:'none', background:'none', marginLeft:'15px', color:'#9ca3af', fontSize:'1.2rem'}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Updated to open Transaction Modal, not Customer Modal */}
      <button className="fab" onClick={()=>{
        setTxnAmount(''); setTxnDesc(''); 
        window.history.pushState({ page: 'modal' }, '', '');
        setShowAddModal(true);
      }}>+</button>
      
      {showAddModal && (
        <div className="modal-overlay" onClick={(e)=>e.target.className==='modal-overlay' && window.history.back()}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close" onClick={()=>window.history.back()}>×</button>
            {/* Logic: If we have a selected customer AND we are not editing profile, it's a Transaction Modal */}
            {selectedCustomer && !isEditing ? (
                <>
                <h2 className="modal-title">New Transaction</h2>
                <div style={{display:'flex', gap:'15px', marginBottom:'25px'}}>
                  <button style={{flex:1, padding:'15px', border: txnType==='GAVE_GOODS'?'2px solid var(--danger)':'1px solid #e5e7eb', background: txnType==='GAVE_GOODS'?'#fef2f2':'white', color: txnType==='GAVE_GOODS'?'var(--danger)':'var(--text-muted)', borderRadius:'var(--radius)', fontWeight:'bold'}} onClick={()=>setTxnType('GAVE_GOODS')}>🔴 GAVE</button>
                  <button style={{flex:1, padding:'15px', border: txnType==='GOT_PAYMENT'?'2px solid var(--success)':'1px solid #e5e7eb', background: txnType==='GOT_PAYMENT'?'#d1fae5':'white', color: txnType==='GOT_PAYMENT'?'var(--success)':'var(--text-muted)', borderRadius:'var(--radius)', fontWeight:'bold'}} onClick={()=>setTxnType('GOT_PAYMENT')}>🟢 GOT</button>
                </div>
                <div className="input-group"><label>Amount</label><input type="number" placeholder="₹ 0" className="modal-input" autoFocus value={txnAmount} onChange={(e)=>setTxnAmount(e.target.value)} style={{fontSize:'1.5rem', fontWeight:'bold', color:'var(--primary)'}} /></div>
                <div className="input-group"><label>Note</label><input type="text" placeholder="e.g. Rice, Sugar" className="modal-input" value={txnDesc} onChange={(e)=>setTxnDesc(e.target.value)} /></div>
                <button className="btn-primary" onClick={saveTransaction}>Save Entry</button>
                </>
            ) : (
                <>
                {/* Otherwise it's the Customer Add/Edit Modal */}
                <h2 className="modal-title">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h2>
                <div className="input-group"><label>Full Name *</label><input className="modal-input" value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="e.g. Rajesh Kumar" /></div>
                <div className="input-group"><label>Father's Name</label><input className="modal-input" value={newFather} onChange={(e)=>setNewFather(e.target.value)} placeholder="Optional" /></div>
                <div className="input-group"><label>City/Location</label><input className="modal-input" value={newCity} onChange={(e)=>setNewCity(e.target.value)} placeholder="e.g. Zirakpur" /></div>
                <div className="input-group"><label>Mobile Number</label><input className="modal-input" type="number" value={newMobile} onChange={(e)=>setNewMobile(e.target.value)} placeholder="98........" /></div>
                <button className="btn-primary" onClick={handleSaveCustomer}>{isEditing ? 'Update Details' : 'Save Customer'}</button>
                </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // --- DASHBOARD ---
  return (
    <div>
      <div className="app-header">
        <div className="header-left">
          <span className="app-title">KiranaBook</span>
          <span className="app-subtitle">My Udhaar</span>
        </div>
        <div className="header-icons">
          <button className="icon-btn">🔍</button>
          <div className="profile-pic" onClick={handleLogout}>KB</div>
        </div>
      </div>

      <div className="container">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input type="text" className="search-bar" placeholder="Search customers..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
        </div>

        {activeTab === 'home' ? (
          <div>
             <h3 className="section-title">Recent Customers</h3>
             {customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(renderCustomerCard)}
          </div>
        ) : (
          <div>
            {Object.entries(getCustomersByCity()).map(([city, list]) => (
              <div key={city} style={{marginBottom:'25px'}}>
                <h3 className="section-title" style={{color:'var(--text-muted)'}}>{city}</h3>
                {list.map(renderCustomerCard)}
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={openAddModal}>+</button>

      <div className="nav-bar">
        <button className={`nav-item ${activeTab==='home'?'active':''}`} onClick={()=>setActiveTab('home')}><span className="nav-icon">🏠</span><span>Home</span></button>
        <button className="nav-item" onClick={openAddModal}><span className="nav-icon">➕</span><span>Add Entry</span></button>
        <button className={`nav-item ${activeTab==='cities'?'active':''}`} onClick={()=>setActiveTab('cities')}><span className="nav-icon">👥</span><span>Customers</span></button>
        <button className="nav-item" onClick={()=>alert("Coming Soon!")}><span className="nav-icon">📊</span><span>Reports</span></button>
      </div>

      {/* ADD/EDIT CUSTOMER MODAL (Dashboard Version) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e)=>e.target.className==='modal-overlay' && window.history.back()}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close" onClick={()=>window.history.back()}>×</button>
            <h2 className="modal-title">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h2>
            <div className="input-group"><label>Full Name *</label><input className="modal-input" value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="e.g. Rajesh Kumar" /></div>
            <div className="input-group"><label>Father's Name</label><input className="modal-input" value={newFather} onChange={(e)=>setNewFather(e.target.value)} placeholder="Optional" /></div>
            <div className="input-group"><label>City/Location</label><input className="modal-input" value={newCity} onChange={(e)=>setNewCity(e.target.value)} placeholder="e.g. Zirakpur" /></div>
            <div className="input-group"><label>Mobile Number</label><input className="modal-input" type="number" value={newMobile} onChange={(e)=>setNewMobile(e.target.value)} placeholder="98........" /></div>
            <button className="btn-primary" onClick={handleSaveCustomer}>{isEditing ? 'Update Details' : 'Save Customer'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;