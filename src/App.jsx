import React, { useEffect, useMemo, useState } from 'react';
import { CAMPING_TYPES, CATEGORIES, IMPORTANCE } from './data.js';
import { checklistProgress, formatTripDuration, generateChecklist } from './recommend.js';
import { downloadCheckedPdf, downloadCheckedXlsx, getCheckedExportRows } from './export.js';
import './export.css';

const STORAGE_KEY = 'camping-checklist-v01';
const freshSetup = { type: 'auto', nights: 2, people: 2, categories: CATEGORIES.map(c => c.id), includeOptional: false };
const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } };
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

function Counter({ label, value, minus, plus, display }) {
  return <div className="counter-wrap"><span className="counter-label">{label}</span><div className="counter">
    <button type="button" aria-label={`${label} 줄이기`} onClick={minus}>−</button><strong>{display}</strong><button type="button" aria-label={`${label} 늘리기`} onClick={plus}>＋</button>
  </div></div>;
}

function Modal({ title, children, onClose }) {
  useEffect(() => { const key = e => e.key === 'Escape' && onClose(); addEventListener('keydown', key); return () => removeEventListener('keydown', key); }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-label={title}>
    <div className="modal-head"><h2>{title}</h2><button className="icon-btn" aria-label="닫기" onClick={onClose}>×</button></div>{children}
  </section></div>;
}

export default function App() {
  const initial = useMemo(load, []);
  const [screen, setScreen] = useState(initial.current ? 'checklist' : 'home');
  const [setup, setSetup] = useState(initial.setup || freshSetup);
  const [items, setItems] = useState(initial.current?.items || []);
  const [tripName, setTripName] = useState(initial.current?.name || '나의 캠핑 준비');
  const [history, setHistory] = useState(initial.history || []);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(null);
  const progress = checklistProgress(items);
  const typeInfo = CAMPING_TYPES.find(t => t.id === setup.type);
  const checkedRows = useMemo(() => getCheckedExportRows(items, CATEGORIES, IMPORTANCE), [items]);

  const persist = (nextItems = items, nextHistory = history, name = tripName) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ setup, current: { name, items: nextItems, savedAt: new Date().toISOString() }, history: nextHistory }));
  };
  const toggleCategory = id => setSetup(s => ({ ...s, categories: s.categories.includes(id) ? s.categories.filter(x => x !== id) : [...s.categories, id] }));
  const createChecklist = () => { const generated = generateChecklist(setup); setItems(generated); setTripName(`${typeInfo.name} 준비`); setCategoryFilter('all'); setScreen('checklist'); };
  const saveChecklist = () => {
    const entry = { id: uid(), name: tripName, type: setup.type, nights: setup.nights, people: setup.people, done: progress.done, total: progress.total, savedAt: new Date().toISOString(), items };
    const next = [entry, ...history].slice(0, 5); setHistory(next); persist(items, next); alert('이 기기에 체크리스트를 저장했어요.');
  };
  const startNew = () => { setScreen('home'); setItems([]); setEditing(null); };
  const openHistory = entry => { setSetup(s => ({ ...s, type: entry.type, nights: entry.nights, people: entry.people })); setTripName(entry.name); setItems(entry.items); setScreen('checklist'); };
  const updateItem = updated => { const next = items.map(i => i.id === updated.id ? updated : i); setItems(next); persist(next); setEditing(null); };
  const deleteItem = id => { const next = items.filter(i => i.id !== id); setItems(next); persist(next); setEditing(null); };
  const addItem = item => { const next = [...items, { ...item, id: `custom-${uid()}`, checked: true, memo: item.memo || '', custom: true }]; setItems(next); persist(next); setAdding(false); };
  const toggleItem = id => { const next = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i); setItems(next); persist(next); };
  const exportChecked = async format => {
    if (!checkedRows.length || exporting) return;
    const context = { tripName, typeName: typeInfo.name, duration: formatTripDuration(setup.nights), people: setup.people, rows: checkedRows };
    setExporting(format);
    try {
      if (format === 'pdf') await downloadCheckedPdf(context);
      else downloadCheckedXlsx(context);
    } catch (error) {
      console.error(error);
      alert('파일을 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setExporting(null);
    }
  };
  const filtered = categoryFilter === 'all' ? items : items.filter(i => i.category === categoryFilter);

  if (screen === 'home') return <main className="app-shell home">
    <header className="brand"><div className="brand-mark">▲</div><div><span>CAMPING</span><strong>CHECKLIST</strong></div><button className="history-btn" aria-label="최근 체크리스트로 이동" onClick={() => document.getElementById('recent')?.scrollIntoView({ behavior: 'smooth' })}>최근</button></header>
    <section className="hero"><p className="eyebrow">PACK LESS, MISS NOTHING</p><h1>이번에는 어떤<br/><em>캠핑</em>인가요?</h1><p>유형과 일정만 알려주세요.<br/>꼭 필요한 준비물을 챙겨드릴게요.</p></section>
    <section className="type-grid" aria-label="캠핑 유형">
      {CAMPING_TYPES.map(type => <button data-testid="camp-type" key={type.id} className={`type-card ${setup.type === type.id ? 'selected' : ''}`} onClick={() => setSetup(s => ({...s,type:type.id}))}>
        <span className="type-icon">{type.icon}</span><span><strong>{type.name}</strong><small>{type.description}</small></span><b>{setup.type === type.id ? '✓' : '›'}</b>
      </button>)}
    </section>
    <section className="trip-panel"><Counter label="숙박" value={setup.nights} display={formatTripDuration(setup.nights)} minus={() => setSetup(s=>({...s,nights:Math.max(0,s.nights-1)}))} plus={() => setSetup(s=>({...s,nights:Math.min(14,s.nights+1)}))}/>
      <Counter label="인원" value={setup.people} display={`${setup.people}명`} minus={() => setSetup(s=>({...s,people:Math.max(1,s.people-1)}))} plus={() => setSetup(s=>({...s,people:Math.min(20,s.people+1)}))}/>
      <button className="primary" onClick={() => setScreen('categories')}>다음 · 카테고리 선택 <span>→</span></button>
    </section>
    <section className="recent" id="recent"><div className="section-head"><div><p className="eyebrow">SAVED LOCALLY</p><h2>최근 체크리스트</h2></div></div>
      {history.length ? history.map(entry => <button className="recent-card" key={entry.id} onClick={() => openHistory(entry)}><span className="mini-icon">{CAMPING_TYPES.find(t=>t.id===entry.type)?.icon}</span><span><strong>{entry.name}</strong><small>{formatTripDuration(entry.nights)} · {entry.people}명 · {new Date(entry.savedAt).toLocaleDateString('ko-KR')}</small></span><b>{entry.done}/{entry.total}<small>선택</small></b></button>) : <div className="empty"><span>🏕️</span><p>아직 저장한 체크리스트가 없어요.</p></div>}
    </section>
  </main>;

  if (screen === 'categories') return <main className="app-shell setup-screen">
    <header className="topbar"><button className="icon-btn" aria-label="이전" onClick={()=>setScreen('home')}>←</button><div><small>STEP 2 OF 3</small><strong>카테고리 선택</strong></div><span className="step-count">{setup.categories.length}/10</span></header>
    <section className="setup-copy"><p className="eyebrow">WHAT DO YOU NEED?</p><h1>무엇을<br/>챙겨볼까요?</h1><p>필요 없는 카테고리는 꺼두세요.<br/>목록은 나중에도 자유롭게 바꿀 수 있어요.</p></section>
    <div className="select-row"><span>준비 카테고리</span><button onClick={()=>setSetup(s=>({...s,categories:s.categories.length===CATEGORIES.length?[]:CATEGORIES.map(c=>c.id)}))}>{setup.categories.length===CATEGORIES.length?'전체 해제':'전체 선택'}</button></div>
    <section className="category-grid">{CATEGORIES.map(c=><button key={c.id} className={setup.categories.includes(c.id)?'on':''} aria-pressed={setup.categories.includes(c.id)} onClick={()=>toggleCategory(c.id)}><span>{c.icon}</span><strong>{c.name}</strong><b>{setup.categories.includes(c.id)?'ON':'OFF'}</b></button>)}</section>
    <label className="optional-toggle"><input type="checkbox" checked={setup.includeOptional} onChange={e=>setSetup(s=>({...s,includeOptional:e.target.checked}))}/><span><strong>선택 품목도 함께 보기</strong><small>꼭 필요하지 않은 아이디어까지 추천해요</small></span></label>
    <div className="sticky-action"><button className="primary" disabled={!setup.categories.length} onClick={createChecklist}>맞춤 체크리스트 만들기 <span>→</span></button></div>
  </main>;

  return <main className="app-shell checklist-screen">
    <header className="check-head"><div className="check-nav"><button className="icon-btn light" aria-label="새 체크리스트" onClick={startNew}>←</button><div><small>{typeInfo.icon} {typeInfo.name} · {formatTripDuration(setup.nights)} · {setup.people}명</small><input aria-label="체크리스트 이름" value={tripName} onChange={e=>setTripName(e.target.value)}/></div><button className="text-btn" onClick={saveChecklist}>저장</button></div>
      <div className="progress-copy" data-testid="progress-copy"><span>선택한 준비물</span><strong>{progress.done} / {progress.total} <em>· {progress.percent}%</em></strong></div><div className="progress-track"><i style={{width:`${progress.percent}%`}}/></div><p className="selection-hint">필요 없는 물품만 체크를 해제하세요.</p>
    </header>
    <nav className="filter-tabs" aria-label="카테고리 필터"><button className={categoryFilter==='all'?'active':''} onClick={()=>setCategoryFilter('all')}>전체 <b>{items.length}</b></button>{CATEGORIES.filter(c=>items.some(i=>i.category===c.id)).map(c=><button key={c.id} className={categoryFilter===c.id?'active':''} onClick={()=>setCategoryFilter(c.id)}>{c.icon} {c.name}</button>)}</nav>
    <section className="export-panel" aria-label="선택한 준비물 파일 저장">
      <div><strong>선택한 준비물 저장</strong><small>{checkedRows.length ? `${checkedRows.length}개 선택 항목만 파일에 포함돼요.` : '필요한 품목을 선택하면 파일로 저장할 수 있어요.'}</small></div>
      <div className="export-buttons">
        <button type="button" disabled={!checkedRows.length || Boolean(exporting)} onClick={()=>exportChecked('pdf')}><span>PDF</span>{exporting==='pdf'?'만드는 중…':'저장'}</button>
        <button type="button" disabled={!checkedRows.length || Boolean(exporting)} onClick={()=>exportChecked('xlsx')}><span>XLSX</span>{exporting==='xlsx'?'만드는 중…':'저장'}</button>
      </div>
    </section>
    <section className="list-section">{CATEGORIES.filter(c=>categoryFilter==='all'||categoryFilter===c.id).map(category=>{const rows=filtered.filter(i=>i.category===category.id); if(!rows.length)return null; return <div className="category-block" key={category.id}><div className="category-title"><span>{category.icon}</span><h2>{category.name}</h2><small>{rows.filter(i=>i.checked).length}/{rows.length}</small></div>{rows.map(item=><article data-testid="check-item" className={`check-item ${item.checked?'':'excluded'}`} key={item.id}>
      <label><input type="checkbox" checked={item.checked} onChange={()=>toggleItem(item.id)}/><i>✓</i></label><button className="item-main" onClick={()=>setEditing({...item})}><span><strong>{item.name}</strong>{item.memo&&<small>{item.memo}</small>}</span><span className={`badge ${item.importance}`}>{IMPORTANCE[item.importance]?.icon} {IMPORTANCE[item.importance]?.label}</span><b>× {item.quantity}</b></button>
    </article>)}</div>})}</section>
    <div className="bottom-actions"><button className="secondary" onClick={()=>setAdding(true)}>＋ 준비물 추가</button><button className="primary" onClick={saveChecklist}>체크리스트 저장 <span>✓</span></button></div>
    {editing&&<ItemEditor item={editing} onChange={setEditing} onSave={()=>updateItem(editing)} onDelete={()=>deleteItem(editing.id)} onClose={()=>setEditing(null)}/>}
    {adding&&<AddItem onAdd={addItem} onClose={()=>setAdding(false)}/>}
  </main>;
}

