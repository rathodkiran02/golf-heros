'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'

export default function CharityManager() {
  const { session } = useAuth()
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true })

  useEffect(() => {
    fetchCharities()
  }, [])

  async function fetchCharities() {
    const res = await fetch('/api/admin/charities', {
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    const data = await res.json()
    if (data.charities) setCharities(data.charities)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const res = await fetch('/api/admin/charities', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}` 
      },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      setIsAdding(false)
      setFormData({ name: '', description: '', is_active: true })
      fetchCharities()
    }
  }

  async function toggleStatus(charity) {
    await fetch('/api/admin/charities', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}` 
      },
      body: JSON.stringify({ id: charity.id, is_active: !charity.is_active })
    })
    fetchCharities()
  }

  if (loading) return <p>Loading charities...</p>

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Charities</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          {isAdding ? 'Cancel' : '+ Add Charity'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 gap-4">
            <input 
              type="text" 
              placeholder="Charity Name" 
              className="p-2 border rounded"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <textarea 
              placeholder="Description" 
              className="p-2 border rounded"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
            <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
              Save Charity
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {charities.map((charity) => (
              <tr key={charity.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{charity.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${charity.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {charity.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3">
                  <button 
                    onClick={() => toggleStatus(charity)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {charity.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}