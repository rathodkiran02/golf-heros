import { supabase } from '@/lib/supabase'

export default async function PublicCharities() {
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Our Charity Partners</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {charities?.map(c => (
          <div key={c.id} className="border rounded-lg p-4 shadow">
            <h2 className="text-xl font-bold">{c.name}</h2>
            <p className="text-gray-600 mt-2">{c.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}