function ItemEditor({item,onChange,onSave,onDelete,onClose}) { return <Modal title="준비물 수정" onClose={onClose}><div className="form">
  <label>품목명<input value={item.name} onChange={e=>onChange({...item,name:e.target.value})}/></label><div className="form-row"><label>수량<input aria-label="수량" type="number" min="1" value={item.quantity} onChange={e=>onChange({...item,quantity:Math.max(1,Number(e.target.value))})}/></label><label>중요도<select value={item.importance} onChange={e=>onChange({...item,importance:e.target.value})}>{Object.entries(IMPORTANCE).map(([k,v])=><option value={k} key={k}>{v.icon} {v.label}</option>)}</select></label></div>
  <label>메모<textarea value={item.memo} onChange={e=>onChange({...item,memo:e.target.value})} placeholder="구매처, 보관 위치 등을 적어두세요"/></label><div className="modal-actions"><button className="danger" onClick={onDelete}>목록에서 삭제</button><button className="primary" disabled={!item.name.trim()} onClick={onSave}>변경사항 저장</button></div>
</div></Modal> }

function AddItem({onAdd,onClose}) { const [draft,setDraft]=useState({name:'',quantity:1,category:'leisure',importance:'recommended',memo:''}); return <Modal title="준비물 추가" onClose={onClose}><div className="form">
  <label>품목명<input autoFocus value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="예: 별 관측 망원경"/></label><div className="form-row"><label>수량<input aria-label="수량" type="number" min="1" value={draft.quantity} onChange={e=>setDraft({...draft,quantity:Math.max(1,Number(e.target.value))})}/></label><label>카테고리<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>{CATEGORIES.map(c=><option value={c.id} key={c.id}>{c.icon} {c.name}</option>)}</select></label></div>
  <label>메모<textarea value={draft.memo} onChange={e=>setDraft({...draft,memo:e.target.value})}/></label><div className="modal-actions"><button className="ghost" onClick={onClose}>취소</button><button className="primary" disabled={!draft.name.trim()} onClick={()=>onAdd(draft)}>추가하기</button></div>
</div></Modal> }
