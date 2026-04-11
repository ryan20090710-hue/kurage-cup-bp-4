import React, { useState, useEffect, useMemo } from 'react';
import { Search, MonitorPlay, Settings, User, Image as ImageIcon, X, Trash2 } from 'lucide-react';

// --- 自訂 Hook: 用於跨分頁同步狀態 (localStorage) ---
function useSharedState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key && e.newValue !== null) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const setSharedState = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [state, setSharedState];
}

// --- 預設狀態 (加入 Pick 與 Ban 的區分) ---
const DEFAULT_STATE = {
  matchTitle: '兩方 BP 環節',
  background: '#e6e9fc', 
  team1: {
    name: 'we are charlie kirk',
    color: '#1df08a',
    bans: [
      { id: 't1_b1', brawler: null },
      { id: 't1_b2', brawler: null },
      { id: 't1_b3', brawler: null },
    ],
    picks: [
      { id: 't1_p1', player: 'GreenTea', brawler: null },
      { id: 't1_p2', player: 'Zeta', brawler: null },
      { id: 't1_p3', player: 'Kanga', brawler: null },
    ],
  },
  team2: {
    name: 'God',
    color: '#33c5ff',
    bans: [
      { id: 't2_b1', brawler: null },
      { id: 't2_b2', brawler: null },
      { id: 't2_b3', brawler: null },
    ],
    picks: [
      { id: 't2_p1', player: 'Zeta', brawler: null },
      { id: 't2_p2', player: 'Kyulna', brawler: null },
      { id: 't2_p3', player: 'tkrp519', brawler: null },
    ],
  },
};

// --- 主元件 ---
export default function BrawlBPApp() {
  const [view, setView] = useState('home'); 

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'viewer') {
      setView('viewer');
    } else if (urlParams.get('view') === 'operator') {
      setView('operator');
    }
  }, []);

  if (view === 'viewer') return <ViewerView />;
  if (view === 'operator') return <OperatorPanel onBack={() => setView('home')} />;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Brawl Stars BP 系統
        </h1>
        <p className="text-slate-400 text-lg">
          這是一個雙視角同步系統。請在另一個分頁或 OBS 中開啟「觀眾視角」，並保留「操作者控制台」來進行即時控制。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <button
            onClick={() => setView('operator')}
            className="flex flex-col items-center p-8 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors border border-slate-700 group"
          >
            <Settings className="w-16 h-16 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">操作者控制台</h2>
            <p className="text-slate-400 text-sm">設定隊伍、背景並執行 Ban/Pick</p>
          </button>

          <button
            onClick={() => {
              window.open(window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'view=viewer', '_blank');
            }}
            className="flex flex-col items-center p-8 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors border border-slate-700 group"
          >
            <MonitorPlay className="w-16 h-16 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold mb-2">開啟觀眾視角</h2>
            <p className="text-slate-400 text-sm">乾淨的展示畫面 (另開新分頁)</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 操作者視角 (控制台) ---
