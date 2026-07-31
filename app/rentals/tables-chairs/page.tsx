import React from 'react';
import db from '@/lib/db';
import { translations } from '@/lib/translations';
import Link from 'next/link';

// Fetch seating products
async function getSeatingProducts() {
  const { rows } = await db.execute("SELECT * FROM products WHERE category = 'seating' AND active = 1");
  return rows as any[];
}

export default async function TablesChairsPage({ searchParams }: { searchParams: { lang?: string, date?: string } }) {
  const lang = (searchParams.lang === 'es' ? 'es' : 'en') as 'en' | 'es';
  const eventDate = searchParams.date || '';

  const products = await getSeatingProducts();

  const chair = products.find(p => p.slug === 'white-folding-chair');
  const table = products.find(p => p.slug === '6ft-banquet-table');

  const t = (key: string) => translations[key]?.[lang] || translations[key]?.['en'] || key;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-[1240px] mx-auto px-4 h-20 flex items-center justify-between">
          <Link href={`/?lang=${lang}`} className="font-bold text-2xl tracking-tighter text-slate-900" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>EDR PARTY</Link>
          <div className="flex gap-4">
            <Link href={`/?lang=${lang === 'en' ? 'es' : 'en'}`} className="font-bold text-sm bg-yellow-400 border-2 border-slate-900 rounded-lg px-3 py-1.5 shadow-[2px_2px_0px_rgba(15,23,42,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all text-slate-900 flex items-center gap-1">
              {lang === 'en' ? '🌐 Español' : '🌐 English'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-[1240px] mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>{t('tables_and_chairs')}</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            {lang === 'es' 
              ? 'Sillas plegables y mesas de banquete comerciales resistentes y desinfectadas.' 
              : 'Commercial heavy-duty white folding chairs and banquet tables, sanitized and ready.'}
          </p>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Preset Packages */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold mb-6" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
            {lang === 'es' ? 'Paquetes Prearmados' : 'Preset Packages'}
          </h2>
          <div className="flex flex-col gap-4">
            {[
              { t: 1, c: 8, p: 34 },
              { t: 2, c: 16, p: 68 },
              { t: 3, c: 24, p: 102 },
              { t: 4, c: 32, p: 136 },
            ].map((pkg, i) => (
              <div key={i} className="flex justify-between items-center p-4 border rounded-xl hover:border-blue-500 transition-colors cursor-pointer bg-slate-50 hover:bg-white">
                <div>
                  <h3 className="font-bold">{pkg.t} {lang === 'es' ? 'Mesas' : 'Tables'} & {pkg.c} {lang === 'es' ? 'Sillas' : 'Chairs'}</h3>
                  <p className="text-sm text-slate-500">{t('seats_up_to_8').replace('8', pkg.c.toString())}</p>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-lg text-blue-700">$\{(pkg.p).toFixed(2)}</span>
                  <button className="text-sm font-semibold text-blue-600 hover:underline">{t('add_to_party')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Quantity */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold mb-6" style={{fontFamily: 'Bricolage Grotesque, sans-serif'}}>
            {lang === 'es' ? 'Cantidades Personalizadas' : 'Custom Quantity'}
          </h2>
          <div className="flex flex-col gap-6">
            
            {/* Chairs */}
            {chair && (
              <div className="flex items-center gap-4 p-4 border rounded-xl bg-slate-50">
                <img src={chair.image} alt="Chair" className="w-20 h-20 object-cover rounded-lg border bg-white" />
                <div className="flex-1">
                  <h3 className="font-bold">{lang === 'es' ? chair.name_es : chair.name_en}</h3>
                  <p className="text-slate-500 text-sm">${chair.base_price.toFixed(2)} {lang === 'es' ? 'cada una' : 'each'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select className="border rounded-lg px-3 py-2 bg-white font-semibold outline-none focus:border-blue-500">
                    <option value="0">0</option>
                    {[...Array(50)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Tables */}
            {table && (
              <div className="flex items-center gap-4 p-4 border rounded-xl bg-slate-50">
                <img src={table.image} alt="Table" className="w-20 h-20 object-cover rounded-lg border bg-white" />
                <div className="flex-1">
                  <h3 className="font-bold">{lang === 'es' ? table.name_es : table.name_en}</h3>
                  <p className="text-slate-500 text-sm">${table.base_price.toFixed(2)} {lang === 'es' ? 'cada una' : 'each'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select className="border rounded-lg px-3 py-2 bg-white font-semibold outline-none focus:border-blue-500">
                    <option value="0">0</option>
                    {[...Array(20)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-xl transition-colors">
              {lang === 'es' ? 'Agregar Selección' : 'Add Selection to Party'}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
