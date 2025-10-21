import React, { useState } from 'react'

const initializeData = () => {
  // Try to get data from localStorage, if it exists
  const savedData = localStorage.getItem('kfcAppData')
  if (savedData) {
    return JSON.parse(savedData)
  }

  // Default initial data if nothing is saved
  const defaultData = {
    menu: [
      { _id: '1', name: 'Original Recipe Chicken', category: 'Chicken', price: 8.99, description: '2 pieces of our famous chicken', image: '🍗', available: true },
      { _id: '2', name: 'Zinger Burger', category: 'Burgers', price: 6.99, description: 'Spicy chicken fillet burger', image: '🍔', available: true },
      { _id: '3', name: 'Bucket Meal', category: 'Meals', price: 24.99, description: '8 pieces chicken + 4 sides', image: '🧆', available: true },
      { _id: '4', name: 'French Fries', category: 'Sides', price: 2.99, description: 'Crispy golden fries', image: '🍟', available: true },
      { _id: '5', name: 'Coleslaw', category: 'Sides', price: 2.49, description: 'Fresh coleslaw salad', image: '🫐', available: true },
      { _id: '6', name: 'Pepsi', category: 'Drinks', price: 1.99, description: 'Regular Pepsi', image: '🥤', available: true },
    ],
    orders: [],
    users: [
      { _id: '1', name: 'Admin User', email: 'admin@kfc.com', role: 'admin', password: 'admin123' },
      { _id: '2', name: 'John Doe', email: 'john@example.com', role: 'customer', password: 'customer123' }
    ]
  }
  
  // Save default data to localStorage
  localStorage.setItem('kfcAppData', JSON.stringify(defaultData))
  return defaultData
}

