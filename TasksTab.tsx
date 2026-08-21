import { useEffect, useState } from 'react';
import { api } from './api';

const CATS = ['cleaning','maintenance','inspection','supplies','other'];
const PRIS = ['low','normal','high','urgent'];
const STATS = ['pending','in_progress','done'];
const PRI_COLOR:Record<string,string> = { low:'#aaa', normal:'#0d5f6b', high:'#d9a14e', urgent:'#d9534f' };
const CAT_ICON:Record<string,string> = { cleaning:'🧹', maintenance:'🔧', inspection:'🔍', supplies:'📦', other:'📋' };

interface Task { id:number; title:string; category:string; status:string; priority:string; assigned_to:string; notes:string; due_date:string; created_at:string; completed_at:string|null }
const blank = ():Task => ({id:0,title:'',category:'cleaning',status:'pending',priority:'normal',assigned_to:'',notes:'',due_date:'',created_at:'',completed_at:null});

export function TasksTab({ token }:{ token:string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState(blank());
  const [editing, setEditing] = useState<number|null>(null);
  const [filter, setFilter] = useState('all');
  const [saved, setSaved] = useState('');
  const h = { Authorization:`Bearer ${token}` };

  const load = () => api<Task[]>('/api/admin/tasks',{headers:h}).then(setTasks).catch(()=>{});
  useEffect(()=>{ load(); },[token]);

  const save = async () => {
    if(!form.title.trim()) return;
    if(editing) await api(`/api/admin/tasks/${editing}`,{method:'PUT',headers:h,body:JSON.stringify(form)});
    else await api('/api/admin/tasks',{method:'POST',headers:h,body:JSON.stringify(form)});
    setSaved('Saved ✓'); setTimeout(()=>setSaved(''),1500);
    setForm(blank()); setEditing(null); load();
  };
  const del = async (id:number) => { await api(`/api/admin/tasks/${id}`,{method:'DELETE',headers:h}); load(); };
  const toggle = async (t:Task) => {
    const next = t.status==='done' ? 'pending' : t.status==='pending' ? 'in_progress' : 'done';
    await api(`/api/admin/tasks/${t.id}`,{method:'PUT',headers:h,body:JSON.stringify({...t,status:next})});
    load();
  };
  const edit = (t:Task) => { setForm({...t}); setEditing(t.id); };

  const filtered = filter==='all' ? tasks : tasks.filter(t=>t.status===filter);
  const counts = { pending:tasks.filter(t=>t.status==='pending').length, in_progress:tasks.filter(t=>t.status==='in_progress').length, done:tasks.filter(t=>t.status==='done').length };

  return (
    <div>
      <h1>Tasks</h1>
      <p className="sub">Manage cleaning, maintenance, and inspection tasks.</p>

      <div className="kpi-grid">
        {[['Pending',counts.pending,'#fde7e5'],['In Progress',counts.in_progress,'#fff4e0'],['Done',counts.done,'#e5f5ed']].map(([l,v,bg])=>(
          <div key={String(l)} className="kpi-card" style={{borderTop:`3px solid ${bg}`}}>
            <div className="kpi-value">{v}</div><div className="kpi-label">{l}</div>
          </div>
        ))}
        <div className="kpi-card"><div className="kpi-value">{tasks.length}</div><div className="kpi-label">Total</div></div>
      </div>

      {/* Add / edit form */}
      <div className="admin-card">
        <h2>{editing ? 'Edit Task' : 'Add Task'}</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Clean after checkout" /></label>
          <label>Category
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              {CATS.map(c=><option key={c} value={c}>{CAT_ICON[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </label>
          <label>Priority
            <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
              {PRIS.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </label>
          <label>Status
            <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              {STATS.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </label>
          <label>Assigned to<input value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})} placeholder="Name or role" /></label>
          <label>Due date<input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} /></label>
          <label style={{gridColumn:'span 2'}}>Notes<textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></label>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14}}>
          <button className="btn" onClick={save}>{editing?'Update':'Add Task'}</button>
          {editing && <button className="btn light" onClick={()=>{setForm(blank());setEditing(null);}}>Cancel</button>}
          {saved && <span style={{color:'#28704e',fontWeight:700,lineHeight:'44px'}}>{saved}</span>}
        </div>
      </div>

      {/* Filter */}
      <div style={{display:'flex',gap:8,margin:'8px 0 16px'}}>
        {['all','pending','in_progress','done'].map(s=>(
          <button key={s} className={`btn${filter===s?'':' light'}`} style={{padding:'7px 16px',fontSize:13}} onClick={()=>setFilter(s)}>
            {s==='all'?'All':s.replace('_',' ')} {s!=='all' && `(${counts[s as keyof typeof counts]??tasks.length})`}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtered.length===0 && <p style={{color:'#aaa'}}>No tasks yet.</p>}
        {filtered.map(t=>(
          <div key={t.id} style={{background:'white',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:14,boxShadow:'0 2px 8px rgba(0,0,0,.06)',borderLeft:`4px solid ${PRI_COLOR[t.priority]||'#aaa'}`,opacity:t.status==='done'?.65:1}}>
            <button onClick={()=>toggle(t)} title="Cycle status" style={{fontSize:20,background:'none',border:'none',cursor:'pointer',flexShrink:0}}>
              {t.status==='done'?'✅':t.status==='in_progress'?'🔄':'⬜'}
            </button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:15,textDecoration:t.status==='done'?'line-through':'none'}}>{CAT_ICON[t.category]} {t.title}</div>
              <div style={{fontSize:12,color:'#888',marginTop:2,display:'flex',gap:12,flexWrap:'wrap'}}>
                <span>{t.category}</span>
                {t.assigned_to && <span>👤 {t.assigned_to}</span>}
                {t.due_date && <span>📅 {t.due_date}</span>}
                {t.notes && <span style={{maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>📝 {t.notes}</span>}
                {t.completed_at && <span>✓ {t.completed_at.slice(0,10)}</span>}
              </div>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:PRI_COLOR[t.priority],flexShrink:0}}>{t.priority.toUpperCase()}</span>
            <button onClick={()=>edit(t)} style={{background:'none',border:'1px solid #ddd',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:12}}>Edit</button>
            <button onClick={()=>del(t.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#c9534f',fontSize:16}}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
