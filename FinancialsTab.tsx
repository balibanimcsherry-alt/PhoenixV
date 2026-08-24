import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from './api';

const COLORS = ['#0d5f6b','#6baeb6','#d9a14e','#d98871','#174b50','#a8d5db','#28704e','#c57418'];
const EXP_CATS = ['cleaning','maintenance','supplies','utilities','platform_fees','insurance','mortgage','taxes','other'];

interface Expense { id:number; date:string; category:string; description:string; amount:number }

function kpi(label:string, value:string|number, sub?:string) {
  return (
    <div className="kpi-card">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export function FinancialsTab({ token }:{ token:string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [fin, setFin] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expForm, setExpForm] = useState({ date:today.toISOString().slice(0,10), category:'cleaning', description:'', amount:'' });
  const [saved, setSaved] = useState('');
  const h = { Authorization:`Bearer ${token}` };

  const loadFin = () => api<any>(`/api/admin/financials?year=${year}`,{headers:h}).then(setFin).catch(()=>{});
  const loadExp = () => api<Expense[]>('/api/admin/expenses',{headers:h}).then(setExpenses).catch(()=>{});
  useEffect(()=>{ loadFin(); },[year,token]);
  useEffect(()=>{ loadExp(); },[token]);

  const addExpense = async () => {
    if(!expForm.description || !expForm.amount) return;
    await api('/api/admin/expenses',{method:'POST',headers:h,body:JSON.stringify({...expForm,amount:parseFloat(String(expForm.amount))})});
    setSaved('Added ✓'); setTimeout(()=>setSaved(''),1500);
    setExpForm({...expForm,description:'',amount:''});
    loadExp(); loadFin();
  };
  const delExp = async (id:number) => { await api(`/api/admin/expenses/${id}`,{method:'DELETE',headers:h}); loadExp(); loadFin(); };

  const years = Array.from({length:5},(_,i)=>today.getFullYear()-i);

  return (
    <div>
      <h1>Financials</h1>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
        {years.map(y=>(
          <button key={y} className={`btn${year===y?'':' light'}`} style={{padding:'7px 16px',fontSize:13}} onClick={()=>setYear(y)}>{y}</button>
        ))}
      </div>

      {fin && <>
        <div className="kpi-grid">
          {kpi('Revenue', `$${fin.revenue.toLocaleString('en-US',{maximumFractionDigits:0})}`, 'direct bookings')}
          {kpi('Expenses', `$${fin.expenses.toLocaleString('en-US',{maximumFractionDigits:0})}`, 'tracked costs')}
          {kpi('Net Profit', `$${fin.net.toLocaleString('en-US',{maximumFractionDigits:0})}`, fin.net>=0?'▲ profitable':'▼ loss')}
          {kpi('Occupancy', `${fin.occupancy}%`, `${fin.total_nights} nights booked`)}
          {kpi('ADR', `$${fin.adr}`, 'avg daily rate')}
          {kpi('RevPAR', `$${fin.revpan}`, 'rev per avail night')}
          {kpi('Bookings', fin.bookings, 'direct confirmed')}
          {kpi('OTA Nights', fin.ota_nights, 'Airbnb + VRBO')}
        </div>

        {/* Monthly revenue vs expenses */}
        <div className="admin-card">
          <h2>Monthly Overview — {year}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={fin.monthly}>
              <XAxis dataKey="month_name" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} tickFormatter={v=>`$${v}`} />
              <Tooltip formatter={(v:any)=>`$${Number(v).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#0d5f6b" name="Revenue" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" fill="#d98871" name="Expenses" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy by month */}
        <div className="admin-card">
          <h2>Nights Booked by Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fin.monthly}>
              <XAxis dataKey="month_name" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip />
              <Bar dataKey="direct_nights" fill="#0d5f6b" name="Direct" radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="ota_nights" fill="#6baeb6" name="OTA (Airbnb/VRBO)" radius={[3,3,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
          {/* Expenses by category */}
          {Object.keys(fin.expenses_by_cat).length > 0 && (
            <div className="admin-card">
              <h2>Expenses by Category</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={Object.entries(fin.expenses_by_cat).map(([name,value])=>({name,value}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,percent})=>`${name} ${((percent??0)*100).toFixed(0)}%`} labelLine={false}>
                    {Object.keys(fin.expenses_by_cat).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>`$${Number(v).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly breakdown table */}
          <div className="admin-card">
            <h2>Monthly Breakdown</h2>
            <table className="admin-table">
              <thead><tr><th>Month</th><th>Revenue</th><th>Nights</th><th>Expenses</th><th>Net</th></tr></thead>
              <tbody>
                {fin.monthly.filter((m:any)=>m.revenue>0||m.ota_nights>0||m.expenses>0).map((m:any)=>(
                  <tr key={m.month}>
                    <td>{m.month_name}</td>
                    <td>${m.revenue.toFixed(0)}</td>
                    <td>{m.direct_nights+m.ota_nights}</td>
                    <td style={{color:m.expenses>0?'#d9534f':undefined}}>${m.expenses.toFixed(0)}</td>
                    <td style={{fontWeight:700,color:(m.revenue-m.expenses)>=0?'#28704e':'#d9534f'}}>${(m.revenue-m.expenses).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* Expense tracker */}
      <div className="admin-card">
        <h2>Add Expense</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <label>Date<input type="date" value={expForm.date} onChange={e=>setExpForm({...expForm,date:e.target.value})} /></label>
          <label>Category
            <select value={expForm.category} onChange={e=>setExpForm({...expForm,category:e.target.value})}>
              {EXP_CATS.map(c=><option key={c} value={c}>{c.replace('_',' ')}</option>)}
            </select>
          </label>
          <label>Description<input value={expForm.description} onChange={e=>setExpForm({...expForm,description:e.target.value})} placeholder="e.g. Pool service" /></label>
          <label>Amount ($)<input type="number" min="0" step="0.01" value={expForm.amount} onChange={e=>setExpForm({...expForm,amount:e.target.value})} placeholder="0.00" /></label>
        </div>
        <div style={{marginTop:12,display:'flex',gap:10}}>
          <button className="btn" onClick={addExpense}>Add Expense</button>
          {saved && <span style={{color:'#28704e',fontWeight:700,lineHeight:'44px'}}>{saved}</span>}
        </div>
      </div>

      <div className="admin-card">
        <h2>All Expenses</h2>
        <table className="admin-table">
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {expenses.length===0 && <tr><td colSpan={5} style={{color:'#aaa',textAlign:'center'}}>No expenses recorded.</td></tr>}
            {expenses.map(e=>(
              <tr key={e.id}>
                <td>{e.date}</td>
                <td><span className="status-badge" style={{background:'#f0f4f3'}}>{e.category.replace('_',' ')}</span></td>
                <td>{e.description}</td>
                <td><strong>${e.amount.toFixed(2)}</strong></td>
                <td><button onClick={()=>delExp(e.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#c9534f',fontSize:16}}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
