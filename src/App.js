import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// ⚠️ IMPORTANT: Keep your Render URL
const BACKEND_URL = "https://kirana-backend-4e93.onrender.com"; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'cities'
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- NEW CUSTOMER STATES ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFather, setNewFather] = useState(''); // Father Name
  const [newCity, setNewCity] = useState('');     // City
  const [newMobile, setNewMobile] = useState('');

  // --- TRANSACTION STATES ---
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
    } catch (err) { console.error("Error fetching data"); }
  };

  // --- LOGIN ---
  const handlePin = (num) => { if (pin.length < 4) setPin(pin + num); };
  const submitLogin = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/login`, { pin });
      if (res.data.success) { setIsLoggedIn(true); localStorage.setItem('isLoggedIn','true'); fetchCustomers(); }
    } catch (e) { alert("Wrong PIN"); setPin(''); }
  };

  // --- ADD CUSTOMER (UPDATED) ---
  const handleAddCustomer = async () => {
    if (!newName) return alert("Name is mandatory!");
    await axios.post(`${BACKEND_URL}/api/customers`, {
      name: newName,
      fatherName: newFather,
      city: newCity,
      mobile: newMobile
    });
    setNewName(''); setNewFather(''); setNewCity(''); setNewMobile('');
    setShowAddModal(false);
    fetchCustomers();
  };

  // --- TRANSACTIONS ---
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
    setTxnAmount(''); setTxnDesc(''); 
    fetchCustomers();
    openHistory(selectedCustomer);
  };

  const deleteTransaction = async (id) => {
    if(!window.confirm("Delete this entry?")) return;
    await axios.delete(`${BACKEND_URL}/api/transaction/${id}`);
    fetchCustomers();
    openHistory(selectedCustomer);
  };

  // --- CITY GROUPING LOGIC ---
  const getCustomersByCity = () => {
    const groups = {};
    customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).forEach(c => {
      const cityName = c.city ? c.city.toUpperCase() : "YOUR CITY";
      if (!groups[cityName]) groups[cityName] = [];
      groups[cityName].push(c);
    });
    return groups;
  };

  const renderCustomerCard = (c) => (
    <div className="card" key={c._id} onClick={() => openHistory(c)}>
      <div className="card-left">
        <h3>{c.name}</h3>
        <p>{c.fatherName ? `S/o ${c.fatherName}` : c.mobile || 'No details'} {c.city ? `• ${c.city}` : ''}</p>
      </div>
      <div className={`balance ${c.totalBalance >= 0 ? 'red' : 'green'}`}>
        ₹ {Math.abs(c.totalBalance)}
      </div>
    </div>
  );

  // === SCREENS ===
  if (!isLoggedIn) return (
    <div className="login-container">
      <div className="login-box">
        <h1 style={{color: '#4F46E5', marginBottom: '10px'}}>KiranaBook</h1>
        <p style={{color:'#6B7280'}}>Enter Security PIN</p>
        <div className="pin-dots">{pin.split('').map(()=>'•').join('')}</div>
        <div className="num-pad">
          {[1,2,3,4,5,6,7,8,9].map(n=><button key={n} className="num-btn" onClick={()=>handlePin(n)}>{n}</button>)}
          <button className="num-btn clr-btn" onClick={()=>setPin('')}>CLR</button>
          <button className="num-btn" onClick={()=>handlePin(0)}>0</button>
          <button className="num-btn enter-btn" onClick={submitLogin}>→</button>
        </div>
      </div>
    </div>
  );

  if (selectedCustomer) return (
    <div className="container">
      <div className="app-header">
        <button style={{border:'none',background:'none',fontSize:'1.5rem'}} onClick={() => setSelectedCustomer(null)}>←</button>
        <span className="app-title">{selectedCustomer.name}</span>
        <div style={{width:'30px'}}></div>
      </div>
      <div style={{padding:'20px 0', textAlign:'center'}}>
        <p style={{color:'#6B7280'}}>Current Balance</p>
        <h1 style={{fontSize:'2.5rem', color: selectedCustomer.totalBalance >= 0 ? '#EF4444' : '#10B981'}}>
          ₹ {Math.abs(selectedCustomer.totalBalance)}
        </h1>
      </div>
      <div style={{background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px', minHeight:'50vh', boxShadow:'0 -4px 10px rgba(0,0,0,0.05)'}}>
        <h3 style={{marginBottom:'15px'}}>Transactions</h3>
        {history.map(txn => (
          <div className="history-row" key={txn._id}>
            <div>
              <p style={{fontWeight:'600'}}>{txn.description || 'Entry'}</p>
              <p style={{fontSize:'0.75rem', color:'#9CA3AF'}}>{new Date(txn.date).toLocaleDateString()}</p>
            </div>
            <div style={{textAlign:'right'}}>
              <span className={`txn-badge ${txn.type === 'GAVE_GOODS' ? 'badge-gave' : 'badge-got'}`}>
                {txn.type === 'GAVE_GOODS' ? '+' : '-'} ₹{txn.amount}
              </span>
              <button onClick={()=>deleteTransaction(txn._id)} style={{border:'none', background:'none', marginLeft:'10px', color:'#D1D5DB'}}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-primary" style={{position:'fixed', bottom:'20px', right:'20px', width:'auto', borderRadius:'50px', padding:'15px 30px', boxShadow:'0 10px 25px rgba(79, 70, 229, 0.4)'}} 
        onClick={()=> setShowAddModal(true)}>+ New Entry</button>
      
      {showAddModal && (
        <div className="modal-overlay" onClick={(e)=>e.target.className==='modal-overlay' && setShowAddModal(false)}>
          <div className="modal-content">
            <button className="btn-close" onClick={()=>setShowAddModal(false)}>×</button>
            <h2 className="modal-title">New Transaction</h2>
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
              <button style={{flex:1, padding:'10px', border:'1px solid #EF4444', background: txnType==='GAVE_GOODS'?'#FEF2F2':'white', color:'#EF4444', borderRadius:'8px'}} onClick={()=>setTxnType('GAVE_GOODS')}>🔴 GAVE</button>
              <button style={{flex:1, padding:'10px', border:'1px solid #10B981', background: txnType==='GOT_PAYMENT'?'#ECFDF5':'white', color:'#10B981', borderRadius:'8px'}} onClick={()=>setTxnType('GOT_PAYMENT')}>🟢 GOT</button>
            </div>
            <input type="number" placeholder="Amount (₹)" className="modal-input" autoFocus value={txnAmount} onChange={(e)=>setTxnAmount(e.target.value)} style={{marginBottom:'10px'}} />
            <input type="text" placeholder="Description" className="modal-input" value={txnDesc} onChange={(e)=>setTxnDesc(e.target.value)} />
            <button className="btn-primary" onClick={()=>{saveTransaction(); setShowAddModal(false);}}>Save Record</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container">
      <div className="app-header">
        <span className="app-title">KiranaBook</span>
        <button onClick={()=>setShowAddModal(true)} style={{color:'var(--primary)', fontWeight:'bold', border:'none', background:'none'}}>+ ADD</button>
      </div>
      <input type="text" className="search-bar" placeholder="🔍 Search..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />

      {activeTab === 'dashboard' ? (
        <div>{customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(renderCustomerCard)}</div>
      ) : (
        <div>
          {Object.entries(getCustomersByCity()).map(([city, list]) => (
            <div key={city} className="city-section">
              <div className="city-header">{city} ({list.length})</div>
              {list.map(renderCustomerCard)}
            </div>
          ))}
        </div>
      )}

      <div className="nav-bar">
        <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}>
          <span className="nav-icon">🏠</span> <span>Home</span>
        </button>
        <button className={`nav-item ${activeTab==='cities'?'active':''}`} onClick={()=>setActiveTab('cities')}>
          <span className="nav-icon">🏙️</span> <span>Cities</span>
        </button>
        <button className="nav-item" onClick={()=>{setIsLoggedIn(false); localStorage.removeItem('isLoggedIn')}}>
          <span className="nav-icon">🔒</span> <span>Logout</span>
        </button>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={(e)=>e.target.className==='modal-overlay' && setShowAddModal(false)}>
          <div className="modal-content">
            <button className="btn-close" onClick={()=>setShowAddModal(false)}>×</button>
            <h2 className="modal-title">Add Customer</h2>
            <div className="input-group"><label>Name *</label><input className="modal-input" value={newName} onChange={(e)=>setNewName(e.target.value)} /></div>
            <div className="input-group"><label>Father's Name</label><input className="modal-input" value={newFather} onChange={(e)=>setNewFather(e.target.value)} /></div>
            <div className="input-group"><label>City</label><input className="modal-input" value={newCity} onChange={(e)=>setNewCity(e.target.value)} /></div>
            <div className="input-group"><label>Mobile</label><input className="modal-input" type="number" value={newMobile} onChange={(e)=>setNewMobile(e.target.value)} /></div>
            <button className="btn-primary" onClick={handleAddCustomer}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;