import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// ⚠️ IMPORTANT: Replace this with your actual Render Backend URL if it changed
const BACKEND_URL = "https://kirana-backend-4e93.onrender.com"; 

function App() {
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState('');

  // --- APP STATE ---
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); 
  const [txnType, setTxnType] = useState('GAVE_GOODS');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerMobile, setNewCustomerMobile] = useState('');
  const [viewHistory, setViewHistory] = useState(null); 
  const [historyList, setHistoryList] = useState([]); 

  // --- CHECK LOGIN ---
  useEffect(() => {
    const savedLogin = localStorage.getItem('isLoggedIn');
    if (savedLogin === 'true') {
        setIsLoggedIn(true);
        fetchCustomers();
    }
  }, []);

  const fetchCustomers = async () => {
    try {
        const res = await axios.get(`${BACKEND_URL}/api/customers`);
        setCustomers(res.data);
    } catch (err) { console.error(err); }
  };

  // --- LOGIN LOGIC ---
  const handlePinClick = (num) => { if (pin.length < 4) setPin(pin + num); };
  const handleClear = () => setPin('');
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/login`, { pin });
      if (res.data.success) {
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
        fetchCustomers();
      }
    } catch (error) { alert("Wrong PIN!"); setPin(''); }
  };
  const handleLogout = () => { setIsLoggedIn(false); localStorage.removeItem('isLoggedIn'); setPin(''); };

  // --- ACTIONS ---
  const handleViewHistory = async (customer) => {
    try {
      setViewHistory(customer);
      const res = await axios.get(`${BACKEND_URL}/api/transactions/${customer._id}`);
      setHistoryList(res.data);
    } catch (error) { console.error("Error"); }
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName) return;
    await axios.post(`${BACKEND_URL}/api/customers`, { name: newCustomerName, mobile: newCustomerMobile });
    setNewCustomerName(''); setNewCustomerMobile(''); fetchCustomers();
  };

  const handleSaveTransaction = async () => {
    if (!amount) return;
    await axios.post(`${BACKEND_URL}/api/transaction`, {
      customerId: selectedCustomer._id, type: txnType, amount: Number(amount), description
    });
    setSelectedCustomer(null); setAmount(''); setDescription(''); 
    fetchCustomers();
    if (viewHistory && viewHistory._id === selectedCustomer._id) handleViewHistory(selectedCustomer);
  };

  // 🗑️ NEW: DELETE TRANSACTION
  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    
    try {
        await axios.delete(`${BACKEND_URL}/api/transaction/${txnId}`);
        // Refresh History & Balance
        handleViewHistory(viewHistory);
        fetchCustomers();
    } catch (error) {
        alert("Error deleting transaction");
    }
  };

  const sendWhatsapp = () => {
    if (!viewHistory) return;
    const url = `https://wa.me/91${viewHistory.mobile}?text=${encodeURIComponent(`Namaste ${viewHistory.name} 🙏\nYour pending balance is ₹ ${viewHistory.totalBalance}.`)}`;
    window.open(url, '_blank');
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // === LOCK SCREEN ===
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div style={{fontSize: '40px', marginBottom: '10px'}}>🔐</div>
          <h2>KiranaBook</h2>
          <p style={{color: '#888', fontSize: '12px'}}>Enter 4-Digit Owner PIN</p>
          <div className="pin-display">{pin.split('').map(()=>'•').join('')}</div>
          <div className="num-pad">
            {[1,2,3,4,5,6,7,8,9].map(num => <button key={num} className="num-btn" onClick={()=>handlePinClick(num)}>{num}</button>)}
            <button className="num-btn clear" onClick={handleClear}>CLR</button>
            <button className="num-btn" onClick={()=>handlePinClick(0)}>0</button>
            <button className="num-btn enter" onClick={handleLogin}>→</button>
          </div>
        </div>
      </div>
    );
  }

  // === DASHBOARD ===
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">KB</div>
        <nav className="side-nav">
          <a href="#" className={`nav-link ${!viewHistory ? 'active' : ''}`} onClick={() => setViewHistory(null)}>Dashboard</a>
          <div style={{marginTop:'auto', padding:'20px'}}>
             <button onClick={handleLogout} style={{background:'rgba(255,255,255,0.1)', border:'none', color:'white', padding:'10px', width:'100%', borderRadius:'6px', cursor:'pointer'}}>🔒 Logout</button>
          </div>
        </nav>
      </aside>

      <main className="main-content">
        {viewHistory ? (
          <div>
            <div className="history-header">
              <button className="back-btn" onClick={() => setViewHistory(null)}>← Back</button>
              <div>
                <h1 style={{fontSize: '24px'}}>{viewHistory.name}</h1>
                <p style={{color: '#666'}}>Total Balance: <strong style={{color: viewHistory.totalBalance >= 0 ? '#DC2626' : '#059669'}}>₹ {viewHistory.totalBalance}</strong></p>
              </div>
              <div style={{marginLeft: 'auto', display: 'flex', gap: '10px'}}>
                <button className="btn-primary" style={{backgroundColor: '#25D366'}} onClick={sendWhatsapp}>💬 Remind</button>
                <button className="btn-primary" onClick={() => setSelectedCustomer(viewHistory)}>+ New Entry</button>
              </div>
            </div>
            <div className="history-card">
              {historyList.length === 0 ? (<div style={{padding: '30px', textAlign: 'center', color: '#888'}}>No transactions yet.</div>) : (
                historyList.map(txn => (
                  <div className="history-row" key={txn._id}>
                    <div><span className="date-text">{new Date(txn.date).toLocaleDateString()}</span></div>
                    <div className="desc-text">{txn.description || (txn.type === 'GAVE_GOODS' ? 'Goods Sold' : 'Payment Received')}</div>
                    <div style={{textAlign: 'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'15px'}}>
                        <span style={{fontWeight: 'bold', color: txn.type === 'GAVE_GOODS' ? '#DC2626' : '#059669'}}>
                            {txn.type === 'GAVE_GOODS' ? '🔴' : '🟢'} ₹ {txn.amount}
                        </span>
                        {/* 🗑️ DELETE BUTTON */}
                        <button onClick={() => handleDeleteTransaction(txn._id)} style={{border:'none', background:'none', cursor:'pointer', color:'#ccc', fontSize:'16px'}}>
                            🗑️
                        </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div>
            <header className="header"><div className="title"><h1>KiranaBook</h1></div></header>
            <div style={{marginBottom: '20px'}}><input type="text" placeholder="🔍 Search Name..." className="input-field" style={{width: '100%', padding: '15px'}} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <div className="form-group" style={{background: '#e0f2fe', padding: '15px', borderRadius: '8px'}}>
              <input type="text" placeholder="Name" className="input-field" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
              <input type="text" placeholder="Mobile" className="input-field" value={newCustomerMobile} onChange={(e) => setNewCustomerMobile(e.target.value)} />
              <button onClick={handleAddCustomer} className="btn-primary">Add</button>
            </div>
            <div className="transaction-table">
              <div className="table-header"><div>NAME</div><div>BALANCE</div><div>ACTION</div></div>
              {filteredCustomers.map((cust) => (
                <div className="table-row" key={cust._id}>
                  <div><strong>{cust.name}</strong><br/><span style={{fontSize:'12px', color:'#888'}}>{cust.mobile}</span></div>
                  <div style={{fontWeight: 'bold', color: cust.totalBalance >= 0 ? '#DC2626' : '#059669'}}>₹ {cust.totalBalance}</div>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <button className="btn-small" onClick={() => setSelectedCustomer(cust)}>Add</button>
                    <button className="btn-small" style={{background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe'}} onClick={() => handleViewHistory(cust)}>View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      {/* MODAL */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h3>Update: {selectedCustomer.name}</h3><button className="close-btn" onClick={() => setSelectedCustomer(null)}>×</button></div>
            <div className="toggle-group">
              <button className={`toggle-btn ${txnType === 'GAVE_GOODS' ? 'red' : 'inactive'}`} onClick={() => setTxnType('GAVE_GOODS')}>🔴 GAVE</button>
              <button className={`toggle-btn ${txnType === 'GOT_PAYMENT' ? 'green' : 'inactive'}`} onClick={() => setTxnType('GOT_PAYMENT')}>🟢 GOT</button>
            </div>
            <input type="number" placeholder="Amount" className="input-field full-width" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            <input type="text" placeholder="Note (e.g. Rice)" className="input-field full-width" value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="save-btn" onClick={handleSaveTransaction}>SAVE ENTRY</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;