function OperatorPanel({ onBack }) {
  // 更改 key 強制讀取新格式，避免舊資料當機
  const [state, setState] = useSharedState('brawl_bp_state_v2', DEFAULT_STATE);
  const [brawlers, setBrawlers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null); // { team: 'team1', type: 'bans'|'picks', index: 0 }

  useEffect(() => {
    fetch('https://api.brawlapi.com/v1/brawlers')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.list) {
          const list = data.list.map((b) => ({
            id: b.id,
            name: b.name,
            imageUrl: b.imageUrl,
          }));
          setBrawlers(list);
        }
      })
      .catch((err) => console.error('Failed to fetch brawlers', err));
  }, []);

  const openBrawlerSelect = (team, type, index) => {
    setActiveSlot({ team, type, index });
    setModalOpen(true);
  };

  const handleSelectBrawler = (brawler) => {
    if (!activeSlot) return;
    const newState = { ...state };
    newState[activeSlot.team][activeSlot.type][activeSlot.index].brawler = brawler;
    setState(newState);
    setModalOpen(false);
  };

  const handleClearBrawler = (team, type, index) => {
    const newState = { ...state };
    newState[team][type][index].brawler = null;
    setState(newState);
  };

  const handleStateChange = (keys, value) => {
    const newState = { ...state };
    let current = newState;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setState(newState);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-bold">
            &larr; 返回首頁
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" /> 賽事控制台 (即時同步)
          </h1>
        </div>
        <button
          onClick={() => setState(DEFAULT_STATE)}
          className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
        >
          重置所有設定
        </button>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 overflow-y-auto">
        {/* 左側：全局與隊伍設定 */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">全局設定</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">主標題</label>
                <input
                  type="text"
                  value={state.matchTitle}
                  onChange={(e) => handleStateChange(['matchTitle'], e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">背景 (顏色 或 圖片URL)</label>
                <input
                  type="text"
                  value={state.background}
                  onChange={(e) => handleStateChange(['background'], e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2" style={{ color: state.team1.color }}>左方隊伍 (Team 1)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">隊伍名稱</label>
                <input type="text" value={state.team1.name} onChange={(e) => handleStateChange(['team1', 'name'], e.target.value)} className="w-full p-2 border rounded outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">隊伍顏色</label>
                <input type="color" value={state.team1.color} onChange={(e) => handleStateChange(['team1', 'color'], e.target.value)} className="w-full h-10 p-1 border rounded cursor-pointer" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">玩家 ID (Pick 選手)</label>
                {state.team1.picks.map((pick, i) => (
                  <input key={pick.id} type="text" value={pick.player} onChange={(e) => {
                      const newPicks = [...state.team1.picks];
                      newPicks[i].player = e.target.value;
                      handleStateChange(['team1', 'picks'], newPicks);
                    }}
                    className="w-full p-2 border rounded mb-2 outline-none text-sm" placeholder={`Player ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2" style={{ color: state.team2.color }}>右方隊伍 (Team 2)</h2>
             <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">隊伍名稱</label>
                <input type="text" value={state.team2.name} onChange={(e) => handleStateChange(['team2', 'name'], e.target.value)} className="w-full p-2 border rounded outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">隊伍顏色</label>
                <input type="color" value={state.team2.color} onChange={(e) => handleStateChange(['team2', 'color'], e.target.value)} className="w-full h-10 p-1 border rounded cursor-pointer" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">玩家 ID (Pick 選手)</label>
                {state.team2.picks.map((pick, i) => (
                  <input key={pick.id} type="text" value={pick.player} onChange={(e) => {
                      const newPicks = [...state.team2.picks];
                      newPicks[i].player = e.target.value;
                      handleStateChange(['team2', 'picks'], newPicks);
                    }}
                    className="w-full p-2 border rounded mb-2 outline-none text-sm" placeholder={`Player ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右側：BP 控制區 */}
        <div className="xl:col-span-9">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
            <h2 className="text-2xl font-bold mb-8 text-center">Ban / Pick 操作面板</h2>
            
            <div className="flex justify-around gap-8">
              {/* Team 1 面板 */}
              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-2xl font-black mb-4" style={{ color: state.team1.color }}>{state.team1.name}</h3>
                
                {/* Bans 區塊 */}
                <div className="w-full bg-slate-50 rounded-xl p-4 mb-8 border border-slate-200 flex flex-col items-center">
                  <span className="text-sm font-bold text-slate-400 mb-3 tracking-widest">BANS</span>
                  <div className="flex gap-4">
                    {state.team1.bans.map((ban, i) => (
                      <OperatorBanSlot key={ban.id} slot={ban} color={state.team1.color} onSelect={() => openBrawlerSelect('team1', 'bans', i)} onClear={() => handleClearBrawler('team1', 'bans', i)} />
                    ))}
                  </div>
                </div>

                {/* Picks 區塊 */}
                <div className="w-full flex flex-col items-center space-y-4">
                  <span className="text-sm font-bold text-slate-400 mb-1 tracking-widest">PICKS</span>
                  {state.team1.picks.map((pick, i) => (
                    <OperatorPickSlot key={pick.id} slot={pick} color={state.team1.color} onSelect={() => openBrawlerSelect('team1', 'picks', i)} onClear={() => handleClearBrawler('team1', 'picks', i)} />
                  ))}
                </div>
              </div>

              {/* 中央分隔線 */}
              <div className="w-px bg-slate-200"></div>

              {/* Team 2 面板 */}
              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-2xl font-black mb-4" style={{ color: state.team2.color }}>{state.team2.name}</h3>
                
                {/* Bans 區塊 */}
                <div className="w-full bg-slate-50 rounded-xl p-4 mb-8 border border-slate-200 flex flex-col items-center">
                  <span className="text-sm font-bold text-slate-400 mb-3 tracking-widest">BANS</span>
                  <div className="flex gap-4">
                    {state.team2.bans.map((ban, i) => (
                      <OperatorBanSlot key={ban.id} slot={ban} color={state.team2.color} onSelect={() => openBrawlerSelect('team2', 'bans', i)} onClear={() => handleClearBrawler('team2', 'bans', i)} />
                    ))}
                  </div>
                </div>

                {/* Picks 區塊 */}
                <div className="w-full flex flex-col items-center space-y-4">
                  <span className="text-sm font-bold text-slate-400 mb-1 tracking-widest">PICKS</span>
                  {state.team2.picks.map((pick, i) => (
                    <OperatorPickSlot key={pick.id} slot={pick} color={state.team2.color} onSelect={() => openBrawlerSelect('team2', 'picks', i)} onClear={() => handleClearBrawler('team2', 'picks', i)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {modalOpen && (
        <BrawlerSelectModal brawlers={brawlers} onClose={() => setModalOpen(false)} onSelect={handleSelectBrawler} />
      )}
    </div>
  );
}

// 控制台的 Ban 槽位 (小正方形)
function OperatorBanSlot({ slot, color, onSelect, onClear }) {
  return (
    <div className="relative group">
      <div onClick={onSelect} className="w-16 h-16 rounded-lg border-[3px] bg-white flex items-center justify-center cursor-pointer hover:opacity-80 transition relative overflow-hidden shadow-sm" style={{ borderColor: color }}>
        {slot.brawler ? (
          <>
            <img src={slot.brawler.imageUrl} alt={slot.brawler.name} className="w-full h-full object-cover grayscale opacity-90" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="5" y1="5" x2="95" y2="95" stroke="#d5281a" strokeWidth="12" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center z-10">
              <span className="text-white text-[10px] font-bold">更換</span>
            </div>
          </>
        ) : (
          <ImageIcon className="w-6 h-6 text-slate-300" />
        )}
      </div>
      {slot.brawler && (
        <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// 控制台的 Pick 槽位 (包含選手名稱)
function OperatorPickSlot({ slot, color, onSelect, onClear }) {
  return (
    <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-2xl border shadow-sm w-full max-w-[280px] group">
      <div onClick={onSelect} className="w-[72px] h-[72px] rounded-xl border-4 bg-slate-50 flex shrink-0 items-center justify-center cursor-pointer hover:opacity-80 transition relative overflow-hidden" style={{ borderColor: color }}>
        {slot.brawler ? (
          <>
            <img src={slot.brawler.imageUrl} alt={slot.brawler.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
              <span className="text-white text-xs font-bold">更換</span>
            </div>
          </>
        ) : (
          <ImageIcon className="w-8 h-8 text-slate-300" />
        )}
      </div>
      <div className="flex-1 truncate font-bold text-slate-600">{slot.player || 'Player'}</div>
      <button onClick={onClear} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition">
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}


// 選擇角色對話框
function BrawlerSelectModal({ brawlers, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const filtered = brawlers.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold">選擇英雄</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b bg-white flex gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="搜尋角色名稱 (英文)..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>
          <div className="flex-1 flex gap-2">
             <input type="text" placeholder="或輸入自訂圖片網址..." value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
            <button onClick={() => customUrl && onSelect({ name: 'Custom', imageUrl: customUrl })} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 whitespace-nowrap">
              使用網址
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-slate-100">
          {brawlers.length === 0 ? (
            <div className="text-center text-slate-500 py-10">正在載入角色圖庫... (如果卡住，請使用自訂網址功能)</div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-3">
              {filtered.map(b => (
                <button key={b.id} onClick={() => onSelect(b)} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white hover:shadow-md transition group">
                  <img src={b.imageUrl} alt={b.name} className="w-[60px] h-[60px] object-cover rounded-lg shadow-sm group-hover:scale-105 transition" />
                  <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{b.name}</span>
                </button>
              ))}
              {filtered.length === 0 && <div className="col-span-full text-center text-slate-500 py-10">找不到角色</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 觀眾視角 (乾淨展示) ---
function ViewerView() {
  const [state] = useSharedState('brawl_bp_state_v2', DEFAULT_STATE);

  const bgStyle = state.background.startsWith('http') 
    ? { backgroundImage: `url(${state.background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: state.background };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col relative font-sans select-none" style={bgStyle}>
      
      {/* 頂部標題 */}
      <div className="w-full text-center pt-8 pb-4 z-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-[0.2em] text-white drop-shadow-md" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}>
          {state.matchTitle}
        </h1>
      </div>

      {/* Bans 區塊 (置於上方) */}
      <div className="w-full flex justify-center items-center gap-16 mb-6 z-10">
        <div className="flex gap-4">
          {state.team1.bans.map(ban => <ViewerBanSlot key={ban.id} ban={ban} color={state.team1.color} />)}
        </div>
        <div className="font-black text-2xl tracking-widest text-white/50 drop-shadow-md">BANS</div>
        <div className="flex gap-4">
          {state.team2.bans.map(ban => <ViewerBanSlot key={ban.id} ban={ban} color={state.team2.color} />)}
        </div>
      </div>

      {/* Picks 區塊 (兩側展開) */}
      <div className="flex-1 flex justify-center items-start pt-4 z-10">
        <div className="w-full max-w-5xl flex justify-around">
          
          {/* 左隊 (Team 1) Picks */}
          <div className="flex flex-col items-center w-64">
            <h2 className="text-3xl font-black mb-8 tracking-wider text-center break-words w-full px-4" style={{ color: state.team1.color, textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
              {state.team1.name}
            </h2>
            <div className="flex flex-col gap-10 w-full items-center">
              {state.team1.picks.map(pick => <ViewerPickSlot key={pick.id} pick={pick} color={state.team1.color} />)}
            </div>
          </div>

          <div className="w-32"></div>

          {/* 右隊 (Team 2) Picks */}
          <div className="flex flex-col items-center w-64">
            <h2 className="text-3xl font-black mb-8 tracking-wider text-center break-words w-full px-4" style={{ color: state.team2.color, textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>
              {state.team2.name}
            </h2>
            <div className="flex flex-col gap-10 w-full items-center">
              {state.team2.picks.map(pick => <ViewerPickSlot key={pick.id} pick={pick} color={state.team2.color} />)}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

// 觀眾視角的 Ban 槽位 (小圖示、去色、紅斜線)
function ViewerBanSlot({ ban, color }) {
  return (
    <div className="w-[75px] h-[75px] rounded-lg border-[3px] relative overflow-hidden shadow-xl bg-[#2a3040]" style={{ borderColor: color }}>
      {ban.brawler ? (
        <>
          <img src={ban.brawler.imageUrl} alt={ban.brawler.name} className="w-full h-full object-cover filter grayscale opacity-90" />
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="5" y1="5" x2="95" y2="95" stroke="#d5281a" strokeWidth="10" strokeLinecap="round" />
          </svg>
        </>
      ) : (
        <div className="w-full h-full bg-[#1e2330] flex items-center justify-center opacity-50"></div>
      )}
    </div>
  );
}

// 觀眾視角的 Pick 槽位 (大圖示、全彩、含選手名)
function ViewerPickSlot({ pick, color }) {
  return (
    <div className="flex flex-col items-center relative w-full">
      {/* 玩家名稱 */}
      <span className="absolute -top-8 text-white text-xl font-bold tracking-wide drop-shadow-lg z-10" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
        {pick.player}
      </span>
      
      {/* 角色頭像框 */}
      <div className="w-[120px] h-[120px] rounded-2xl border-[4px] relative overflow-hidden shadow-2xl bg-[#2a3040]" style={{ borderColor: color }}>
        {pick.brawler ? (
          <img src={pick.brawler.imageUrl} alt={pick.brawler.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#1e2330] flex items-center justify-center opacity-50"></div>
        )}
      </div>
    </div>
  );
}