export default function App(){
  const [db, setDb] = useState(initializeData())
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState('login')
  const [cart, setCart] = useState([])
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [editingItem, setEditingItem] = useState(null)
  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', description: '' })
  const [orderFilter, setOrderFilter] = useState('all')
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [currentOrder, setCurrentOrder] = useState(null)

  // Function to update database and persist to localStorage
  const updateDb = (newData) => {
    setDb(newData)
    localStorage.setItem('kfcAppData', JSON.stringify(newData))
  }

  const handleLogin = (e) => {
    e && e.preventDefault && e.preventDefault()
    console.log('Login attempt:', loginForm.email) // Debug log
    const user = db.users.find(u => u.email === loginForm.email && u.password === loginForm.password)
    if (user){
      console.log('User found:', user.role) // Debug log
      setCurrentUser(user)
      setView(user.role === 'admin' ? 'admin-dashboard' : 'customer-menu')
      setLoginForm({ email: '', password: '' })
      setCart([])
    } else {
      console.log('Login failed: user not found') // Debug log
      alert('Invalid credentials — use demo accounts shown below')
    }
  }

  const handleSignup = (e, form) => {
    e && e.preventDefault && e.preventDefault()
    const { name, email, password, confirm } = form
    if (!name || !email || !password) { alert('Please fill all fields'); return }
    if (password.length < 4) { alert('Password should be at least 4 characters'); return }
    if (password !== confirm) { alert('Passwords do not match'); return }
    const exists = db.users.find(u => u.email === email)
    if (exists) { alert('An account with that email already exists'); return }
    const newUser = { _id: Date.now().toString(), name, email, role: 'customer', password }
    updateDb({ ...db, users: [...db.users, newUser] })
    setCurrentUser(newUser)
    setView('customer-menu')
    setCart([])
  }

  const addToCart = (item) => {
    const existing = cart.find(c => c._id === item._id)
    if (existing) setCart(cart.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c))
    else setCart([...cart, { ...item, quantity: 1 }])
  }

  const updateCartQuantity = (id, delta) => {
    setCart(cart.map(c => {
      if (c._id === id){
        const newQty = c.quantity + delta
        return newQty > 0 ? { ...c, quantity: newQty } : null
      }
      return c
    }).filter(Boolean))
  }

  const removeFromCart = (id) => setCart(cart.filter(c => c._id !== id))

  const getTotalPrice = () => cart.reduce((s,i) => s + i.price * i.quantity, 0).toFixed(2)

  const placeOrder = () => {
    if (cart.length === 0){ alert('Cart is empty'); return }
    if (!currentUser){ alert('Please log in'); setView('login'); return }
    const order = {
      _id: Date.now().toString(),
      userId: currentUser._id,
      userName: currentUser.name,
      items: cart.map(c => ({ ...c })),
      total: parseFloat(getTotalPrice()),
      status: 'pending',
      timestamp: new Date().toISOString(),
      orderNumber: `KFC${Date.now().toString().slice(-6)}`
    }
    updateDb({ ...db, orders: [...db.orders, order] })
    setCurrentOrder(order)
    setCart([])
    setView('receipt')
  }

  const addMenuItem = () => {
    if (!newItem.name || !newItem.price){ alert('Name and price are required'); return }
    const item = { _id: Date.now().toString(), ...newItem, price: parseFloat(newItem.price), available: true, image: '🍽️' }
    updateDb({ ...db, menu: [...db.menu, item] })
    setNewItem({ name: '', category: '', price: '', description: '' })
  }

  const updateMenuItem = (id, updates) => {
    updateDb({ ...db, menu: db.menu.map(i => i._id === id ? { ...i, ...updates } : i) })
    setEditingItem(null)
  }

  const deleteMenuItem = (id) => {
    if (confirm('Delete this item?')) updateDb({ ...db, menu: db.menu.filter(i => i._id !== id) })
  }

  const getStats = () => {
    const totalRevenue = db.orders.reduce((s,o) => s + o.total, 0)
    const totalOrders = db.orders.length
    const pendingOrders = db.orders.filter(o => o.status === 'pending').length
    return { totalRevenue, totalOrders, pendingOrders }
  }

  // Simple routing by view
  if (view === 'login') return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-red-600 mb-2">KFC UGANDA </h1>
        <p className="text-sm text-gray-600 mb-4">Ordering System</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input type="email" required value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})}
              className="w-full px-4 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Password</label>
            <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full px-4 py-2 border rounded" />
          </div>
          <button className="w-full bg-red-600 text-white py-2 rounded">Login</button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => setView('signup')} className="text-red-600 hover:underline">
            Don't have an account? Register here
          </button>
        </div>
        <div className="mt-4 text-sm bg-gray-100 p-3 rounded">
          <p className="font-semibold">Demo Accounts:</p>
          <p>Admin: admin@kfc.com / admin123</p>
          <p>Customer: enos@customer.com / 14322</p>
        </div>
      </div>
    </div>
  )

  if (view === 'signup') return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-red-600 mb-2">Create Account</h1>
        <p className="text-sm text-gray-600 mb-4">Register for a new KFC account</p>
        <form onSubmit={(e) => handleSignup(e, signupForm)} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700">Full Name</label>
            <input 
              type="text" 
              required 
              value={signupForm.name} 
              onChange={e => setSignupForm({...signupForm, name: e.target.value})}
              className="w-full px-4 py-2 border rounded" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input 
              type="email" 
              required 
              value={signupForm.email} 
              onChange={e => setSignupForm({...signupForm, email: e.target.value})}
              className="w-full px-4 py-2 border rounded" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Password</label>
            <input 
              type="password" 
              required 
              value={signupForm.password} 
              onChange={e => setSignupForm({...signupForm, password: e.target.value})}
              className="w-full px-4 py-2 border rounded" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Confirm Password</label>
            <input 
              type="password" 
              required 
              value={signupForm.confirm} 
              onChange={e => setSignupForm({...signupForm, confirm: e.target.value})}
              className="w-full px-4 py-2 border rounded" 
            />
          </div>
          <button type="submit" className="w-full bg-red-600 text-white py-2 rounded">
            Register
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => setView('login')} className="text-red-600 hover:underline">
            Already have an account? Login here
          </button>
        </div>
      </div>
    </div>
  )

  if (view === 'customer-menu'){
    const categories = [...new Set(db.menu.map(m => m.category))]
    const filteredMenu = db.menu.filter(m => m.available)
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-red-600 text-white p-4 sticky top-0">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h2 className="text-xl font-bold">KFC Menu</h2>
            <div className="flex items-center gap-3">
              <span>Welcome, {currentUser.name}</span>
              <button onClick={() => setView('customer-cart')} className="bg-white text-red-600 px-3 py-1 rounded">Cart ({cart.reduce((s,i)=>s+i.quantity,0)})</button>
              <button onClick={() => setView('customer-orders')} className="bg-white text-red-600 px-3 py-1 rounded">My Orders</button>
              <button onClick={() => { setCurrentUser(null); setView('login'); }} className="text-white">Logout</button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          {categories.map(cat => (
            <section key={cat} className="mb-8">
              <h3 className="text-2xl font-bold mb-4">{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMenu.filter(m => m.category === cat).map(item => (
                  <div key={item._id} className="bg-white p-4 rounded shadow">
                    <div className="emoji text-center mb-2">{item.image}</div>
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <strong className="text-red-600">${item.price}</strong>
                      <button onClick={() => addToCart(item)} className="bg-red-600 text-white px-3 py-1 rounded">Add</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    )
  }

  if (view === 'customer-cart'){
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-red-600 text-white p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h2 className="text-xl font-bold">Shopping Cart</h2>
            <div>
              <button onClick={() => setView('customer-menu')} className="bg-white text-red-600 px-3 py-1 rounded mr-2">Back</button>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-gray-600">Your cart is empty</div>
          ) : (
            <>
              <div className="space-y-3">
                {cart.map(it => (
                  <div key={it._id} className="bg-white p-4 rounded shadow flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="emoji">{it.image}</div>
                      <div>
                        <div className="font-bold">{it.name}</div>
                        <div className="text-sm text-gray-600">${it.price} each</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateCartQuantity(it._id, -1)} className="px-2">-</button>
                      <div className="px-2">{it.quantity}</div>
                      <button onClick={() => updateCartQuantity(it._id, 1)} className="px-2">+</button>
                      <div className="font-bold">${(it.price*it.quantity).toFixed(2)}</div>
                      <button onClick={() => removeFromCart(it._id)} className="text-red-600">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-white p-4 rounded shadow">
                <div className="flex justify-between items-center font-bold text-lg">Total: <span className="text-red-600">${getTotalPrice()}</span></div>
                <div className="mt-4">
                  <button onClick={placeOrder} className="w-full bg-red-600 text-white py-2 rounded">Place Order</button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    )
  }

  if (view === 'customer-orders'){
    const userOrders = db.orders.filter(o => o.userId === currentUser._id).sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp))
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-red-600 text-white p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h2 className="text-xl font-bold">My Orders</h2>
            <button onClick={() => setView('customer-menu')} className="bg-white text-red-600 px-3 py-1 rounded">Back</button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto p-6">
          {userOrders.length === 0 ? <div className="text-center py-20 text-gray-600">No orders yet</div> : (
            <div className="space-y-4">
              {userOrders.map(o => (
                <div key={o._id} className="bg-white p-4 rounded shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">Order #{o.orderNumber}</div>
                      <div className="text-sm text-gray-600">{new Date(o.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-gray-100">{o.status}</div>
                  </div>
                  <div className="mt-3 border-t pt-3">
                    {o.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <div>{it.quantity}x {it.name}</div>
                        <div className="font-semibold">${(it.price*it.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                    <div className="mt-3 flex justify-between font-bold">Total: <span className="text-red-600">${o.total.toFixed(2)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  if (view === 'admin-dashboard'){
    const stats = getStats()
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-red-600 text-white p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
            <div className="flex gap-2">
              <button onClick={() => setView('admin-menu')} className="bg-white text-red-600 px-3 py-1 rounded">Manage Menu</button>
              <button onClick={() => setView('admin-orders')} className="bg-white text-red-600 px-3 py-1 rounded">Manage Orders</button>
              <button onClick={() => { setCurrentUser(null); setView('login'); }} className="text-white">Logout</button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-600">Total Orders</div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-600">Pending Orders</div>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setView('admin-menu')} className="p-4 bg-red-50 rounded">Menu Management</button>
            <button onClick={() => setView('admin-orders')} className="p-4 bg-blue-50 rounded">Order Management</button>
          </div>
        </main>
      </div>
    )
  }

  if (view === 'admin-menu'){
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-red-600 text-white p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h2 className="text-xl font-bold">Menu Management</h2>
            <button onClick={() => setView('admin-dashboard')} className="bg-white text-red-600 px-3 py-1 rounded">Back</button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          <div className="bg-white p-4 rounded shadow mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input placeholder="Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Category" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Price" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Description" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} className="p-2 border rounded" />
            </div>
            <div className="mt-2">
              <button onClick={addMenuItem} className="bg-red-600 text-white px-3 py-1 rounded">Add Item</button>
            </div>
          </div>
          <div className="space-y-3">
            {db.menu.map(item => (
              <div key={item._id} className="bg-white p-3 rounded shadow flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="emoji">{item.image}</div>
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-sm text-gray-600">{item.category} - {item.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-bold">${item.price}</div>
                  <button onClick={() => updateMenuItem(item._id, { available: !item.available })} className={`px-3 py-1 rounded ${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.available ? 'Available' : 'Unavailable'}</button>
                  <button onClick={() => setEditingItem(item._id)} className="px-2">Edit</button>
                  <button onClick={() => deleteMenuItem(item._id)} className="text-red-600 px-2">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (view === 'admin-orders'){
    const filteredOrders = orderFilter === 'all' ? db.orders : db.orders.filter(o => o.status === orderFilter)
    const sortedOrders = [...filteredOrders].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp))
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-red-600 text-white p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h2 className="text-xl font-bold">Order Management</h2>
            <div>
              <button onClick={() => setView('admin-dashboard')} className="bg-white text-red-600 px-3 py-1 rounded">Back</button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          <div className="mb-4 flex items-center gap-2">
            <label className="text-sm">Filter:</label>
            <select value={orderFilter} onChange={e=>setOrderFilter(e.target.value)} className="p-2 border rounded">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
            </select>
          </div>
          <div className="space-y-3">
            {sortedOrders.map(o => (
              <div key={o._id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">Order #{o.orderNumber}</div>
                    <div className="text-sm text-gray-600">{new Date(o.timestamp).toLocaleString()} - {o.userName}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={o.status} onChange={e=>{
                      const newStatus = e.target.value; updateDb({...db, orders: db.orders.map(ord => ord._id===o._id ? {...ord, status: newStatus} : ord)});
                    }} className="p-2 border rounded">
                      <option value="pending">pending</option>
                      <option value="preparing">preparing</option>
                      <option value="ready">ready</option>
                    </select>
                    <div className="font-bold">${o.total.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-3 border-t pt-3">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <div>{it.quantity}x {it.name}</div>
                      <div className="font-semibold">${(it.price*it.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (view === 'receipt' && currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-red-600">KFC UGANDA</h1>
            <p className="text-sm text-gray-600 mt-1">Thank you for your order!</p>
          </div>

          <div className="border-t border-b border-gray-200 py-4 my-4">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Order Number:</span>
              <span>{currentOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Date:</span>
              <span>{new Date(currentOrder.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Customer:</span>
              <span>{currentOrder.userName}</span>
            </div>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {currentOrder.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2">{item.name}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">${item.price.toFixed(2)}</td>
                  <td className="text-right py-2">${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>${currentOrder.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Your order will be ready for pickup shortly.</p>
            <p>Order status: {currentOrder.status}</p>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <button 
              onClick={() => window.print()} 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Print Receipt
            </button>
            <button 
              onClick={() => setView('customer-orders')} 
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
