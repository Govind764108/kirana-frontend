/* App.js */
import React, { useState, useEffect } from 'react';
import './App.css';

// Initial Mock Data
const initialCustomers = [
  { id: 1, name: 'Rahul Sharma', phone: '9876543210', transactions: [
      { id: 101, type: 'given', amount: 500, date: '2023-10-25' },
      { id: 102, type: 'received', amount: 200, date: '2023-10-26' }
  ]},
  { id: 2, name: 'Amit Verma', phone: '9123456789', transactions: [] },
];

function App() {
  const [view, setView] = useState('home'); // 'home' or 'details'
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  // --- BACK BUTTON HANDLING START ---
  useEffect(() => {
    // When the component mounts, we listen for the 'popstate' event (back button)
    const handleBackButton = (event) => {
      if (view === 'details') {
        // If we are in details view, going back means going to home
        setView('home');
        setSelectedCustomer(null);
      } else if (showAddModal) {
          // If modal is open, back button closes it
          setShowAddModal(false);
      }
      // If view is home, the browser will handle the exit normally
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [view, showAddModal]);

  const navigateToDetails = (customer) => {
    // 1. Push a new state to history so the back button has something to go back "from"
    window.history.pushState({ page: 'details' }, '', '');
    // 2. Update React State
    setSelectedCustomer(customer);
    setView('details');
  };

  const navigateHome = () => {
    // Go back in history (this triggers the popstate listener above)
    window.history.back(); 
  };
  // --- BACK BUTTON HANDLING END ---

  // Calculate Net Balance
  const calculateBalance = (transactions) => {
    let balance = 0;
    transactions.forEach(t => {
      if (t.type === 'given') balance += t.amount;
      if (t.type === 'received') balance -= t.amount;
    });
    return balance;
  };

  const handleAddCustomer = () => {
    if (newCustomerName.trim()) {
      const newCust = {
        id: Date.now(),
        name: newCustomerName,
        phone: '',
        transactions: []
      };
      setCustomers([...customers, newCust]);
      setNewCustomerName('');
      setShowAddModal(false);
    }
  };

  const handleTransaction = (type, amount) => {
    if (!amount) return;
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        const newTrans = {
          id: Date.now(),
          type: type,
          amount: parseFloat(amount),
          date: new Date().toISOString().split('T')[0]
        };
        const updatedC = { ...c, transactions: [...c.transactions, newTrans] };
        setSelectedCustomer(updatedC); // Update current view
        return updatedC;
      }
      return c;
    });
    setCustomers(updatedCustomers);
  };

  return (
    <div className="app-container">
      
      {/* --- HOME VIEW --- */}
      {view === 'home' && (
        <>
          <header className="header">
            <h1>My Ledger</h1>
          </header>

          <div className="customer-list">
            {customers.map(cust => {
              const bal = calculateBalance(cust.transactions);
              return (
                <div key={cust.id} className="customer-card" onClick={() => navigateToDetails(cust)}>
                  <div className="avatar">{cust.name.charAt(0)}</div>
                  <div className="info">
                    <div className="name">{cust.name}</div>
                    <div className="date">Tap to view details</div>
                  </div>
                  {/* Color logic for Home Screen Balance */}
                  <div className={`balance ${bal >= 0 ? 'text-red' : 'text-green'}`}>
                    {bal >= 0 ? `₹${bal}` : `₹${Math.abs(bal)} Adv`}
                  </div>
                </div>
              );
            })}
          </div>

          <button className="fab" onClick={() => setShowAddModal(true)}>+</button>

          {/* ADD CUSTOMER MODAL (CENTERED) */}
          {showAddModal && (
            <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">Add New Customer</div>
                <div className="form-group">
                  <input 
                    type="text" 
                    placeholder="Customer Name" 
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button className="btn btn-save" onClick={handleAddCustomer}>Save</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- DETAILS VIEW --- */}
      {view === 'details' && selectedCustomer && (
        <>
          <header className="header">
            <button className="back-btn" onClick={navigateHome}>←</button>
            <h1>{selectedCustomer.name}</h1>
          </header>

          <div className="transaction-list">
            {selectedCustomer.transactions.length === 0 ? (
                <p style={{textAlign:'center', padding:'20px', color:'#888'}}>No transactions yet.</p>
            ) : (
                selectedCustomer.transactions.map(t => (
                <div key={t.id} className="transaction-item">
                    <div>
                        <div className="trans-date">{t.date}</div>
                        <div>{t.type === 'given' ? 'You Gave' : 'You Got'}</div>
                    </div>
                    {/* Color Logic for Transactions: Given = Red, Received = Green */}
                    <div className={`trans-amount ${t.type === 'given' ? 'text-red' : 'text-green'}`}>
                    ₹{t.amount}
                    </div>
                </div>
                ))
            )}
          </div>

          <div className="action-bar">
            <button className="action-btn btn-give" onClick={() => {
              const amt = prompt("Enter amount you GAVE:");
              if(amt) handleTransaction('given', amt);
            }}>
              GAVE <br/> <span style={{fontSize:'12px'}}>(In Red)</span>
            </button>
            <button className="action-btn btn-receive" onClick={() => {
              const amt = prompt("Enter amount you GOT:");
              if(amt) handleTransaction('received', amt);
            }}>
              GOT <br/> <span style={{fontSize:'12px'}}>(In Green)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;