import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, RotateCcw, ShieldX, Check, Star, Users, User,
  ArrowRightLeft, EyeOff, Eye, Globe, MonitorPlay, Settings,
  Image as ImageIcon, X, Trash2, Home, Palette, AlignJustify, Grid3x3,
  GripVertical, ChevronUp, ChevronDown, Lock, KeyRound, Trophy
} from 'lucide-react';

// ─── Firebase 套件 ────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// ─── Firebase App 1：Firestore（多人連線 BP 房間） ────────────────────────────
const firebaseConfig1 = {
  apiKey: "AIzaSyDHj5H4gHDP4VgzSfmc8Rp1yvUD-qbR2wU",
  authDomain: "kuragecup-bp.firebaseapp.com",
  projectId: "kuragecup-bp",
  storageBucket: "kuragecup-bp.firebasestorage.app",
  messagingSenderId: "230189053495",
  appId: "1:230189053495:web:d8cb779641e21927dcf1b2",
  measurementId: "G-KCR9ZFJ78M"
};
const app1 = initializeApp(firebaseConfig1, 'app1');
const auth = getAuth(app1);
const firestoreDb = getFirestore(app1);
const appId = 'kurage-cup-room-1';

// ─── Firebase App 2：Realtime Database（操作者 / 觀眾視角） ──────────────────
// ⚠️ 請將下方 apiKey 與 appId 填入你的真實金鑰
const firebaseConfig2 = {
  apiKey: "AIzaSyBmAvJoOiNaqQLMv5efgEXqRi2hdBDfoJA",
  authDomain: "kuragecuphall.firebaseapp.com",
  databaseURL: "https://kuragecuphall-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kuragecuphall",
  storageBucket: "kuragecuphall.firebasestorage.app",
  messagingSenderId: "242490954",
  appId: "1:242490954:web:4e833d0e6726f17a3cd0b3",
  measurementId: "G-039CTS79DH"
};
const app2 = initializeApp(firebaseConfig2, 'app2');
const realtimeDb = getDatabase(app2);

// ─── Firebase App 3：Realtime Database（對戰表） ──────────────────────────────
const firebaseConfig3 = {
  apiKey: "AIzaSyA7Ze9Hk5PqVnIwBUuDsaCvp06XRqaUPNU",
  authDomain: "kuragecup-bracket.firebaseapp.com",
  databaseURL: "https://kuragecup-bracket-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kuragecup-bracket",
  storageBucket: "kuragecup-bracket.firebasestorage.app",
  messagingSenderId: "282180845261",
  appId: "1:282180845261:web:812d1d9ca5b1f45a54f384",
  measurementId: "G-TVX5B87H8T"
};
const app3 = initializeApp(firebaseConfig3, 'app3');
const bracketDb = getDatabase(app3);

// ─── Firebase App 4：Realtime Database（記分板） ──────────────────────────────
const firebaseConfig4 = {
  apiKey: "AIzaSyCEL7dMOBVmRcIyMPlVo03IuRcbwB0LWX0",
  authDomain: "score-board-e309d.firebaseapp.com",
  databaseURL: "https://score-board-e309d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "score-board-e309d",
  storageBucket: "score-board-e309d.firebasestorage.app",
  messagingSenderId: "207375554363",
  appId: "1:207375554363:web:2d3cbb8ab89041f27e891e",
  measurementId: "G-YN4H8VM2W2"
};
const app4 = initializeApp(firebaseConfig4, 'app4');
const scoreboardDb = getDatabase(app4);

// ═══════════════════════════════════════════════════════════════════════════════
// 共用資料
// ═══════════════════════════════════════════════════════════════════════════════

const BRAWLERS = [
  { id: 'shelly', name: '雪莉', rarity: 'starting' }, { id: 'nita', name: '妮塔', rarity: 'rare' }, { id: 'colt', name: '柯爾特', rarity: 'rare' },
  { id: 'brock', name: '布洛克', rarity: 'rare' }, { id: 'bull', name: '狂牛', rarity: 'rare' }, { id: 'el_primo', name: '艾爾普里莫', rarity: 'rare' },
  { id: 'barley', name: '保力', rarity: 'rare' }, { id: 'poco', name: '波可', rarity: 'rare' }, { id: 'rosa', name: '羅莎', rarity: 'rare' },
  { id: 'jessie', name: '潔西', rarity: 'super_rare' }, { id: 'dynamike', name: '爆破麥克', rarity: 'super_rare' }, { id: 'tick', name: '滴答', rarity: 'super_rare' },
  { id: '8bit', name: '比特八號', rarity: 'super_rare' }, { id: 'rico', name: '彈射', rarity: 'super_rare' }, { id: 'darryl', name: '達里爾', rarity: 'super_rare' },
  { id: 'penny', name: '佩妮', rarity: 'super_rare' }, { id: 'carl', name: '卡爾', rarity: 'super_rare' }, { id: 'jacky', name: '賈姬', rarity: 'super_rare' },
  { id: 'gus', name: '格斯', rarity: 'super_rare' }, { id: 'bo', name: '鷹獵人爆', rarity: 'epic' }, { id: 'emz', name: '艾謎', rarity: 'epic' },
  { id: 'stu', name: '駛徒', rarity: 'epic' }, { id: 'piper', name: '小辣椒', rarity: 'epic' }, { id: 'pam', name: '帕姆', rarity: 'epic' },
  { id: 'frank', name: '法蘭克', rarity: 'epic' }, { id: 'bibi', name: '嗶嗶', rarity: 'epic' }, { id: 'bea', name: '碧兒', rarity: 'epic' },
  { id: 'nani', name: '納妮', rarity: 'epic' }, { id: 'edgar', name: '艾德加', rarity: 'epic' }, { id: 'griff', name: '格里夫', rarity: 'epic' },
  { id: 'grom', name: '葛羅姆', rarity: 'epic' }, { id: 'bonnie', name: '邦妮', rarity: 'epic' }, { id: 'gale', name: '格爾', rarity: 'epic' },
  { id: 'colette', name: '葛蕾特', rarity: 'epic' }, { id: 'belle', name: '蓓爾', rarity: 'epic' },
  { id: 'ash', name: '阿信', rarity: 'epic' }, { id: 'lola', name: '蘿拉', rarity: 'epic' }, { id: 'sam', name: '山姆', rarity: 'epic' },
  { id: 'mandy', name: '曼蒂', rarity: 'epic' }, { id: 'maisie', name: '麥希', rarity: 'epic' }, { id: 'hank', name: '漢克', rarity: 'epic' },
  { id: 'pearl', name: '珀爾', rarity: 'epic' }, { id: 'larry_lawrie', name: '賴瑞與羅瑞', rarity: 'epic' },
  { id: 'angelo', name: '安傑洛', rarity: 'epic' }, { id: 'berry', name: '貝瑞', rarity: 'epic' }, { id: 'shade', name: '謝德', rarity: 'epic' },
  { id: 'Meeple', name: '謎寶', rarity: 'epic' }, { id: 'Trunk', name: '特朗克', rarity: 'epic' },
  { id: 'mortis', name: '莫提斯', rarity: 'mythic' }, { id: 'tara', name: '塔拉', rarity: 'mythic' }, { id: 'gene', name: '吉恩', rarity: 'mythic' },
  { id: 'max', name: '麥克絲', rarity: 'mythic' }, { id: 'mrp', name: 'Mr.P', rarity: 'mythic' }, { id: 'sprout', name: '芽芽', rarity: 'mythic' },
  { id: 'byron', name: '拜倫', rarity: 'mythic' }, { id: 'squeak', name: '斯威克', rarity: 'mythic' }, { id: 'lou', name: '阿魯', rarity: 'mythic' },
  { id: 'ruffs', name: '拉夫', rarity: 'mythic' }, { id: 'buzz', name: '霸子', rarity: 'mythic' }, { id: 'fang', name: '范', rarity: 'mythic' },
  { id: 'eve', name: '異芙', rarity: 'mythic' }, { id: 'janet', name: '珍娜', rarity: 'mythic' }, { id: 'otis', name: '歐提斯', rarity: 'mythic' },
  { id: 'buster', name: '巴斯特', rarity: 'mythic' }, { id: 'gray', name: '蓋瑞', rarity: 'mythic' }, { id: 'rt', name: 'R-T', rarity: 'mythic' },
  { id: 'willow', name: '葳洛', rarity: 'mythic' }, { id: 'doug', name: '道格', rarity: 'mythic' }, { id: 'chuck', name: '查克', rarity: 'mythic' },
  { id: 'charlie', name: '查莉', rarity: 'mythic' }, { id: 'mico', name: '米可', rarity: 'mythic' }, { id: 'melodie', name: '美樂蒂', rarity: 'mythic' },
  { id: 'lily', name: '莉莉', rarity: 'mythic' }, { id: 'clancy', name: '克蘭西', rarity: 'mythic' }, { id: 'moe', name: '莫', rarity: 'mythic' },
  { id: 'juju', name: '茱茱', rarity: 'mythic' }, { id: 'ollie', name: '奧利', rarity: 'mythic' }, { id: 'lumi', name: '露米', rarity: 'mythic' },
  { id: 'finx', name: '芬克斯', rarity: 'mythic' }, { id: 'Jaeyoug', name: '載勇', rarity: 'mythic' }, { id: 'Alli', name: '愛莉', rarity: 'mythic' },
  { id: 'Mina', name: '蜜娜', rarity: 'mythic' }, { id: 'Ziggy', name: '茲奇', rarity: 'mythic' }, { id: 'Gigi', name: '琪琪', rarity: 'mythic' },
  { id: 'Glowy', name: '格魯伊', rarity: 'mythic' }, { id: 'najia', name: '娜吉亞', rarity: 'mythic' },
  { id: 'spike', name: '史派克', rarity: 'legendary' }, { id: 'crow', name: '鴉', rarity: 'legendary' }, { id: 'leon', name: '里昂', rarity: 'legendary' },
  { id: 'sandy', name: '沙迪', rarity: 'legendary' }, { id: 'amber', name: '安珀', rarity: 'legendary' }, { id: 'meg', name: '梅格', rarity: 'legendary' },
  { id: 'surge', name: '奔騰', rarity: 'legendary' }, { id: 'chester', name: '查斯特', rarity: 'legendary' },
  { id: 'cordelius', name: '康迪留斯', rarity: 'legendary' }, { id: 'kit', name: '凱特', rarity: 'legendary' },
  { id: 'draco', name: '德拉古', rarity: 'legendary' }, { id: 'kenji', name: '賢治', rarity: 'legendary' }, { id: 'Pierce', name: '皮爾斯', rarity: 'legendary' },
  { id: 'kaze', name: '小風', rarity: 'ultra_legendary' }, { id: 'sirius', name: '西里烏斯', rarity: 'ultra_legendary' }
];

const RARITY_BG = {
  'starting': 'bg-gradient-to-br from-cyan-300 to-blue-500 text-white',
  'rare': 'bg-gradient-to-br from-green-400 to-emerald-600 text-white',
  'super_rare': 'bg-gradient-to-br from-blue-400 to-indigo-600 text-white',
  'epic': 'bg-gradient-to-br from-fuchsia-400 to-purple-600 text-white',
  'mythic': 'bg-gradient-to-br from-red-500 to-rose-700 text-white',
  'legendary': 'bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-900',
  'ultra_legendary': 'bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] relative overflow-hidden ring-1 ring-fuchsia-300',
};

// ─── 雲端同步 Hook（Realtime Database）── 所有元件共用 ───────────────────────
function useFirebaseState(key, initialValue) {
  const [state, setState] = useState(initialValue);
  useEffect(() => {
    const dbRef = ref(realtimeDb, key);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) { setState(data); }
      else { set(dbRef, initialValue); setState(initialValue); }
    });
    return () => unsubscribe();
  }, [key]);
  // 不使用 state 閉包，避免 esbuild TDZ 錯誤
  function setSharedState(value) {
    try {
      set(ref(realtimeDb, key), value);
    } catch (error) { console.error('Firebase update error:', error); }
  }
  return [state, setSharedState];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 密碼鎖元件
// ═══════════════════════════════════════════════════════════════════════════════

const GATE_LABELS = {
  settings:           { icon: '🎨', name: '主畫面設定' },
  operator:           { icon: '⚙️', name: '操作者控制台' },
  editmode:           { icon: '✥',  name: '自由移動模式' },
  reset:              { icon: '🔄', name: '重置 BP 房間' },
  bracket_operator:   { icon: '🏆', name: '對戰表控制台' },
  scoreboard_operator:{ icon: '🏅', name: '記分板控制台' },
};

function PasswordGate({ target, onSuccess, onCancel }) {
  const [input, setInput]   = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState(false);
  const [currentPw, setCurrentPw] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
    const isBracket    = target === 'bracket_operator';
    const isScoreboard = target === 'scoreboard_operator';
    const dbRef = isBracket
      ? ref(bracketDb, 'bracket_password')
      : isScoreboard
        ? ref(scoreboardDb, 'scoreboard_password')
        : ref(realtimeDb, 'brawl_password');
    const unsub = onValue(dbRef, (snap) => {
      setCurrentPw(snap.val() ?? '1234');
    });
    return () => unsub();
  }, [target]);

  const handleSubmit = () => {
    if (currentPw === null) return;
    if (input === currentPw) { setError(false); onSuccess(); }
    else { setError(true); setInput(''); }
  };

  const { icon, name } = GATE_LABELS[target] || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-8 w-full max-w-xs shadow-2xl mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-yellow-400" />
          </div>
          <h2 className="text-xl font-black text-white">需要密碼</h2>
          <p className="text-slate-400 text-sm mt-1">{icon} {name}</p>
        </div>

        <div className="relative mb-3">
          <input
            ref={inputRef}
            type={showPw ? 'text' : 'password'}
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="輸入密碼"
            className={`w-full bg-slate-800 text-white px-4 py-3 pr-12 rounded-xl border text-center text-xl font-mono tracking-[0.4em] focus:outline-none transition
              ${error ? 'border-red-500 ring-1 ring-red-500 animate-pulse' : 'border-slate-600 focus:border-yellow-400'}`}
          />
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-3 font-bold">密碼錯誤，請再試一次</p>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold border border-slate-600 hover:border-slate-400 transition">
            取消
          </button>
          <button onClick={handleSubmit} disabled={currentPw === null}
            className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-slate-900 font-black hover:opacity-90 transition disabled:opacity-50">
            {currentPw === null ? '載入中...' : '解鎖'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 修改密碼區塊（用在設定面板內） ──
function ChangePasswordSection({ accentColor }) {
  const [oldPw, setOldPw]         = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg]             = useState(null);
  const [show, setShow]           = useState(false);
  const [currentPw, setCurrentPw] = useState(null);

  useEffect(() => {
    const dbRef = ref(realtimeDb, 'brawl_password');
    const unsub = onValue(dbRef, (snap) => {
      setCurrentPw(snap.val() ?? '1234');
    });
    return () => unsub();
  }, []);

  const handleChange = () => {
    if (currentPw === null) return setMsg({ type: 'err', text: '尚未連線，請稍候' });
    if (oldPw !== currentPw)   return setMsg({ type: 'err', text: '原密碼錯誤' });
    if (newPw.length < 1)      return setMsg({ type: 'err', text: '新密碼不能為空' });
    if (newPw !== confirmPw)   return setMsg({ type: 'err', text: '兩次新密碼不符' });
    // 寫入 Firebase，所有裝置同步更新
    set(ref(realtimeDb, 'brawl_password'), newPw);
    setMsg({ type: 'ok', text: '密碼已同步更新到所有裝置！' });
    setOldPw(''); setNewPw(''); setConfirmPw('');
  };

  return (
    <section>
      <button
        onClick={() => { setShow(v => !v); setMsg(null); }}
        className="w-full flex items-center justify-between py-2 text-slate-300 font-bold text-sm"
      >
        <span className="flex items-center gap-2"><KeyRound size={15} className="text-yellow-400" /> 修改密碼</span>
        <span className="text-slate-500 text-xs">{show ? '▲ 收起' : '▼ 展開'}</span>
      </button>

      {show && (
        <div className="mt-3 space-y-2 bg-slate-800/60 rounded-xl p-4 border border-slate-700">
          {[
            { label: '原密碼', value: oldPw, set: setOldPw },
            { label: '新密碼', value: newPw, set: setNewPw },
            { label: '確認新密碼', value: confirmPw, set: setConfirmPw },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-slate-400 text-xs mb-1">{label}</label>
              <input
                type="password"
                value={value}
                onChange={e => { set(e.target.value); setMsg(null); }}
                onKeyDown={e => e.key === 'Enter' && handleChange()}
                className="w-full bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400 font-mono tracking-widest text-sm"
              />
            </div>
          ))}
          {msg && (
            <p className={`text-xs font-bold pt-1 ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
          )}
          <button
            onClick={handleChange}
            className="w-full mt-2 py-2 rounded-lg font-black text-slate-900 text-sm transition hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            確認修改
          </button>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 首頁（模式選擇）── 完全自由拖曳定位
// ═══════════════════════════════════════════════════════════════════════════════

const LOBBY_DEFAULT = {
  title: 'BRAWL STARS BP',
  subtitle: '請選擇模式',
  bgType: 'color',
  bgValue: '#020617',
  accentColor: '#facc15',
  buttons: [
    { id: 'multiplayer',       label: '多人連線 BP',    desc: '雙方即時禁用 & 選角',    order: 0 },
    { id: 'operator',          label: '操作者控制台',   desc: '手動管理賽事 BP 顯示',   order: 1 },
    { id: 'viewer',            label: '觀眾視角',       desc: 'OBS / 轉播用乾淨畫面',  order: 2 },
    { id: 'bracket_operator',  label: '對戰表控制台',   desc: '管理 8 強賽事對戰表',    order: 3 },
    { id: 'bracket_viewer',    label: '對戰表展示',     desc: 'OBS 用對戰表畫面',      order: 4 },
  ],
};

const DEFAULT_POSITIONS = {
  title:              { x: 50, y: 14 },
  subtitle:           { x: 50, y: 23 },
  multiplayer:        { x: 12, y: 60 },
  operator:           { x: 28, y: 60 },
  viewer:             { x: 44, y: 60 },
  bracket_operator:   { x: 60, y: 60 },
  bracket_viewer:     { x: 76, y: 60 },
  scoreboard_operator:{ x: 88, y: 78 },
  scoreboard_viewer:  { x: 88, y: 88 },
};

function getButtonIcon(id) {
  if (id === 'multiplayer')        return Users;
  if (id === 'operator')           return Settings;
  if (id === 'bracket_operator')   return Trophy;
  if (id === 'bracket_viewer')     return Trophy;
  if (id === 'scoreboard_operator') return Star;
  if (id === 'scoreboard_viewer')  return MonitorPlay;
  return MonitorPlay;
}


function HomePage({ onNavigate }) {
  const [config, setConfig]           = useFirebaseState('brawl_lobby_config', LOBBY_DEFAULT);
  const [fbPositions, setFbPositions] = useFirebaseState('brawl_lobby_positions', DEFAULT_POSITIONS);
  const [positions, setPositions]     = useState(DEFAULT_POSITIONS);
  const [editMode, setEditMode]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft]             = useState(null);
  const [gateTarget, setGateTarget]   = useState(null);
  const [isMobile, setIsMobile]       = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // ── 拖曳狀態（useRef 必須在 useEffect 之前宣告）──
  const draggingRef   = useRef(null);
  const offsetRef     = useRef({ x: 0, y: 0 });
  const containerRef  = useRef(null);
  const positionsRef  = useRef(positions);

  // 當 Firebase 位置更新時，同步到本地（只在非拖曳狀態下更新）
  useEffect(() => {
    if (!draggingRef.current) setPositions(fbPositions);
  }, [fbPositions]);

  useEffect(() => { positionsRef.current = positions; }, [positions]);

  // ── 手機偵測 resize 監聽 ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── 全部改成 function 宣告，避免 Terser/esbuild TDZ 問題 ──
  function savePositions(pos) { setFbPositions(pos); }

  function onDragStart(e, id) {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = id;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const curPos  = positionsRef.current[id];
    const elemX = rect.left + (curPos.x / 100) * rect.width;
    const elemY = rect.top  + (curPos.y / 100) * rect.height;
    offsetRef.current = { x: clientX - elemX, y: clientY - elemY };
  }

  function onMouseMove(e) {
    if (!draggingRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rawX = ((clientX - offsetRef.current.x - rect.left) / rect.width)  * 100;
    const rawY = ((clientY - offsetRef.current.y - rect.top)  / rect.height) * 100;
    const x = Math.min(95, Math.max(5, rawX));
    const y = Math.min(95, Math.max(5, rawY));
    const newPos = { ...positionsRef.current, [draggingRef.current]: { x, y } };
    setPositions(newPos);
  }

  function onMouseUp() {
    if (draggingRef.current) {
      savePositions(positionsRef.current);
      draggingRef.current = null;
    }
  }

  function openSettings() { setGateTarget('settings'); }
  function openSettingsAfterAuth() { setDraft(JSON.parse(JSON.stringify(config))); setSettingsOpen(true); }
  function saveSettings() { setConfig(draft); setSettingsOpen(false); }
  function resetAll() {
    setDraft(JSON.parse(JSON.stringify(LOBBY_DEFAULT)));
    setConfig(LOBBY_DEFAULT);
    setFbPositions(DEFAULT_POSITIONS);
    setPositions({ ...DEFAULT_POSITIONS });
  }
  function moveButton(idx, dir) {
    const btns = [...draft.buttons];
    const target = idx + dir;
    if (target < 0 || target >= btns.length) return;
    [btns[idx], btns[target]] = [btns[target], btns[idx]];
    btns.forEach((b, i) => (b.order = i));
    setDraft({ ...draft, buttons: btns });
  }

  const bgStyle = config.bgType === 'image' && config.bgValue.startsWith('http')
    ? { backgroundImage: `url(${config.bgValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: config.bgValue };

  // ── 拖曳元素的共用 wrapper 樣式（桌機用） ──
  function draggableStyle(id) {
    return {
      position: 'absolute',
      left: `${positions[id]?.x ?? DEFAULT_POSITIONS[id].x}%`,
      top:  `${positions[id]?.y ?? DEFAULT_POSITIONS[id].y}%`,
      transform: 'translate(-50%, -50%)',
      cursor: editMode ? 'grab' : 'default',
      userSelect: 'none',
      zIndex: 10,
    };
  }

  const editRing = editMode ? 'ring-2 ring-dashed ring-yellow-400/70 rounded-2xl p-1' : '';

  const sortedButtons = [...config.buttons].sort((a, b) => a.order - b.order);

  // ════════════════════════════════
  // 手機版佈局
  // ════════════════════════════════
  if (isMobile) {
    return (
      <div className="w-screen h-screen flex flex-col font-sans relative overflow-hidden" style={bgStyle} translate="no">
        {config.bgType === 'image' && <div className="absolute inset-0 bg-black/50 pointer-events-none" />}

        {/* 右上角設定按鈕 */}
        <div className="absolute top-3 right-3 z-50">
          <button onClick={openSettings}
            className="p-2.5 rounded-xl bg-white/10 active:bg-white/20 border border-white/20 relative"
          >
            <Palette size={18} className="text-white" />
            <Lock size={8} className="absolute top-1 right-1 text-yellow-400" />
          </button>
        </div>

        {/* 主內容：垂直置中 */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6">
          {/* 標題區 */}
          <div className="text-center">
            <h1
              className="text-3xl font-black italic tracking-tighter drop-shadow-lg leading-tight"
              style={{ color: config.accentColor }}
            >
              {config.title}
            </h1>
            <p className="text-white/50 text-sm mt-2">{config.subtitle}</p>
          </div>

          {/* 按鈕列：垂直堆疊，橫向排列 icon + 文字 */}
          <div className="w-full max-w-xs flex flex-col gap-3">
            {sortedButtons.map(btn => {
              const Icon = getButtonIcon(btn.id);
              return (
                <button
                  key={btn.id}
                  onClick={() => {
                    if (btn.id === 'operator') setGateTarget('operator');
                    else onNavigate(btn.id);
                  }}
                  className="flex items-center gap-4 w-full px-5 py-4 bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 active:bg-white/15 transition-all shadow-lg relative"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                  onTouchStart={e => e.currentTarget.style.borderColor = config.accentColor}
                  onTouchEnd={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                  <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.accentColor}20` }}>
                    <Icon size={22} style={{ color: config.accentColor }} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-white font-black text-base leading-tight">{btn.label}</div>
                    <div className="text-white/40 text-xs mt-0.5 truncate">{btn.desc}</div>
                  </div>
                  {btn.id === 'operator' && (
                    <Lock size={12} className="shrink-0 text-yellow-400 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 固定的對戰表按鈕（永遠顯示） */}
          <div className="w-full max-w-xs flex flex-col gap-2 mt-1">
            <div className="h-px bg-white/10" />
            <button
              onClick={() => setGateTarget('bracket_operator')}
              className="flex items-center gap-4 w-full px-5 py-3 rounded-2xl border border-white/10 transition-all relative"
              style={{ backgroundColor: 'rgba(250,204,21,0.08)' }}
            >
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-400/15">
                <Trophy size={20} className="text-yellow-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-white font-black text-sm leading-tight">對戰表控制台</div>
                <div className="text-white/40 text-xs mt-0.5">管理 8 強賽事對戰表</div>
              </div>
              <Lock size={12} className="shrink-0 text-yellow-400 opacity-60" />
            </button>
            <button
              onClick={() => onNavigate('bracket_viewer')}
              className="flex items-center gap-4 w-full px-5 py-3 rounded-2xl border border-white/10 transition-all"
              style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}
            >
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-blue-400/15">
                <Trophy size={20} className="text-blue-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-white font-black text-sm leading-tight">對戰表展示</div>
                <div className="text-white/40 text-xs mt-0.5">OBS / 轉播用乾淨畫面</div>
              </div>
            </button>
            <button
              onClick={() => setGateTarget('scoreboard_operator')}
              className="flex items-center gap-4 w-full px-5 py-3 rounded-2xl border border-white/10 transition-all relative"
              style={{ backgroundColor: 'rgba(250,204,21,0.06)' }}
            >
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-400/10">
                <Star size={20} className="text-yellow-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-white font-black text-sm leading-tight">記分板控制台</div>
                <div className="text-white/40 text-xs mt-0.5">管理兩隊即時比分</div>
              </div>
              <Lock size={12} className="shrink-0 text-yellow-400 opacity-60" />
            </button>
            <button
              onClick={() => onNavigate('scoreboard_viewer')}
              className="flex items-center gap-4 w-full px-5 py-3 rounded-2xl border border-white/10 transition-all"
              style={{ backgroundColor: 'rgba(59,130,246,0.06)' }}
            >
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-blue-400/10">
                <Star size={20} className="text-blue-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-white font-black text-sm leading-tight">記分板展示</div>
                <div className="text-white/40 text-xs mt-0.5">OBS / 轉播用畫面</div>
              </div>
            </button>
            <button
              onClick={() => onNavigate('lottery')}
              className="flex items-center gap-4 w-full px-5 py-3 rounded-2xl border border-white/10 transition-all"
              style={{ backgroundColor: 'rgba(168,85,247,0.08)' }}
            >
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-purple-400/10">
                <span style={{ fontSize: 20 }}>🎰</span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-white font-black text-sm leading-tight">抽獎系統</div>
                <div className="text-white/40 text-xs mt-0.5">閃光 / 消除 / 泡泡 抽獎</div>
              </div>
            </button>
          </div>
        </div>

        {/* 密碼鎖 */}
        {gateTarget && (
          <PasswordGate
            target={gateTarget}
            onSuccess={() => {
              const t = gateTarget;
              setGateTarget(null);
              if (t === 'settings') openSettingsAfterAuth();
              if (t === 'operator') onNavigate('operator');
              if (t === 'bracket_operator') onNavigate('bracket_operator');
              if (t === 'scoreboard_operator') onNavigate('scoreboard_operator');
            }}
            onCancel={() => setGateTarget(null)}
          />
        )}

        {/* 外觀設定側邊欄 */}
        {settingsOpen && draft && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
            <div className="w-full max-w-sm bg-[#0f172a] border-l border-slate-700 flex flex-col shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                <h2 className="text-base font-black text-white flex items-center gap-2"><Palette size={16} className="text-yellow-400" /> 外觀設定</h2>
                <button onClick={() => setSettingsOpen(false)} className="p-1 text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="flex-1 p-4 space-y-5 text-sm overflow-y-auto">
                <section>
                  <label className="block font-bold text-slate-300 mb-2">🏷 主標題</label>
                  <input type="text" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400" />
                </section>
                <section>
                  <label className="block font-bold text-slate-300 mb-2">💬 副標題</label>
                  <input type="text" value={draft.subtitle} onChange={e => setDraft({ ...draft, subtitle: e.target.value })} className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400" />
                </section>
                <section>
                  <label className="block font-bold text-slate-300 mb-2">🖼 背景</label>
                  <div className="flex gap-2 mb-3">
                    {['color','image'].map(t => (
                      <button key={t} onClick={() => setDraft({ ...draft, bgType: t })} className={`flex-1 py-1.5 rounded-lg border font-bold transition text-sm ${draft.bgType === t ? 'bg-yellow-400 text-slate-900 border-yellow-400' : 'bg-slate-800 text-slate-300 border-slate-600'}`}>{t === 'color' ? '純色' : '圖片'}</button>
                    ))}
                  </div>
                  {draft.bgType === 'color'
                    ? <div className="flex items-center gap-3"><input type="color" value={draft.bgValue} onChange={e => setDraft({ ...draft, bgValue: e.target.value })} className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent" /><input type="text" value={draft.bgValue} onChange={e => setDraft({ ...draft, bgValue: e.target.value })} className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400 font-mono text-sm" /></div>
                    : <input type="text" placeholder="https://..." value={draft.bgValue} onChange={e => setDraft({ ...draft, bgValue: e.target.value })} className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400" />}
                </section>
                <section>
                  <label className="block font-bold text-slate-300 mb-2">🎨 強調色</label>
                  <div className="flex items-center gap-3 mb-2">
                    <input type="color" value={draft.accentColor} onChange={e => setDraft({ ...draft, accentColor: e.target.value })} className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent" />
                    <input type="text" value={draft.accentColor} onChange={e => setDraft({ ...draft, accentColor: e.target.value })} className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400 font-mono text-sm" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['#facc15','#22d3ee','#34d399','#f472b6','#a78bfa','#fb923c','#ffffff'].map(c => (
                      <button key={c} onClick={() => setDraft({ ...draft, accentColor: c })} className="w-7 h-7 rounded-full border-2 border-slate-600 hover:scale-110 transition" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </section>
                <section>
                  <label className="block font-bold text-slate-300 mb-3">🔲 按鈕文字</label>
                  <div className="space-y-3">
                    {[...draft.buttons].sort((a,b) => a.order - b.order).map((btn, idx) => {
                      const Icon = getButtonIcon(btn.id);
                      return (
                        <div key={btn.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700 space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon size={13} style={{ color: draft.accentColor }} />
                            <span className="text-slate-400 text-xs uppercase tracking-widest font-bold flex-1">{btn.id}</span>
                            <button onClick={() => moveButton(idx, -1)} disabled={idx === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronUp size={13} /></button>
                            <button onClick={() => moveButton(idx, 1)} disabled={idx === draft.buttons.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronDown size={13} /></button>
                          </div>
                          <input type="text" value={btn.label} placeholder="按鈕名稱" onChange={e => { const btns = [...draft.buttons]; btns.find(b => b.id === btn.id).label = e.target.value; setDraft({ ...draft, buttons: btns }); }} className="w-full bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400 text-sm font-bold" />
                          <input type="text" value={btn.desc} placeholder="按鈕說明" onChange={e => { const btns = [...draft.buttons]; btns.find(b => b.id === btn.id).desc = e.target.value; setDraft({ ...draft, buttons: btns }); }} className="w-full bg-slate-900 text-white/60 px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400 text-sm" />
                        </div>
                      );
                    })}
                  </div>
                </section>
                <div className="border-t border-slate-700/60 pt-2">
                  <ChangePasswordSection accentColor={config.accentColor} />
                </div>
              </div>
              <div className="p-4 border-t border-slate-700 flex gap-3">
                <button onClick={resetAll} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold border border-slate-600 hover:border-red-400 hover:text-red-400 transition text-sm">全部重置</button>
                <button onClick={saveSettings} className="flex-1 py-2.5 rounded-xl font-black text-slate-900 transition hover:opacity-90 text-sm" style={{ backgroundColor: config.accentColor }}>儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════
  // 桌機版佈局（自由拖曳）
  // ════════════════════════════════
  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden relative font-sans select-none"
      style={bgStyle}
      translate="no"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchMove={onMouseMove}
      onTouchEnd={onMouseUp}
    >
      {/* 背景遮罩 */}
      {config.bgType === 'image' && <div className="absolute inset-0 bg-black/50 pointer-events-none" />}

      {/* ── 標題 ── */}
      <div
        style={draggableStyle('title')}
        onMouseDown={e => onDragStart(e, 'title')}
        onTouchStart={e => onDragStart(e, 'title')}
        className={editRing}
      >
        {editMode && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-400 text-[10px] font-bold whitespace-nowrap">✥ 標題</div>}
        <h1
          className="text-4xl md:text-6xl font-black italic tracking-tighter drop-shadow-lg whitespace-nowrap"
          style={{ color: config.accentColor }}
        >
          {config.title}
        </h1>
      </div>

      {/* ── 副標題 ── */}
      <div
        style={draggableStyle('subtitle')}
        onMouseDown={e => onDragStart(e, 'subtitle')}
        onTouchStart={e => onDragStart(e, 'subtitle')}
        className={editRing}
      >
        {editMode && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-400 text-[10px] font-bold whitespace-nowrap">✥ 副標題</div>}
        <p className="text-white/60 text-lg whitespace-nowrap">{config.subtitle}</p>
      </div>

      {/* ── 三個按鈕（各自可拖曳） ── */}
      {config.buttons.map(btn => {
        const Icon = getButtonIcon(btn.id);
        return (
          <div
            key={btn.id}
            style={draggableStyle(btn.id)}
            onMouseDown={e => onDragStart(e, btn.id)}
            onTouchStart={e => onDragStart(e, btn.id)}
            className={editRing}
          >
            {editMode && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-400 text-[10px] font-bold whitespace-nowrap">✥ {btn.label}</div>}
            <button
              onClick={() => {
                if (editMode) return;
                if (btn.id === 'operator') setGateTarget('operator');
                else if (btn.id === 'bracket_operator') setGateTarget('bracket_operator');
                else if (btn.id === 'scoreboard_operator') setGateTarget('scoreboard_operator');
                else onNavigate(btn.id);
              }}
              className={`flex flex-col items-center p-6 md:p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl transition-all group
                ${editMode ? 'pointer-events-none' : 'hover:bg-white/10'}`}
              style={{ minWidth: 160 }}
              onMouseEnter={e => { if (!editMode) e.currentTarget.style.borderColor = config.accentColor; }}
              onMouseLeave={e => { if (!editMode) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <Icon className="w-12 h-12 mb-3 transition-transform group-hover:scale-110" style={{ color: config.accentColor }} />
              {(btn.id === 'operator' || btn.id === 'bracket_operator' || btn.id === 'scoreboard_operator') && (
                <Lock size={13} className="absolute top-2 right-2 text-yellow-400 opacity-70" />
              )}
              <h2 className="text-lg font-black mb-1 text-white">{btn.label}</h2>
              <p className="text-white/50 text-xs text-center">{btn.desc}</p>
            </button>
          </div>
        );
      })}

      {/* ── 右上角工具列 ── */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {/* 編輯模式切換 */}
        <button
          onClick={() => {
            if (editMode) { setEditMode(false); }
            else { setGateTarget('editmode'); }
          }}
          className={`px-4 py-2 rounded-xl font-black text-sm border transition-all shadow-lg relative ${
            editMode
              ? 'bg-yellow-400 text-slate-900 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
          }`}
          title={editMode ? '完成拖曳' : '自由移動模式（需要密碼）'}
        >
          {!editMode && <Lock size={9} className="absolute top-1 right-1 text-yellow-400" />}
          {editMode ? '✓ 完成移動' : '✥ 自由移動'}
        </button>

        {/* 外觀設定 */}
        <button
          onClick={openSettings}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all relative"
          title="外觀設定（需要密碼）"
        >
          <Palette size={18} className="text-white" />
          <Lock size={9} className="absolute top-1 right-1 text-yellow-400" />
        </button>
      </div>

      {/* 編輯模式提示 */}
      {editMode && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 bg-yellow-400/90 text-slate-900 px-5 py-2 rounded-full font-black text-sm shadow-lg pointer-events-none">
          拖曳元素到任意位置 ── 完成後點「✓ 完成移動」
        </div>
      )}

      {/* ── 固定的對戰表 + 記分板按鈕（永遠顯示在左下角） ── */}
      {!editMode && (
        <div className="absolute bottom-5 left-5 z-40 flex gap-2 flex-wrap">
          <button
            onClick={() => setGateTarget('bracket_operator')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 text-white/70 hover:text-white text-xs font-bold transition-all backdrop-blur-sm relative"
          >
            <Trophy size={14} className="text-yellow-400" />
            對戰表控制台
            <Lock size={8} className="text-yellow-400" />
          </button>
          <button
            onClick={() => onNavigate('bracket_viewer')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 text-white/70 hover:text-white text-xs font-bold transition-all backdrop-blur-sm"
          >
            <Trophy size={14} className="text-blue-400" />
            對戰表展示
          </button>
          <button
            onClick={() => setGateTarget('scoreboard_operator')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 text-white/70 hover:text-white text-xs font-bold transition-all backdrop-blur-sm"
          >
            <Star size={14} className="text-yellow-400" />
            記分板控制台
            <Lock size={8} className="text-yellow-400" />
          </button>
          <button
            onClick={() => onNavigate('scoreboard_viewer')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 text-white/70 hover:text-white text-xs font-bold transition-all backdrop-blur-sm"
          >
            <Star size={14} className="text-blue-400" />
            記分板展示
          </button>
          <button
            onClick={() => onNavigate('lottery')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 text-white/70 hover:text-white text-xs font-bold transition-all backdrop-blur-sm"
          >
            🎰 抽獎系統
          </button>
        </div>
      )}

      {/* ══ 外觀設定側邊欄 ══ */}
      {settingsOpen && draft && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="w-full max-w-sm bg-[#0f172a] border-l border-slate-700 flex flex-col shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-black text-white flex items-center gap-2"><Palette size={18} className="text-yellow-400" /> 外觀設定</h2>
              <button onClick={() => setSettingsOpen(false)} className="p-1 text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="flex-1 p-6 space-y-6 text-sm overflow-y-auto">

              <section>
                <label className="block font-bold text-slate-300 mb-2">🏷 主標題文字</label>
                <input type="text" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400" />
              </section>

              <section>
                <label className="block font-bold text-slate-300 mb-2">💬 副標題文字</label>
                <input type="text" value={draft.subtitle} onChange={e => setDraft({ ...draft, subtitle: e.target.value })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400" />
              </section>

              <section>
                <label className="block font-bold text-slate-300 mb-2">🖼 背景</label>
                <div className="flex gap-2 mb-3">
                  {['color','image'].map(t => (
                    <button key={t} onClick={() => setDraft({ ...draft, bgType: t })}
                      className={`flex-1 py-1.5 rounded-lg border font-bold transition ${draft.bgType === t ? 'bg-yellow-400 text-slate-900 border-yellow-400' : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-yellow-400'}`}>
                      {t === 'color' ? '純色' : '圖片'}
                    </button>
                  ))}
                </div>
                {draft.bgType === 'color'
                  ? <div className="flex items-center gap-3">
                      <input type="color" value={draft.bgValue} onChange={e => setDraft({ ...draft, bgValue: e.target.value })} className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent" />
                      <input type="text" value={draft.bgValue} onChange={e => setDraft({ ...draft, bgValue: e.target.value })} className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400 font-mono" />
                    </div>
                  : <input type="text" placeholder="https://..." value={draft.bgValue} onChange={e => setDraft({ ...draft, bgValue: e.target.value })} className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400" />
                }
              </section>

              <section>
                <label className="block font-bold text-slate-300 mb-2">🎨 強調色</label>
                <div className="flex items-center gap-3 mb-2">
                  <input type="color" value={draft.accentColor} onChange={e => setDraft({ ...draft, accentColor: e.target.value })} className="w-12 h-10 rounded cursor-pointer border-0 bg-transparent" />
                  <input type="text" value={draft.accentColor} onChange={e => setDraft({ ...draft, accentColor: e.target.value })} className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400 font-mono" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['#facc15','#22d3ee','#34d399','#f472b6','#a78bfa','#fb923c','#ffffff'].map(c => (
                    <button key={c} onClick={() => setDraft({ ...draft, accentColor: c })}
                      className="w-7 h-7 rounded-full border-2 border-slate-600 hover:scale-110 transition" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </section>

              <section>
                <label className="block font-bold text-slate-300 mb-3">🔲 按鈕文字設定</label>
                <div className="space-y-3">
                  {[...draft.buttons].sort((a,b) => a.order - b.order).map((btn, idx) => {
                    const Icon = getButtonIcon(btn.id);
                    return (
                      <div key={btn.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={14} style={{ color: draft.accentColor }} />
                          <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">{btn.id}</span>
                          <div className="ml-auto flex gap-1">
                            <button onClick={() => moveButton(idx, -1)} disabled={idx === 0} className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"><ChevronUp size={14} /></button>
                            <button onClick={() => moveButton(idx, 1)} disabled={idx === draft.buttons.length - 1} className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"><ChevronDown size={14} /></button>
                          </div>
                        </div>
                        <input type="text" value={btn.label} placeholder="按鈕名稱"
                          onChange={e => { const btns = [...draft.buttons]; btns.find(b => b.id === btn.id).label = e.target.value; setDraft({ ...draft, buttons: btns }); }}
                          className="w-full bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400 text-sm font-bold" />
                        <input type="text" value={btn.desc} placeholder="按鈕說明"
                          onChange={e => { const btns = [...draft.buttons]; btns.find(b => b.id === btn.id).desc = e.target.value; setDraft({ ...draft, buttons: btns }); }}
                          className="w-full bg-slate-900 text-white/60 px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-yellow-400 text-sm" />
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-slate-400 text-xs leading-relaxed">
                  💡 <span className="text-yellow-400 font-bold">移動元素位置</span>：關閉此面板後，點右上角「<span className="text-yellow-400 font-bold">✥ 自由移動</span>」按鈕，即可用滑鼠拖曳每個元素到任意位置。
                </p>
              </section>

              {/* 分隔線 */}
              <div className="border-t border-slate-700/60 pt-2">
                <ChangePasswordSection accentColor={config.accentColor} />
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button onClick={resetAll} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold border border-slate-600 hover:border-red-400 hover:text-red-400 transition">
                全部重置
              </button>
              <button onClick={saveSettings} className="flex-1 py-2.5 rounded-xl font-black text-slate-900 transition hover:opacity-90" style={{ backgroundColor: config.accentColor }}>
                儲存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 密碼鎖 ── */}
      {gateTarget && (
        <PasswordGate
          target={gateTarget}
          onSuccess={() => {
            const t = gateTarget;
            setGateTarget(null);
            if (t === 'settings') openSettingsAfterAuth();
            if (t === 'operator') onNavigate('operator');
              if (t === 'bracket_operator') onNavigate('bracket_operator');
              if (t === 'scoreboard_operator') onNavigate('scoreboard_operator');
            if (t === 'editmode') setEditMode(true);
          }}
          onCancel={() => setGateTarget(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 模組一：多人連線 BP 房間（Firestore）
// ═══════════════════════════════════════════════════════════════════════════════

// 動態產生 pick 順序：先手隊伍先選
function makePickSequence(firstTeam) {
  const second = firstTeam === 'blue' ? 'red' : 'blue';
  return [
    { team: firstTeam, step: 1 },
    { team: second,    step: 1 },
    { team: second,    step: 2 },
    { team: firstTeam, step: 2 },
    { team: firstTeam, step: 3 },
    { team: second,    step: 3 },
  ];
}

const INITIAL_DRAFT_STATE = {
  phase: 'waiting',   // waiting → coinflip → ban → pick → done
  ready: { blue: false, red: false },
  coinWinner: null,   // 'blue' | 'red'
  banDeadline: null,
  bans: { blue: [], red: [] },
  picks: { blue: [], red: [] },
  pickStep: 0,
  turnDeadline: null,
  players: { blue: null, red: null }
};

const translations = {
  zh: {
    roomTitle: '多人連線 BP 房間', joinBlue: '加入藍方', joinRed: '加入紅方',
    blueReady: '藍方已準備', redReady: '紅方已準備', youBlue: '你 (藍方)', youRed: '你 (紅方)',
    leaveSeat: '離開座位', phaseDone: 'BP 階段已完成', phaseBan: '禁用階段',
    searchPlaceholder: '搜尋英雄名稱...', waitingBanSpectator: '雙方盲選禁用英雄中...',
    waitingBanPlayer: '等待對手完成禁用...', spectating: '你正在觀戰中',
    waitingBlue: '等待 藍方 選擇...', waitingRed: '等待 紅方 選擇...',
    blueBan: '藍方禁用', redBan: '紅方禁用', bluePickText: '藍方選擇', redPickText: '紅方選擇',
    picking: '預選中...', locked: '已鎖定', allDone: '所有階段已結束',
    spectatorCannot: '觀眾無法操作', waitOpponent: '請等待對手操作',
    selectBrawler: '請選擇英雄', confirmBan: '確認禁用 (BLIND BAN)', confirmPick: '確認鎖定 (PICK)',
    bluePickLabel: (step) => `藍方 選擇 ${step}`, redPickLabel: (step) => `紅方 選擇 ${step}`,
    waitingPhase: '等待雙方準備', clickReady: '✔ 我已準備好',
    waitingOpponentReady: '等待對手準備中...', youAreReady: '✔ 已準備，等待對手',
    spectatorWaitReady: '等待雙方玩家準備...',
    needBothPlayers: '等待雙方入座後才能準備',
    banTimeLeft: 'BAN 剩餘時間',
    coinflipPhase: '🪙 決定先手順序',
    coinBlueWins: '🔵 藍方先手！',
    coinRedWins: '🔴 紅方先手！',
    coinflipStarting: '即將開始 BAN 階段...',
  },
  en: {
    roomTitle: 'Draft Room', joinBlue: 'Join Blue', joinRed: 'Join Red',
    blueReady: 'Blue Ready', redReady: 'Red Ready', youBlue: 'You (Blue)', youRed: 'You (Red)',
    leaveSeat: 'Leave Seat', phaseDone: 'Draft Completed', phaseBan: 'Ban Phase',
    searchPlaceholder: 'Search Brawlers...', waitingBanSpectator: 'Blind banning in progress...',
    waitingBanPlayer: 'Waiting for opponent to ban...', spectating: 'You are spectating',
    waitingBlue: 'Waiting for Blue to pick...', waitingRed: 'Waiting for Red to pick...',
    blueBan: 'Blue Bans', redBan: 'Red Bans', bluePickText: 'Blue Pick', redPickText: 'Red Pick',
    picking: 'Picking...', locked: 'Locked', allDone: 'Draft is over',
    spectatorCannot: 'Spectators cannot interact', waitOpponent: 'Waiting for opponent',
    selectBrawler: 'Select a Brawler', confirmBan: 'Confirm Ban (BLIND BAN)', confirmPick: 'Lock In (PICK)',
    bluePickLabel: (step) => `Blue Pick ${step}`, redPickLabel: (step) => `Red Pick ${step}`,
    waitingPhase: 'Waiting for both players', clickReady: '✔ I am Ready',
    waitingOpponentReady: 'Waiting for opponent...', youAreReady: '✔ Ready! Waiting for opponent',
    spectatorWaitReady: 'Waiting for both players to ready up...',
    needBothPlayers: 'Both players must be seated first',
    banTimeLeft: 'Ban Timer',
    coinflipPhase: '🪙 Deciding Pick Order',
    coinBlueWins: '🔵 Blue Picks First!',
    coinRedWins: '🔴 Red Picks First!',
    coinflipStarting: 'Starting Ban Phase...',
  }
};

function getBrawlerName(brawler, lang) {
  if (!brawler) return '';
  if (lang === 'zh') return brawler.name;
  const exceptions = { '8bit': '8-Bit', 'el_primo': 'El Primo', 'mrp': 'Mr. P', 'larry_lawrie': 'Larry & Lawrie', 'rt': 'R-T', 'Jaeyoug': 'Jae-Yong' };
  if (exceptions[brawler.id]) return exceptions[brawler.id];
  return brawler.id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// 頭貼路徑：圖片放在 public/portraits/ 資料夾
function getPortrait(brawler) {
  if (!brawler) return null;
  const id = brawler.id.toLowerCase();
  return `/portraits/${id}_portrait.png`;
}

function UltraLegendarySparkle() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1 left-1 animate-ping bg-white w-1 h-1 rounded-full opacity-70"></div>
      <div className="absolute bottom-2 right-2 animate-pulse bg-pink-200 w-1.5 h-1.5 rounded-full opacity-80"></div>
    </div>
  );
}

function BanSlot({ brawler, isCurrentTurn, isPreview, selectedBrawler, team, isHidden, lang }) {
  const displayBrawler = brawler || (isPreview ? selectedBrawler : null);
  const displayName = getBrawlerName(displayBrawler, lang);
  const shortName = lang === 'zh' ? displayName.substring(0, 2) : displayName.substring(0, 3).toUpperCase();
  const portrait = getPortrait(displayBrawler);

  return (
    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 transition-all duration-300
      ${isCurrentTurn ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] scale-110 z-10' : (team === 'blue' ? 'border-blue-900/50' : 'border-red-900/50')}
      bg-slate-950 overflow-hidden relative flex items-center justify-center`}
    >
      {isHidden && brawler ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <EyeOff className="text-slate-500 opacity-80" size={24} />
        </div>
      ) : displayBrawler ? (
        <div className={`absolute inset-0 flex items-center justify-center ${RARITY_BG[displayBrawler.rarity]} ${isPreview ? 'opacity-60 saturate-50' : 'opacity-100 grayscale'}`}>
          {portrait
            ? <img src={portrait} alt={displayName} className="w-full h-full object-cover object-top" />
            : <span className="font-black text-[10px] md:text-sm z-10 drop-shadow-md tracking-tighter">{shortName}</span>
          }
          {displayBrawler.rarity === 'ultra_legendary' && <UltraLegendarySparkle />}
          {!isPreview && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-full h-1 bg-red-600 rotate-45 absolute shadow-[0_0_8px_rgba(0,0,0,0.9)]"></div>
            </div>
          )}
        </div>
      ) : <ShieldX className="text-slate-700 opacity-50" size={20} />}
    </div>
  );
}

function PickSlot({ brawler, isCurrentTurn, isPreview, selectedBrawler, team, lang, t }) {
  const displayBrawler = brawler || (isPreview ? selectedBrawler : null);
  const displayName = getBrawlerName(displayBrawler, lang);
  const portrait = getPortrait(displayBrawler);

  return (
    <div className={`h-24 lg:h-44 flex-1 lg:w-full rounded-2xl border-2 transition-all duration-300
      ${isCurrentTurn ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] scale-[1.03] z-10' : 'border-slate-800'}
      ${team === 'blue' ? 'bg-blue-950/20' : 'bg-red-950/20'}
      overflow-hidden relative flex items-center justify-center`}
    >
      {!displayBrawler && (
        <span className={`text-xl lg:text-2xl font-black opacity-30 ${team === 'blue' ? 'text-blue-500' : 'text-red-500'}`}>
          {team === 'blue' ? t.bluePickText : t.redPickText}
        </span>
      )}
      {displayBrawler && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${RARITY_BG[displayBrawler.rarity]} ${isPreview ? 'opacity-70 saturate-50' : 'opacity-100'}`}>
          {displayBrawler.rarity === 'ultra_legendary' && <UltraLegendarySparkle />}
          {portrait && (
            <img src={portrait} alt={displayName}
              className="absolute inset-0 w-full h-full object-cover object-top opacity-90"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm py-1 px-2 z-10 text-center">
            <span className={`font-black drop-shadow-md ${lang === 'en' ? 'text-xs lg:text-sm' : 'text-xs lg:text-base'} text-white`}>{displayName}</span>
            <div className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest opacity-70 text-white">
              {isPreview ? t.picking : t.locked}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 拋硬幣動畫元件（純渲染，無 hooks）──────────────────────────────────────
function CoinFlipOverlay({ coinWinner, stage, t }) {
  const finalDeg = coinWinner === 'blue' ? 1440 : 1620;
  return (
    <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md rounded-3xl flex items-center justify-center flex-col gap-8">
      <style>{`
        @keyframes coinFlip {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(${finalDeg}deg); }
        }
        .coin-flip-anim { animation: coinFlip 3s cubic-bezier(0.25,0.46,0.45,0.94) forwards; transform-style: preserve-3d; }
        .coin-static    { transform: rotateY(${finalDeg}deg); transform-style: preserve-3d; }
        .face           { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .face-back      { transform: rotateY(180deg); }
        @keyframes glowBlue { 0%,100%{box-shadow:0 0 40px rgba(59,130,246,0.6),0 0 80px rgba(59,130,246,0.3)} 50%{box-shadow:0 0 70px rgba(59,130,246,0.9),0 0 120px rgba(59,130,246,0.5)} }
        @keyframes glowRed  { 0%,100%{box-shadow:0 0 40px rgba(239,68,68,0.6),0 0 80px rgba(239,68,68,0.3)} 50%{box-shadow:0 0 70px rgba(239,68,68,0.9),0 0 120px rgba(239,68,68,0.5)} }
        .glow-blue { animation: glowBlue 1.2s ease-in-out infinite; }
        .glow-red  { animation: glowRed  1.2s ease-in-out infinite; }
        @keyframes resultPop { 0%{transform:scale(0.4) translateY(16px);opacity:0} 65%{transform:scale(1.12) translateY(-3px);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }
        .result-pop { animation: resultPop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      <p className="text-yellow-400/80 font-black tracking-[0.3em] text-xs uppercase">{t.coinflipPhase}</p>

      <div style={{ perspective: 600 }}>
        <div className={stage === 'spinning' ? 'coin-flip-anim' : 'coin-static'}
          style={{ width: 160, height: 160, position: 'relative' }}>
          {/* 正面：藍 */}
          <div className="face" style={{ position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(circle at 35% 30%,#60a5fa,#1d4ed8)',boxShadow:'inset 0 4px 15px rgba(255,255,255,0.3),inset 0 -4px 10px rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:4 }}>
            <div style={{ position:'absolute',inset:10,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.5)' }} />
            <span style={{ fontSize:56,lineHeight:1,filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>🔵</span>
            <span style={{ fontSize:11,fontWeight:900,color:'rgba(255,255,255,0.85)',letterSpacing:'0.15em' }}>BLUE</span>
          </div>
          {/* 背面：紅 */}
          <div className="face face-back" style={{ position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(circle at 35% 30%,#f87171,#b91c1c)',boxShadow:'inset 0 4px 15px rgba(255,255,255,0.3),inset 0 -4px 10px rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:4 }}>
            <div style={{ position:'absolute',inset:10,borderRadius:'50%',border:'3px solid rgba(255,255,255,0.5)' }} />
            <span style={{ fontSize:56,lineHeight:1,filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>🔴</span>
            <span style={{ fontSize:11,fontWeight:900,color:'rgba(255,255,255,0.85)',letterSpacing:'0.15em' }}>RED</span>
          </div>
        </div>
        <div style={{ margin:'8px auto 0',width:90,height:14,borderRadius:'50%',background:'rgba(0,0,0,0.45)',filter:'blur(8px)' }} />
      </div>

      <div style={{ minHeight:72,display:'flex',alignItems:'center',justifyContent:'center' }}>
        {stage === 'result' ? (
          <div className={`result-pop text-center ${coinWinner === 'blue' ? 'glow-blue' : 'glow-red'}`}
            style={{ padding:'16px 32px',borderRadius:20,background:'rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:36,fontWeight:900,letterSpacing:'0.05em',color:coinWinner==='blue'?'#60a5fa':'#f87171' }}>
              {coinWinner === 'blue' ? t.coinBlueWins : t.coinRedWins}
            </div>
            <p className="animate-pulse" style={{ color:'rgba(148,163,184,0.8)',fontSize:13,fontWeight:700,marginTop:8 }}>
              {t.coinflipStarting}
            </p>
          </div>
        ) : (
          <p className="animate-pulse" style={{ color:'rgba(100,116,139,0.7)',fontSize:13,fontWeight:700,letterSpacing:'0.15em' }}>
            🪙 決定中...
          </p>
        )}
      </div>
    </div>
  );
}

function MultiplayerBPRoom({ onBack }) {
  const [lang, setLang] = useState('zh');
  const t = translations[lang];
  const [user, setUser] = useState(null);
  const [draftState, setDraftState] = useState(null);
  const [myRole, setMyRole] = useState('spectator');
  const [selectedBrawler, setSelectedBrawler] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [banTimeLeft, setBanTimeLeft] = useState(null);
  const [resetGate, setResetGate] = useState(false);
  const [coinStage, setCoinStage] = useState('spinning');
  const draftStateRef = useRef(null);
  const idleTimerRef = useRef(null);
  const banAudioRef  = useRef(null);
  const pickAudioRef = useRef(null);

  // 預載音效（只在瀏覽器環境執行）
  useEffect(() => {
    try {
      banAudioRef.current  = new Audio('/ban階段.mp3');
      pickAudioRef.current = new Audio('/pick階段.mp3');
      banAudioRef.current.loop  = true;
      pickAudioRef.current.loop = true;
    } catch(e) { console.warn('Audio init failed', e); }
    return () => {
      try { banAudioRef.current?.pause(); pickAudioRef.current?.pause(); } catch(e) {}
    };
  }, []);

  // ── 衍生狀態（必須在所有 useEffect 之前宣告，避免 TDZ） ──
  const isDone = draftState?.phase === 'done';
  const phase = draftState?.phase;
  const bans = draftState?.bans || { blue: [], red: [] };
  const picks = draftState?.picks || { blue: [], red: [] };
  const pickStep = draftState?.pickStep || 0;
  const turnDeadline = draftState?.turnDeadline;
  const players = draftState?.players || { blue: null, red: null };
  const ready = draftState?.ready || { blue: false, red: false };
  const coinWinner = draftState?.coinWinner || 'blue';
  const bothSeated = !!(players.blue && players.red);
  const iAmReady = myRole !== 'spectator' && ready[myRole];

  // 根據硬幣結果動態決定選角順序
  const pickSequence = makePickSequence(coinWinner);

  const currentStepInfo = isDone ? null
    : phase === 'waiting'  ? { type: 'waiting',  label: t.waitingPhase }
    : phase === 'coinflip' ? { type: 'coinflip', label: t.coinflipPhase }
    : phase === 'ban'      ? { type: 'ban',       label: t.phaseBan }
    : {
        ...pickSequence[pickStep],
        label: pickSequence[pickStep].team === 'blue'
          ? t.bluePickLabel(pickSequence[pickStep].step)
          : t.redPickLabel(pickSequence[pickStep].step),
      };

  const isMyTurn = phase === 'ban'
    ? (myRole !== 'spectator' && bans[myRole]?.length < 3)
    : (phase === 'pick' && currentStepInfo?.team === myRole);

  // 根據階段切換音效
  useEffect(() => {
    const banAudio  = banAudioRef.current;
    const pickAudio = pickAudioRef.current;
    if (!banAudio || !pickAudio) return;
    try {
      if (phase === 'ban') {
        pickAudio.pause(); pickAudio.currentTime = 0;
        banAudio.currentTime = 0;
        banAudio.play().catch(() => {});
      } else if (phase === 'pick') {
        banAudio.pause(); banAudio.currentTime = 0;
        pickAudio.currentTime = 0;
        pickAudio.play().catch(() => {});
      } else {
        banAudio.pause();  banAudio.currentTime = 0;
        pickAudio.pause(); pickAudio.currentTime = 0;
      }
    } catch(e) {}
  }, [phase]);

  useEffect(() => { draftStateRef.current = draftState; }, [draftState]);

  useEffect(() => {
    if (myRole !== 'blue' && myRole !== 'red') {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }
    const kickIdlePlayer = async () => {
      const currentDraft = draftStateRef.current;
      if (!currentDraft || !user) return;
      let roleToKick = null;
      if (currentDraft.players.blue === user.uid) roleToKick = 'blue';
      if (currentDraft.players.red === user.uid) roleToKick = 'red';
      if (roleToKick) {
        const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'draft_rooms', 'global_draft');
        await setDoc(roomRef, { ...currentDraft, players: { ...currentDraft.players, [roleToKick]: null } });
        alert(lang === 'zh' ? '因閒置超過 3 分鐘，已自動將您移出座位。' : 'You have been removed from the seat due to 3 minutes of inactivity.');
      }
    };
    const resetTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(kickIdlePlayer, 3 * 60 * 1000);
    };
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [myRole, user, lang]);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error('Auth error:', err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'draft_rooms', 'global_draft');
    const unsub = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const raw = docSnap.data();
        if (!raw.phase) {
          setDoc(roomRef, INITIAL_DRAFT_STATE);
        } else {
          // 正規化資料：確保新欄位在舊文件上也有預設值
          const data = {
            ...INITIAL_DRAFT_STATE,
            ...raw,
            ready:  { blue: false, red: false, ...(raw.ready  || {}) },
            bans:   { blue: [],    red: [],    ...(raw.bans   || {}) },
            picks:  { blue: [],    red: [],    ...(raw.picks  || {}) },
            players: { blue: null, red: null,  ...(raw.players || {}) },
          };
          setDraftState(data);
          if (data.players.blue === user.uid) setMyRole('blue');
          else if (data.players.red === user.uid) setMyRole('red');
          else setMyRole('spectator');
        }
      } else {
        setDoc(roomRef, INITIAL_DRAFT_STATE);
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!isMyTurn) { setSelectedBrawler(null); setSearchTerm(''); }
  }, [isMyTurn]);

  const lockedBrawlers = useMemo(() => {
    if (!draftState) return [];
    if (phase === 'ban') {
      if (myRole === 'spectator') return [];
      return bans[myRole].map(b => b.id);
    } else {
      const allIds = [...bans.blue, ...bans.red, ...picks.blue, ...picks.red].map(b => b?.id).filter(Boolean);
      return [...new Set(allIds)];
    }
  }, [phase, bans, picks, myRole, draftState]);

  const filteredBrawlers = useMemo(() =>
    BRAWLERS.filter(b => b.name.includes(searchTerm) || getBrawlerName(b, 'en').toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  useEffect(() => {
    if (phase !== 'pick' || !turnDeadline || isDone) { setTimeLeft(null); return; }
    const interval = setInterval(async () => {
      const remaining = Math.max(0, Math.ceil((turnDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        const currentDraft = draftStateRef.current;
        const currentCoinWinner = currentDraft.coinWinner || 'blue';
        const currentPickSeq = makePickSequence(currentCoinWinner);
        const currentIsMyTurn = currentDraft.phase === 'pick' && currentPickSeq[currentDraft.pickStep].team === myRole;
        if (currentIsMyTurn) {
          const lockedIds = [...currentDraft.bans.blue, ...currentDraft.bans.red, ...currentDraft.picks.blue, ...currentDraft.picks.red].map(b => b?.id).filter(Boolean);
          const available = BRAWLERS.filter(b => !lockedIds.includes(b.id));
          const randomBrawler = available[Math.floor(Math.random() * available.length)];
          const newMyPicks = [...currentDraft.picks[myRole], randomBrawler];
          const newPickStep = currentDraft.pickStep + 1;
          const done = newPickStep >= currentPickSeq.length;
          const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'draft_rooms', 'global_draft');
          await updateDoc(roomRef, {
            [`picks.${myRole}`]: newMyPicks,
            pickStep: newPickStep,
            ...(done ? { phase: 'done', turnDeadline: null } : { turnDeadline: Date.now() + 40000 }),
          });
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [phase, turnDeadline, isDone, myRole]);

  // ── 硬幣動畫 + 自動進入 ban ──
  useEffect(() => {
    if (phase !== 'coinflip') return;
    setCoinStage('spinning');
    const deadline = draftState?.coinflipDeadline;
    if (!deadline) return;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return;
    // 3.2秒後揭曉結果
    const t1 = setTimeout(() => setCoinStage('result'), 3200);
    // deadline 後進入 ban 階段
    const t2 = setTimeout(async () => {
      const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'draft_rooms', 'global_draft');
      await updateDoc(roomRef, { phase: 'ban', banDeadline: Date.now() + 40000 });
    }, remaining);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, draftState?.coinflipDeadline]);

  // ── 禁用階段倒數計時 ──
  useEffect(() => {
    const banDeadline = draftState?.banDeadline;
    if (phase !== 'ban' || !banDeadline || isDone) { setBanTimeLeft(null); return; }

    const interval = setInterval(async () => {
      const remaining = Math.max(0, Math.ceil((banDeadline - Date.now()) / 1000));
      setBanTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        const currentDraft = draftStateRef.current;
        if (!currentDraft || currentDraft.phase !== 'ban') return;

        // 自動幫還沒完成 ban 的隊伍隨機選
        const newState = { ...currentDraft };
        let changed = false;
        for (const team of ['blue', 'red']) {
          while (newState.bans[team].length < 3) {
            const lockedIds = [...newState.bans.blue, ...newState.bans.red].map(b => b?.id).filter(Boolean);
            const available = BRAWLERS.filter(b => !lockedIds.includes(b.id));
            const pick = available[Math.floor(Math.random() * available.length)];
            newState.bans[team] = [...newState.bans[team], pick];
            changed = true;
          }
        }
        if (changed) {
          const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'draft_rooms', 'global_draft');
          await updateDoc(roomRef, {
            'bans.blue': newState.bans.blue,
            'bans.red':  newState.bans.red,
            phase: 'pick',
            pickStep: 0,
            banDeadline: null,
            turnDeadline: Date.now() + 40000,
          });
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [phase, draftState?.banDeadline, isDone]);

  if (!draftState || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-300 font-bold text-xl">
        <div className="animate-spin mr-3 border-4 border-slate-600 border-t-yellow-400 rounded-full w-8 h-8"></div>
        {lang === 'zh' ? '連線至雲端對戰房間...' : 'Connecting to Draft Room...'}
      </div>
    );
  }

  const joinTeam = async (team) => {
    if (players[team]) return;
    const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'draft_rooms', 'global_draft');
    await updateDoc(roomRef, { [`players.${team}`]: user.uid });
  };
  const leaveTeam = async () => {
    if (myRole === 'spectator') return;
    const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'draft_rooms', 'global_draft');
    await updateDoc(roomRef, {
      [`players.${myRole}`]: null,
      [`ready.${myRole}`]: false,
      phase: 'waiting',
      banDeadline: null,
      coinWinner: null,
      coinflipDeadline: null,
    });
  };
  const handleReady = async () => {
    if (myRole === 'spectator' || !bothSeated || phase !== 'waiting') return;
    const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'draft_rooms', 'global_draft');
    const newReady = { ...ready, [myRole]: true };
    if (newReady.blue && newReady.red) {
      // 雙方都準備 → 進入拋硬幣階段，隨機決定先手
      const winner = Math.random() < 0.5 ? 'blue' : 'red';
      await updateDoc(roomRef, {
        ready: newReady,
        phase: 'coinflip',
        coinWinner: winner,
        coinflipDeadline: Date.now() + 5000, // 5秒動畫後自動進入 ban
      });
    } else {
      await updateDoc(roomRef, { ready: newReady });
    }
  };

  const handleConfirm = async () => {
    if (!selectedBrawler || isDone || !isMyTurn) return;
    const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'draft_rooms', 'global_draft');

    if (phase === 'ban') {
      const newMyBans = [...bans[myRole], selectedBrawler];
      const otherBans = myRole === 'blue' ? bans.red : bans.blue;
      const allDone = newMyBans.length === 3 && otherBans.length === 3;
      const update = {
        [`bans.${myRole}`]: newMyBans,
        ...(allDone ? { phase: 'pick', pickStep: 0, turnDeadline: Date.now() + 40000, banDeadline: null } : {}),
      };
      await updateDoc(roomRef, update);

    } else if (phase === 'pick') {
      const newMyPicks = [...picks[myRole], selectedBrawler];
      const newPickStep = pickStep + 1;
      const done = newPickStep >= pickSequence.length;
      await updateDoc(roomRef, {
        [`picks.${myRole}`]: newMyPicks,
        pickStep: newPickStep,
        ...(done ? { phase: 'done', turnDeadline: null } : { turnDeadline: Date.now() + 40000 }),
      });
    }
    setSelectedBrawler(null); setSearchTerm('');
  };

  const handleReset = async () => {
    const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'draft_rooms', 'global_draft');
    await setDoc(roomRef, INITIAL_DRAFT_STATE);
    setSelectedBrawler(null); setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-2 md:p-6 font-sans flex flex-col" translate="no">
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:#0f172a;border-radius:4px}.custom-scrollbar::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#475569}`}</style>

      {/* 頂部控制列 */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition">
            <Home size={18} />
          </button>
          <Users size={24} className="text-slate-400" />
          <span className="font-bold text-slate-300 hidden sm:block">{t.roomTitle}</span>
          <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-1.5 ml-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 border border-slate-700 transition-colors">
            <Globe size={14} />{lang === 'zh' ? 'English' : '中文'}
          </button>
        </div>
        <div className="flex flex-1 justify-end sm:justify-center gap-2 md:gap-4 text-sm md:text-base font-bold">
          <button onClick={() => joinTeam('blue')} disabled={players.blue || myRole !== 'spectator'}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border transition-all ${players.blue ? (myRole === 'blue' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-blue-950/50 border-blue-900 text-blue-500 opacity-50') : 'bg-slate-800 border-blue-600/50 text-blue-400 hover:bg-blue-900/50'}`}>
            <User size={18} />
            <span className="hidden sm:inline">{players.blue ? (myRole === 'blue' ? t.youBlue : t.blueReady) : t.joinBlue}</span>
            <span className="sm:hidden">{players.blue ? (myRole === 'blue' ? '✓' : '✗') : 'Blue'}</span>
          </button>
          <ArrowRightLeft className="text-slate-600 self-center hidden md:block" />
          <button onClick={() => joinTeam('red')} disabled={players.red || myRole !== 'spectator'}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border transition-all ${players.red ? (myRole === 'red' ? 'bg-red-600 border-red-400 text-white' : 'bg-red-950/50 border-red-900 text-red-500 opacity-50') : 'bg-slate-800 border-red-600/50 text-red-400 hover:bg-red-900/50'}`}>
            <User size={18} />
            <span className="hidden sm:inline">{players.red ? (myRole === 'red' ? t.youRed : t.redReady) : t.joinRed}</span>
            <span className="sm:hidden">{players.red ? (myRole === 'red' ? '✓' : '✗') : 'Red'}</span>
          </button>
        </div>
        {myRole !== 'spectator' && (
          <button onClick={leaveTeam} className="text-xs text-slate-400 hover:text-white underline px-2">{t.leaveSeat}</button>
        )}
      </div>

      {/* 標題與狀態 */}
      <div className="text-center mb-6 relative">
        <h1 className="text-3xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4 tracking-tighter drop-shadow-lg">
          BRAWL STARS DRAFT
        </h1>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className={`px-6 py-2 md:py-3 rounded-full font-black text-lg md:text-xl tracking-wider transition-all duration-500
            ${isDone ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              : phase === 'waiting'  ? 'bg-gradient-to-r from-slate-600 to-slate-700 border border-slate-500/40'
              : phase === 'coinflip' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 shadow-[0_0_25px_rgba(234,179,8,0.5)] border border-yellow-300/30'
              : phase === 'ban'      ? 'bg-gradient-to-r from-purple-700 to-indigo-800 shadow-[0_0_25px_rgba(79,70,229,0.5)] border border-indigo-400/30'
              : currentStepInfo?.team === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-800 shadow-[0_0_25px_rgba(37,99,235,0.6)] border border-blue-400/30'
              : 'bg-gradient-to-r from-red-600 to-red-800 shadow-[0_0_25px_rgba(220,38,38,0.6)] border border-red-400/30'}`}>
            {isDone ? t.phaseDone : currentStepInfo?.label}
          </div>

          {/* Ban 階段倒數 */}
          {phase === 'ban' && banTimeLeft !== null && (
            <div className={`px-4 py-2 md:py-3 rounded-full font-black text-xl flex items-center gap-2 border-2 shadow-lg transition-colors
              ${banTimeLeft <= 10 ? 'bg-red-950/90 border-red-500 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-900 border-purple-500 text-purple-300'}`}>
              <span>⏱</span>
              <span className="font-mono">{banTimeLeft}s</span>
            </div>
          )}

          {phase === 'pick' && timeLeft !== null && (
            <div className={`px-4 py-2 md:py-3 rounded-full font-black text-xl flex items-center gap-2 border-2 shadow-lg transition-colors
              ${timeLeft <= 10 ? 'bg-red-950/90 border-red-500 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-900 border-yellow-500 text-yellow-400'}`}>
              <span>⏱</span><span className="font-mono">{timeLeft}s</span>
            </div>
          )}
          <button onClick={() => setResetGate(true)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors shadow-lg hover:rotate-180 duration-500 relative">
            <RotateCcw size={22} />
            <Lock size={9} className="absolute top-1 right-1 text-yellow-400" />
          </button>
        </div>
      </div>

      {/* 重置密碼鎖 */}
      {resetGate && (
        <PasswordGate
          target="reset"
          onSuccess={() => { setResetGate(false); handleReset(); }}
          onCancel={() => setResetGate(false)}
        />
      )}

      {/* BP 結算畫面 */}
      {isDone && (
        <BPResultsOverlay
          picks={picks}
          bans={bans}
          lang={lang}
          t={t}
          coinWinner={coinWinner}
          onReset={() => setResetGate(true)}
        />
      )}

      {/* 禁用區塊 */}
      <div className="flex justify-between items-center mb-6 bg-slate-900/60 p-4 md:p-5 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col items-start gap-2">
          <span className="text-blue-400 font-bold text-xs md:text-sm tracking-widest bg-blue-900/30 px-3 py-1 rounded-full border border-blue-900/50">{t.blueBan}</span>
          <div className="flex gap-2 md:gap-3">
            {[0, 1, 2].map(i => (
              <BanSlot key={i} brawler={bans.blue[i]} team="blue" lang={lang}
                isHidden={phase === 'ban' && myRole !== 'blue'}
                isCurrentTurn={phase === 'ban' && myRole === 'blue' && bans.blue.length === i}
                isPreview={phase === 'ban' && myRole === 'blue' && bans.blue.length === i && selectedBrawler !== null}
                selectedBrawler={selectedBrawler} />
            ))}
          </div>
        </div>
        <div className="hidden md:flex text-slate-600 font-black tracking-[0.5em] text-2xl mx-4">BANS</div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-red-400 font-bold text-xs md:text-sm tracking-widest bg-red-900/30 px-3 py-1 rounded-full border border-red-900/50">{t.redBan}</span>
          <div className="flex gap-2 md:gap-3">
            {[0, 1, 2].map(i => (
              <BanSlot key={i} brawler={bans.red[i]} team="red" lang={lang}
                isHidden={phase === 'ban' && myRole !== 'red'}
                isCurrentTurn={phase === 'ban' && myRole === 'red' && bans.red.length === i}
                isPreview={phase === 'ban' && myRole === 'red' && bans.red.length === i && selectedBrawler !== null}
                selectedBrawler={selectedBrawler} />
            ))}
          </div>
        </div>
      </div>

      {/* 核心選擇區 */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 h-full min-h-[500px]">
        <div className="order-2 lg:order-1 flex flex-row lg:flex-col gap-3 lg:gap-5 w-full lg:w-1/4 bg-slate-900/40 p-3 rounded-3xl border border-slate-800/50">
          {[0, 1, 2].map(i => (
            <PickSlot key={i} team="blue" brawler={picks.blue[i]} lang={lang} t={t}
              isCurrentTurn={phase === 'pick' && currentStepInfo?.team === 'blue' && picks.blue.length === i}
              isPreview={phase === 'pick' && currentStepInfo?.team === 'blue' && picks.blue.length === i && selectedBrawler !== null && myRole === 'blue'}
              selectedBrawler={selectedBrawler} />
          ))}
        </div>

        <div className="order-1 lg:order-2 flex-1 flex flex-col bg-slate-900/60 rounded-3xl border border-slate-800 p-4 lg:p-6 shadow-2xl backdrop-blur-sm relative">
          {/* Coinflip 動畫覆蓋 */}
          {phase === 'coinflip' && (
            <CoinFlipOverlay coinWinner={coinWinner} stage={coinStage} t={t} />
          )}

          {/* Waiting 階段：準備畫面覆蓋 */}
          {phase === 'waiting' && (
            <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-[3px] rounded-3xl flex items-center justify-center flex-col gap-5">
              <div className="bg-slate-900/95 border border-slate-700 px-8 py-8 rounded-3xl shadow-2xl flex flex-col items-center gap-5 min-w-[280px]">
                <h2 className="text-2xl font-black text-white tracking-wider">
                  {t.waitingPhase}
                </h2>

                {/* 雙方準備狀態 */}
                <div className="flex gap-6 w-full justify-center">
                  {['blue','red'].map(team => (
                    <div key={team} className={`flex flex-col items-center gap-2 px-5 py-3 rounded-2xl border-2 transition-all
                      ${ready[team]
                        ? (team === 'blue' ? 'bg-blue-900/40 border-blue-400' : 'bg-red-900/40 border-red-400')
                        : 'bg-slate-800/60 border-slate-700'}`}>
                      <div className={`text-2xl font-black ${team === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                        {team === 'blue' ? '🔵' : '🔴'}
                      </div>
                      <div className={`text-xs font-bold tracking-widest ${team === 'blue' ? 'text-blue-300' : 'text-red-300'}`}>
                        {team === 'blue' ? (lang === 'zh' ? '藍方' : 'BLUE') : (lang === 'zh' ? '紅方' : 'RED')}
                      </div>
                      <div className={`text-sm font-black ${ready[team] ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {players[team]
                          ? (ready[team] ? '✔ 已準備' : '⏳ 未準備')
                          : (lang === 'zh' ? '空位' : 'Empty')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 準備按鈕 */}
                {myRole !== 'spectator' && (
                  <button
                    onClick={handleReady}
                    disabled={iAmReady || !bothSeated}
                    className={`w-full py-4 rounded-2xl font-black text-xl tracking-wider transition-all shadow-xl
                      ${iAmReady
                        ? 'bg-emerald-700/60 text-emerald-300 border border-emerald-600 cursor-not-allowed'
                        : !bothSeated
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : myRole === 'blue'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                            : 'bg-gradient-to-r from-red-500 to-red-700 text-white hover:scale-[1.02] shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}
                  >
                    {iAmReady ? t.youAreReady : !bothSeated ? t.needBothPlayers : t.clickReady}
                  </button>
                )}

                {myRole === 'spectator' && (
                  <p className="text-slate-400 font-bold text-sm">{t.spectatorWaitReady}</p>
                )}
              </div>
            </div>
          )}

          {!isMyTurn && !isDone && phase !== 'waiting' && phase !== 'coinflip' && (
            <div className="absolute inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] rounded-3xl flex items-center justify-center flex-col pointer-events-none">
              <div className="bg-slate-900/90 border border-slate-700 px-8 py-5 rounded-2xl shadow-2xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                <span className="font-bold text-xl text-white tracking-widest text-center">
                  {phase === 'ban'
                    ? (myRole === 'spectator' ? t.waitingBanSpectator : t.waitingBanPlayer)
                    : (myRole === 'spectator' ? t.spectating : (currentStepInfo?.team === 'blue' ? t.waitingBlue : t.waitingRed))}
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 mb-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder={t.searchPlaceholder} value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} disabled={isDone || !isMyTurn || phase === 'waiting' || phase === 'coinflip'}
                className="w-full bg-slate-950 text-white pl-12 pr-4 py-4 rounded-2xl border border-slate-700 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all font-bold disabled:opacity-50" />
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 content-start max-h-[40vh] lg:max-h-[50vh]">
            {filteredBrawlers.map(brawler => {
              const isLocked = lockedBrawlers.includes(brawler.id);
              const isSelected = selectedBrawler?.id === brawler.id;
              const isUltra = brawler.rarity === 'ultra_legendary';
              const displayName = getBrawlerName(brawler, lang);
              const portrait = getPortrait(brawler);
              return (
                <button key={brawler.id} disabled={isLocked || isDone || !isMyTurn}
                  onClick={() => setSelectedBrawler(brawler)}
                  className={`relative p-0 rounded-xl lg:rounded-2xl border-2 flex flex-col items-end justify-end h-20 md:h-24 transition-all overflow-hidden group
                    ${isLocked ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:scale-105 active:scale-95 cursor-pointer hover:shadow-lg'}
                    ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.5)] z-10 scale-105' : 'border-slate-800'}`}>
                  {/* 稀有度底色 */}
                  <div className={`absolute inset-0 ${RARITY_BG[brawler.rarity]}`} />
                  {/* 頭貼 */}
                  {portrait && <img src={portrait} alt={displayName} className="absolute inset-0 w-full h-full object-cover object-top" />}
                  {isUltra && <UltraLegendarySparkle />}
                  {/* 名字條 */}
                  <div className="relative z-10 w-full bg-black/55 backdrop-blur-sm text-center py-0.5 px-1">
                    <span className={`font-bold text-white drop-shadow-md leading-tight block ${lang === 'en' ? 'text-[7px] md:text-[9px]' : 'text-[9px] md:text-[11px]'}`}>{displayName}</span>
                  </div>
                  {isLocked && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-20 backdrop-blur-[1px]">
                      <Check className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" size={32} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={handleConfirm} disabled={!selectedBrawler || isDone || !isMyTurn || phase === 'waiting' || phase === 'coinflip'}
            className={`mt-5 w-full py-4 lg:py-5 rounded-2xl font-black text-xl lg:text-2xl transition-all shadow-xl z-10 relative
              ${isDone || !isMyTurn || phase === 'waiting' ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : !selectedBrawler ? 'bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-700'
              : phase === 'ban' ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:scale-[1.02] shadow-[0_0_20px_rgba(225,29,72,0.4)]'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:scale-[1.02] shadow-[0_0_20px_rgba(250,204,21,0.4)]'}`}>
            {isDone ? t.allDone : myRole === 'spectator' ? t.spectatorCannot : !isMyTurn ? t.waitOpponent : !selectedBrawler ? t.selectBrawler : (phase === 'ban' ? t.confirmBan : t.confirmPick)}
          </button>
        </div>

        <div className="order-3 flex flex-row lg:flex-col gap-3 lg:gap-5 w-full lg:w-1/4 bg-slate-900/40 p-3 rounded-3xl border border-slate-800/50">
          {[0, 1, 2].map(i => (
            <PickSlot key={i} team="red" brawler={picks.red[i]} lang={lang} t={t}
              isCurrentTurn={phase === 'pick' && currentStepInfo?.team === 'red' && picks.red.length === i}
              isPreview={phase === 'pick' && currentStepInfo?.team === 'red' && picks.red.length === i && selectedBrawler !== null && myRole === 'red'}
              selectedBrawler={selectedBrawler} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BPResultsOverlay({ picks, bans, lang, t, coinWinner, onReset }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const blueColor = '#3b82f6';
  const redColor  = '#ef4444';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)' }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200%  center; }
        }
        .result-slide { animation: slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .result-slide-1 { animation: slideUp 0.5s 0.05s cubic-bezier(0.34,1.56,0.64,1) both; }
        .result-slide-2 { animation: slideUp 0.5s 0.15s cubic-bezier(0.34,1.56,0.64,1) both; }
        .result-slide-3 { animation: slideUp 0.5s 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
        .shimmer-text {
          background: linear-gradient(90deg, #facc15, #fff, #facc15, #fff, #facc15);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 2.5s linear infinite;
        }
      `}</style>

      {visible && (
        <div className="w-full max-w-4xl">
          {/* 標題 */}
          <div className="result-slide text-center mb-8">
            <h2 className="shimmer-text text-4xl md:text-6xl font-black tracking-tighter mb-2">
              DRAFT COMPLETE
            </h2>
            <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">
              {coinWinner === 'blue'
                ? (lang === 'zh' ? '🔵 藍方先手' : '🔵 Blue Picked First')
                : (lang === 'zh' ? '🔴 紅方先手' : '🔴 Red Picked First')}
            </p>
          </div>

          {/* 禁用列 */}
          <div className="result-slide-1 flex items-center justify-between mb-6 bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
            <div className="flex flex-col items-start gap-2">
              <span className="text-blue-400 text-xs font-bold tracking-widest uppercase bg-blue-900/30 px-2 py-1 rounded-full">
                {t.blueBan}
              </span>
              <div className="flex gap-2">
                {bans.blue.map((b, i) => (
                  <div key={i} className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-blue-900/50 bg-slate-800 grayscale relative`}>
                    {b && <img src={getPortrait(b)} alt={getBrawlerName(b, lang)} className="w-full h-full object-cover object-top" />}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[3px] bg-red-600 rotate-45 shadow-[0_0_6px_rgba(0,0,0,0.9)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-slate-600 font-black tracking-[0.3em] text-sm hidden md:block">BANS</div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-red-400 text-xs font-bold tracking-widest uppercase bg-red-900/30 px-2 py-1 rounded-full">
                {t.redBan}
              </span>
              <div className="flex gap-2">
                {bans.red.map((b, i) => (
                  <div key={i} className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-red-900/50 bg-slate-800 grayscale relative">
                    {b && <img src={getPortrait(b)} alt={getBrawlerName(b, lang)} className="w-full h-full object-cover object-top" />}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[3px] bg-red-600 rotate-45 shadow-[0_0_6px_rgba(0,0,0,0.9)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 選角對比 */}
          <div className="result-slide-2 grid grid-cols-2 gap-4 mb-8">
            {/* 藍方 */}
            <div className="bg-blue-950/30 rounded-2xl p-4 border border-blue-900/50">
              <h3 className="text-blue-400 font-black text-lg tracking-wider mb-4 text-center uppercase">
                🔵 {lang === 'zh' ? '藍方陣容' : 'Blue Team'}
              </h3>
              <div className="flex flex-col gap-3">
                {picks.blue.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 bg-blue-900/20 rounded-xl overflow-hidden border border-blue-900/30">
                    <div className="w-14 h-14 shrink-0 bg-slate-800 overflow-hidden">
                      {b && <img src={getPortrait(b)} alt={getBrawlerName(b, lang)} className="w-full h-full object-cover object-top" />}
                    </div>
                    <span className="font-black text-white text-sm md:text-base">
                      {b ? getBrawlerName(b, lang) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 紅方 */}
            <div className="bg-red-950/30 rounded-2xl p-4 border border-red-900/50">
              <h3 className="text-red-400 font-black text-lg tracking-wider mb-4 text-center uppercase">
                🔴 {lang === 'zh' ? '紅方陣容' : 'Red Team'}
              </h3>
              <div className="flex flex-col gap-3">
                {picks.red.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 bg-red-900/20 rounded-xl overflow-hidden border border-red-900/30">
                    <div className="w-14 h-14 shrink-0 bg-slate-800 overflow-hidden">
                      {b && <img src={getPortrait(b)} alt={getBrawlerName(b, lang)} className="w-full h-full object-cover object-top" />}
                    </div>
                    <span className="font-black text-white text-sm md:text-base">
                      {b ? getBrawlerName(b, lang) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 重置按鈕 */}
          <div className="result-slide-3 flex justify-center">
            <button onClick={onReset}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-black text-lg rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(250,204,21,0.4)]">
              <RotateCcw size={20} />
              {lang === 'zh' ? '重新開始 BP' : 'New Draft'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MultiplayerBPRoom ─────────────────────────────────────────────────────

const DEFAULT_STATE = {
  matchTitle: '兩方 BP 環節',
  background: '#e6e9fc',
  team1: {
    name: 'Team 1', color: '#3b82f6',
    bans: [{ id: 't1_b1', brawler: null }, { id: 't1_b2', brawler: null }, { id: 't1_b3', brawler: null }],
    picks: [{ id: 't1_p1', player: 'blue1', brawler: null }, { id: 't1_p2', player: 'blue2', brawler: null }, { id: 't1_p3', player: 'blue3', brawler: null }],
  },
  team2: {
    name: 'Team 2', color: '#ef4444',
    bans: [{ id: 't2_b1', brawler: null }, { id: 't2_b2', brawler: null }, { id: 't2_b3', brawler: null }],
    picks: [{ id: 't2_p1', player: 'red1', brawler: null }, { id: 't2_p2', player: 'red2', brawler: null }, { id: 't2_p3', player: 'red3', brawler: null }],
  },
};


function OperatorBanSlot({ slot, color, onSelect, onClear }) {
  return (
    <div className="relative group">
      <div onClick={onSelect} className="w-16 h-16 rounded-lg border-[3px] bg-white flex items-center justify-center cursor-pointer hover:opacity-80 transition relative overflow-hidden shadow-sm" style={{ borderColor: color }}>
        {slot.brawler ? (
          <>
            <img src={slot.brawler.imageUrl} alt={slot.brawler.name} className="w-full h-full object-cover grayscale opacity-90" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="5" y1="5" x2="95" y2="95" stroke="#d5281a" strokeWidth="12" strokeLinecap="round" /></svg>
            <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center z-10"><span className="text-white text-[10px] font-bold">更換</span></div>
          </>
        ) : (<ImageIcon className="w-6 h-6 text-slate-300" />)}
      </div>
      {slot.brawler && (<button onClick={(e) => { e.stopPropagation(); onClear(); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"><X className="w-3 h-3" /></button>)}
    </div>
  );
}

function OperatorPickSlot({ slot, color, onSelect, onClear }) {
  return (
    <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-2xl border shadow-sm w-full max-w-[280px] group">
      <div onClick={onSelect} className="w-[72px] h-[72px] rounded-xl border-4 bg-slate-50 flex shrink-0 items-center justify-center cursor-pointer hover:opacity-80 transition relative overflow-hidden" style={{ borderColor: color }}>
        {slot.brawler ? (
          <>
            <img src={slot.brawler.imageUrl} alt={slot.brawler.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"><span className="text-white text-xs font-bold">更換</span></div>
          </>
        ) : (<ImageIcon className="w-8 h-8 text-slate-300" />)}
      </div>
      <div className="flex-1 truncate font-bold text-slate-600">{slot.player || 'Player'}</div>
      <button onClick={onClear} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"><Trash2 className="w-5 h-5" /></button>
    </div>
  );
}

function BrawlerSelectModal({ brawlers, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const filtered = brawlers.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    getBrawlerName({ id: b.id, name: b.name }, 'zh').includes(search)
  );
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold">選擇英雄</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b bg-white flex gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="搜尋角色名稱 (英文)..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>
          <div className="flex-1 flex gap-2">
            <input type="text" placeholder="或輸入自訂圖片網址..." value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
            <button onClick={() => customUrl && onSelect({ name: 'Custom', imageUrl: customUrl })} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 whitespace-nowrap">使用網址</button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100">
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-3">
            {filtered.map(b => (
              <button key={b.id} onClick={() => onSelect(b)} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white hover:shadow-md transition group">
                <img src={b.imageUrl} alt={b.name} className="w-[60px] h-[60px] object-cover object-top rounded-lg shadow-sm group-hover:scale-105 transition" />
                <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{b.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="col-span-full text-center text-slate-500 py-10">找不到角色</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function OperatorPanel({ onBack }) {
  const [state, setState] = useFirebaseState('brawl_bp_match_current', DEFAULT_STATE);
  // 直接用本地 BRAWLERS + portraits，不依賴外部 API
  const brawlers = BRAWLERS.map(b => ({
    id:       b.id,
    name:     b.name,
    imageUrl: getPortrait(b),   // /portraits/{id}_portrait.png
  }));
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);

  const openBrawlerSelect = (team, type, index) => { setActiveSlot({ team, type, index }); setModalOpen(true); };
  const handleSelectBrawler = (brawler) => {
    if (!activeSlot) return;
    const newState = { ...state };
    newState[activeSlot.team][activeSlot.type][activeSlot.index].brawler = brawler;
    setState(newState); setModalOpen(false);
  };
  const handleClearBrawler = (team, type, index) => {
    const newState = { ...state };
    newState[team][type][index].brawler = null;
    setState(newState);
  };
  const handleStateChange = (keys, value) => {
    const newState = { ...state };
    let current = newState;
    for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
    current[keys[keys.length - 1]] = value;
    setState(newState);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1">
            <Home size={16} /> 首頁
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5" /> 賽事控制台 (即時連線中 🟢)</h1>
        </div>
        <button onClick={() => setState(DEFAULT_STATE)} className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">重置所有設定</button>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 overflow-y-auto">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">全局設定</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold mb-1">主標題</label><input type="text" value={state.matchTitle} onChange={(e) => handleStateChange(['matchTitle'], e.target.value)} className="w-full p-2 border rounded outline-none" /></div>
              <div><label className="block text-sm font-semibold mb-1">背景 (顏色 或 圖片URL)</label><input type="text" value={state.background} onChange={(e) => handleStateChange(['background'], e.target.value)} className="w-full p-2 border rounded outline-none" /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2" style={{ color: state.team1.color }}>左方隊伍 (Team 1)</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold mb-1">隊伍名稱</label><input type="text" value={state.team1.name} onChange={(e) => handleStateChange(['team1', 'name'], e.target.value)} className="w-full p-2 border rounded outline-none" /></div>
              <div><label className="block text-sm font-semibold mb-1">隊伍顏色</label><input type="color" value={state.team1.color} onChange={(e) => handleStateChange(['team1', 'color'], e.target.value)} className="w-full h-10 p-1 border rounded cursor-pointer" /></div>
              <div><label className="block text-sm font-semibold mb-1">玩家 ID</label>
                {state.team1.picks.map((pick, i) => (<input key={pick.id} type="text" value={pick.player} onChange={(e) => { const newPicks = [...state.team1.picks]; newPicks[i].player = e.target.value; handleStateChange(['team1', 'picks'], newPicks); }} className="w-full p-2 border rounded mb-2 outline-none text-sm" />))}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2" style={{ color: state.team2.color }}>右方隊伍 (Team 2)</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold mb-1">隊伍名稱</label><input type="text" value={state.team2.name} onChange={(e) => handleStateChange(['team2', 'name'], e.target.value)} className="w-full p-2 border rounded outline-none" /></div>
              <div><label className="block text-sm font-semibold mb-1">隊伍顏色</label><input type="color" value={state.team2.color} onChange={(e) => handleStateChange(['team2', 'color'], e.target.value)} className="w-full h-10 p-1 border rounded cursor-pointer" /></div>
              <div><label className="block text-sm font-semibold mb-1">玩家 ID</label>
                {state.team2.picks.map((pick, i) => (<input key={pick.id} type="text" value={pick.player} onChange={(e) => { const newPicks = [...state.team2.picks]; newPicks[i].player = e.target.value; handleStateChange(['team2', 'picks'], newPicks); }} className="w-full p-2 border rounded mb-2 outline-none text-sm" />))}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-9">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
            <h2 className="text-2xl font-bold mb-8 text-center">Ban / Pick 操作面板</h2>
            <div className="flex justify-around gap-8">
              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-2xl font-black mb-4" style={{ color: state.team1.color }}>{state.team1.name}</h3>
                <div className="w-full bg-slate-50 rounded-xl p-4 mb-8 border border-slate-200 flex flex-col items-center">
                  <span className="text-sm font-bold text-slate-400 mb-3 tracking-widest">BANS</span>
                  <div className="flex gap-4">
                    {state.team1.bans.map((ban, i) => (<OperatorBanSlot key={ban.id} slot={ban} color={state.team1.color} onSelect={() => openBrawlerSelect('team1', 'bans', i)} onClear={() => handleClearBrawler('team1', 'bans', i)} />))}
                  </div>
                </div>
                <div className="w-full flex flex-col items-center space-y-4">
                  <span className="text-sm font-bold text-slate-400 mb-1 tracking-widest">PICKS</span>
                  {state.team1.picks.map((pick, i) => (<OperatorPickSlot key={pick.id} slot={pick} color={state.team1.color} onSelect={() => openBrawlerSelect('team1', 'picks', i)} onClear={() => handleClearBrawler('team1', 'picks', i)} />))}
                </div>
              </div>
              <div className="w-px bg-slate-200"></div>
              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-2xl font-black mb-4" style={{ color: state.team2.color }}>{state.team2.name}</h3>
                <div className="w-full bg-slate-50 rounded-xl p-4 mb-8 border border-slate-200 flex flex-col items-center">
                  <span className="text-sm font-bold text-slate-400 mb-3 tracking-widest">BANS</span>
                  <div className="flex gap-4">
                    {state.team2.bans.map((ban, i) => (<OperatorBanSlot key={ban.id} slot={ban} color={state.team2.color} onSelect={() => openBrawlerSelect('team2', 'bans', i)} onClear={() => handleClearBrawler('team2', 'bans', i)} />))}
                  </div>
                </div>
                <div className="w-full flex flex-col items-center space-y-4">
                  <span className="text-sm font-bold text-slate-400 mb-1 tracking-widest">PICKS</span>
                  {state.team2.picks.map((pick, i) => (<OperatorPickSlot key={pick.id} slot={pick} color={state.team2.color} onSelect={() => openBrawlerSelect('team2', 'picks', i)} onClear={() => handleClearBrawler('team2', 'picks', i)} />))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {modalOpen && <BrawlerSelectModal brawlers={brawlers} onClose={() => setModalOpen(false)} onSelect={handleSelectBrawler} />}
    </div>
  );
}

function ViewerBanSlot({ ban, color }) {
  return (
    <div className="w-[75px] h-[75px] rounded-lg border-[3px] relative overflow-hidden shadow-xl bg-[#2a3040]" style={{ borderColor: color }}>
      {ban.brawler ? (
        <>
          <img src={ban.brawler.imageUrl} alt={ban.brawler.name} className="w-full h-full object-cover filter grayscale opacity-90" />
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="5" y1="5" x2="95" y2="95" stroke="#d5281a" strokeWidth="10" strokeLinecap="round" /></svg>
        </>
      ) : (<div className="w-full h-full bg-[#1e2330] flex items-center justify-center opacity-50"></div>)}
    </div>
  );
}

function ViewerPickSlot({ pick, color }) {
  return (
    <div className="flex flex-col items-center relative w-full">
      <span className="absolute -top-8 text-white text-xl font-bold tracking-wide drop-shadow-lg z-10" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>{pick.player}</span>
      <div className="w-[120px] h-[120px] rounded-2xl border-[4px] relative overflow-hidden shadow-2xl bg-[#2a3040]" style={{ borderColor: color }}>
        {pick.brawler
          ? <img src={pick.brawler.imageUrl} alt={pick.brawler.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-[#1e2330] flex items-center justify-center opacity-50"></div>}
      </div>
    </div>
  );
}

function ViewerView({ onBack }) {
  const [state] = useFirebaseState('brawl_bp_match_current', DEFAULT_STATE);
  const bgStyle = state.background.startsWith('http')
    ? { backgroundImage: `url(${state.background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: state.background };
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col relative font-sans select-none" style={bgStyle} translate="no">

      {/* 返回按鈕：完全透明，滑鼠移到左上角才顯示，不影響 OBS 擷取 */}
      <button onClick={onBack} className="absolute top-4 left-4 z-50 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-bold opacity-0 hover:opacity-100 transition-opacity duration-300 select-none">
        ← 首頁
      </button>      <div className="w-full text-center pt-8 pb-4 z-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-[0.2em] text-white drop-shadow-md" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}>{state.matchTitle}</h1>
      </div>
      <div className="w-full flex justify-center items-center gap-16 mb-6 z-10">
        <div className="flex gap-4">{state.team1.bans.map(ban => <ViewerBanSlot key={ban.id} ban={ban} color={state.team1.color} />)}</div>
        <div className="font-black text-2xl tracking-widest text-white/50 drop-shadow-md">BANS</div>
        <div className="flex gap-4">{state.team2.bans.map(ban => <ViewerBanSlot key={ban.id} ban={ban} color={state.team2.color} />)}</div>
      </div>
      <div className="flex-1 flex justify-center items-start pt-4 z-10">
        <div className="w-full max-w-5xl flex justify-around">
          <div className="flex flex-col items-center w-64">
            <h2 className="text-3xl font-black mb-8 tracking-wider text-center break-words w-full px-4" style={{ color: state.team1.color, textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>{state.team1.name}</h2>
            <div className="flex flex-col gap-10 w-full items-center">{state.team1.picks.map(pick => <ViewerPickSlot key={pick.id} pick={pick} color={state.team1.color} />)}</div>
          </div>
          <div className="w-32"></div>
          <div className="flex flex-col items-center w-64">
            <h2 className="text-3xl font-black mb-8 tracking-wider text-center break-words w-full px-4" style={{ color: state.team2.color, textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>{state.team2.name}</h2>
            <div className="flex flex-col gap-10 w-full items-center">{state.team2.picks.map(pick => <ViewerPickSlot key={pick.id} pick={pick} color={state.team2.color} />)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 主入口：路由控制
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 8 強對戰表系統
// ═══════════════════════════════════════════════════════════════════════════════

const BRACKET_DEFAULT = {
  background: '#020617',
  title: '8 強對戰表',
  teams: ['隊伍 1','隊伍 2','隊伍 3','隊伍 4','隊伍 5','隊伍 6','隊伍 7','隊伍 8'],
  qf: [
    { t1: 0, t2: 1, winner: null, s1: null, s2: null },
    { t1: 2, t2: 3, winner: null, s1: null, s2: null },
    { t1: 4, t2: 5, winner: null, s1: null, s2: null },
    { t1: 6, t2: 7, winner: null, s1: null, s2: null },
  ],
  sf: [
    { winner: null, s1: null, s2: null },
    { winner: null, s1: null, s2: null },
  ],
  final: { winner: null, s1: null, s2: null },
};

// ── 對戰表 Hook ──
function useBracket() {
  const [state, setState] = useState(BRACKET_DEFAULT);

  useEffect(() => {
    const dbRef = ref(bracketDb, 'bracket');
    const unsub = onValue(dbRef, snap => {
      const data = snap.val();
      if (data) {
        // Firebase 會自動刪除所有 value 為 null 的欄位,因此全 null 的物件會整個消失,
        // 而稀疏的陣列(例如只有 sf/0 而沒有 sf/1)會被回傳成 {"0": {...}}。
        // 若此時用 Object.values 會得到長度比預設短的陣列,或把 index 1 的資料誤放到 index 0。
        // 改成依預設陣列的長度與 index 逐一補回,才能確保 SF 2、QF 等卡片不會整個消失。
        const normalizeList = (raw, def) =>
          def.map((d, i) => {
            const item = raw == null
              ? null
              : (Array.isArray(raw) ? raw[i] : (raw[i] ?? raw[String(i)]));
            return item ? { ...d, ...item } : { ...d };
          });

        const rawTeams = data.teams;
        const teamsArr = rawTeams == null
          ? []
          : (Array.isArray(rawTeams) ? rawTeams : Object.values(rawTeams));

        const normalized = {
          ...BRACKET_DEFAULT,
          ...data,
          qf:    normalizeList(data.qf, BRACKET_DEFAULT.qf),
          sf:    normalizeList(data.sf, BRACKET_DEFAULT.sf),
          final: { ...BRACKET_DEFAULT.final, ...(data.final || {}) },
          teams: BRACKET_DEFAULT.teams.map((d, i) => teamsArr[i] ?? d),
        };
        setState(normalized);
      } else {
        set(dbRef, BRACKET_DEFAULT);
        setState(BRACKET_DEFAULT);
      }
    });
    return () => unsub();
  }, []);

  function setSharedState(value) {
    try { set(ref(bracketDb, 'bracket'), value); } catch (e) { console.error(e); }
  }
  return [state, setSharedState];
}




const DEFAULT_LAYOUT = {
  title:    { x: 50, y:  4, w: 520, visible: true, anchor: 'center' },
  qf0_0:   { x:  6, y: 17, w: 250, visible: true },
  qf0_1:   { x:  6, y: 25, w: 250, visible: true },
  qf1_0:   { x:  6, y: 38, w: 250, visible: true },
  qf1_1:   { x:  6, y: 46, w: 250, visible: true },
  qf2_0:   { x:  6, y: 59, w: 250, visible: true },
  qf2_1:   { x:  6, y: 67, w: 250, visible: true },
  qf3_0:   { x:  6, y: 80, w: 250, visible: true },
  qf3_1:   { x:  6, y: 88, w: 250, visible: true },
  sf0_0:   { x: 37, y: 24, w: 250, visible: true },
  sf0_1:   { x: 37, y: 32, w: 250, visible: true },
  sf1_0:   { x: 37, y: 60, w: 250, visible: true },
  sf1_1:   { x: 37, y: 68, w: 250, visible: true },
  fin_0:   { x: 65, y: 41, w: 250, visible: true },
  fin_1:   { x: 65, y: 49, w: 250, visible: true },
  champion:{ x: 83, y: 44, w: 200, visible: true },
};

function TeamSlot({ name, score, isWin, isLose, showScore, width }) {
  const w = width || 250;
  const fs = Math.max(13, Math.min(20, w / 13));
  return (
    <div style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: `${fs * 0.2}px 0`,
    }}>
      <span style={{
        fontWeight: 800, fontSize: fs, flex: 1,
        color: isLose ? 'rgba(255,255,255,0.5)' : '#fff',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        transition: 'color 0.4s',
      }}>{name || '—'}</span>
      {showScore && (
        <span style={{
          fontWeight: 900, fontSize: fs + 2, flexShrink: 0,
          color: isLose ? 'rgba(255,255,255,0.5)' : '#fff',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}>{score ?? 0}</span>
      )}
    </div>
  );
}

function ChampionBadge({ name, width }) {
  const w = width || 200;
  const fs = Math.max(14, Math.min(24, w / 9));
  if (!name) return (
    <div style={{ width: '100%', color: 'rgba(255,255,255,0.2)', fontWeight: 900, fontSize: fs, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>—</div>
  );
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: fs * 1.4, lineHeight: 1, flexShrink: 0 }}>🏆</span>
      <span style={{
        fontWeight: 900, fontSize: fs, color: '#fff',
        textShadow: '0 2px 12px rgba(0,0,0,0.9)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{name}</span>
    </div>
  );
}

function BracketViewer({ onBack }) {
  const [state] = useBracket();
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [editMode, setEditMode] = useState(false);
  const draggingRef = useRef(null);
  const resizingRef = useRef(null);
  const dragOffRef  = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mx: 0, w: 0 });
  const layoutRef = useRef(layout);
  const containerRef = useRef(null);
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  const { teams, qf, sf, final, title, background } = state;

  useEffect(() => {
    const dbRef = ref(bracketDb, 'bracket_layout');
    const unsub = onValue(dbRef, snap => {
      const data = snap.val();
      if (data) setLayout({ ...DEFAULT_LAYOUT, ...data });
    });
    return () => unsub();
  }, []);

  function saveLayout(l) { set(ref(bracketDb, 'bracket_layout'), l).catch(() => {}); }

  function autoW(s1, s2) {
    if (s1 != null && s1 >= 3) return 0;
    if (s2 != null && s2 >= 3) return 1;
    return null;
  }
  function qfW(i) {
    const m = qf[i]; if (!m) return null;
    const w = m.winner ?? autoW(m.s1, m.s2);
    return w == null ? null : (w === 0 ? teams[m.t1] : teams[m.t2]);
  }
  function sfW(i) {
    const m = sf[i]; if (!m) return null;
    const w = m.winner ?? autoW(m.s1, m.s2);
    return w == null ? null : [qfW(i*2), qfW(i*2+1)][w];
  }
  const fin0 = sfW(0), fin1 = sfW(1);
  const finalW = final?.winner ?? autoW(final?.s1, final?.s2);
  const champion = finalW != null ? [fin0, fin1][finalW] : null;

  const bgStyle = background?.startsWith('http')
    ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: background || '#020617' };

  function startDrag(e, key) {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const el = layoutRef.current[key];
    const elLeft = el.anchor === 'center'
      ? (el.x / 100) * rect.width - el.w / 2
      : (el.x / 100) * rect.width;
    dragOffRef.current = { x: cx - rect.left - elLeft, y: cy - rect.top - (el.y / 100) * rect.height };
    draggingRef.current = key;
  }
  function startResize(e, key) {
    e.preventDefault(); e.stopPropagation();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    resizeStartRef.current = { mx: cx, w: layoutRef.current[key].w };
    resizingRef.current = key;
  }
  function onMove(e) {
    const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    if (draggingRef.current) {
      const key = draggingRef.current;
      const el = layoutRef.current[key];
      const x = el.anchor === 'center'
        ? Math.min(99, Math.max(1, ((cx - dragOffRef.current.x - rect.left + el.w/2) / rect.width) * 100))
        : Math.min(98, Math.max(0, ((cx - dragOffRef.current.x - rect.left) / rect.width) * 100));
      const y = Math.min(97, Math.max(0, ((cy - dragOffRef.current.y - rect.top) / rect.height) * 100));
      setLayout(l => ({ ...l, [key]: { ...l[key], x, y } }));
    }
    if (resizingRef.current) {
      const key = resizingRef.current;
      const dx = cx - resizeStartRef.current.mx;
      const newW = Math.max(120, resizeStartRef.current.w + dx);
      setLayout(l => ({ ...l, [key]: { ...l[key], w: newW } }));
    }
  }
  function onUp() {
    if (draggingRef.current || resizingRef.current) saveLayout(layoutRef.current);
    draggingRef.current = null; resizingRef.current = null;
  }
  function hideEl(key) {
    const l = { ...layoutRef.current, [key]: { ...layoutRef.current[key], visible: false } };
    setLayout(l); saveLayout(l);
  }
  function resetLayout() { setLayout(DEFAULT_LAYOUT); saveLayout(DEFAULT_LAYOUT); }

  function Draggable({ id, children }) {
    const el = layout[id]; if (!el?.visible) return null;
    const left = el.anchor === 'center' ? `calc(${el.x}% - ${el.w/2}px)` : `${el.x}%`;
    return (
      <div onMouseDown={e => startDrag(e, id)} onTouchStart={e => startDrag(e, id)}
        style={{
          position: 'absolute', left, top: `${el.y}%`, width: el.w,
          cursor: editMode ? 'grab' : 'default',
          userSelect: 'none', zIndex: 10,
          outline: editMode ? '1.5px dashed rgba(250,204,21,0.55)' : 'none',
          borderRadius: 10,
        }}>
        {children}
        {editMode && (<>
          <button onMouseDown={e => { e.stopPropagation(); hideEl(id); }}
            style={{
              position: 'absolute', top: -9, right: -9, zIndex: 200,
              width: 20, height: 20, borderRadius: '50%',
              background: '#ef4444', border: '2px solid #fff',
              color: '#fff', fontWeight: 900, fontSize: 11,
              cursor: 'pointer', lineHeight: 1, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          <div onMouseDown={e => startResize(e, id)} onTouchStart={e => startResize(e, id)}
            style={{
              position: 'absolute', bottom: -6, right: -6, zIndex: 200,
              width: 14, height: 14, borderRadius: 4,
              background: '#facc15', border: '2px solid #fff', cursor: 'se-resize',
            }} />
        </>)}
      </div>
    );
  }

  return (
    <div ref={containerRef}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', ...bgStyle }}
      onMouseMove={onMove} onMouseUp={onUp} onTouchMove={onMove} onTouchEnd={onUp} translate="no">


      <button onClick={onBack} style={{
        position: 'absolute', top: 10, left: 10, zIndex: 300,
        background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none',
        padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
        cursor: 'pointer', opacity: 0, transition: 'opacity 0.3s',
      }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0}>← 首頁</button>

      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 300, display: 'flex', gap: 8 }}>
        {editMode && <button onClick={resetLayout} style={{ background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>重置位置</button>}
        <button onClick={() => setEditMode(v => !v)} style={{
          background: editMode ? '#facc15' : 'rgba(0,0,0,0.45)',
          color: editMode ? '#1e293b' : '#fff',
          border: editMode ? 'none' : '1px solid rgba(255,255,255,0.2)',
          padding: '4px 14px', borderRadius: 7, fontSize: 12, fontWeight: 900, cursor: 'pointer',
          opacity: editMode ? 1 : 0, transition: 'opacity 0.3s',
        }} onMouseEnter={e => { if (!editMode) e.target.style.opacity = 1; }}
           onMouseLeave={e => { if (!editMode) e.target.style.opacity = 0; }}>
          {editMode ? '✓ 完成' : '✥ 編輯'}
        </button>
      </div>

      {editMode && <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(250,204,21,0.9)', color: '#1e293b', padding: '5px 18px', borderRadius: 18, fontSize: 11, fontWeight: 900, zIndex: 300, pointerEvents: 'none', whiteSpace: 'nowrap' }}>拖曳移動 ｜ 右下角縮放 ｜ ✕ 隱藏 ｜「重置位置」還原</div>}

      <Draggable id="title">
        <h1 style={{ fontSize: Math.max(18, Math.min(54, (layout.title?.w||520)/10)), fontWeight: 900, textAlign: 'center', letterSpacing: '-0.02em', background: 'linear-gradient(90deg,#facc15,#fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, padding: '2px 0', whiteSpace: 'nowrap' }}>{title || '8 強對戰表'}</h1>
      </Draggable>

      {qf.map((m, mi) => {
        const w = m.winner ?? autoW(m.s1, m.s2);
        const showScore = (m.s1 != null && m.s1 > 0) || (m.s2 != null && m.s2 > 0);
        return [
          <Draggable key={`qf${mi}_0`} id={`qf${mi}_0`}><TeamSlot name={teams[m.t1]} score={m.s1} isWin={w===0} isLose={w===1} showScore={showScore} width={layout[`qf${mi}_0`]?.w} /></Draggable>,
          <Draggable key={`qf${mi}_1`} id={`qf${mi}_1`}><TeamSlot name={teams[m.t2]} score={m.s2} isWin={w===1} isLose={w===0} showScore={showScore} width={layout[`qf${mi}_1`]?.w} /></Draggable>,
        ];
      })}

      {sf.map((m, mi) => {
        const w = m.winner ?? autoW(m.s1, m.s2);
        const tA = qfW(mi*2), tB = qfW(mi*2+1);
        const showScore = (m.s1 != null && m.s1 > 0) || (m.s2 != null && m.s2 > 0);
        return [
          <Draggable key={`sf${mi}_0`} id={`sf${mi}_0`}><TeamSlot name={tA} score={m.s1} isWin={w===0} isLose={w===1} showScore={showScore} width={layout[`sf${mi}_0`]?.w} /></Draggable>,
          <Draggable key={`sf${mi}_1`} id={`sf${mi}_1`}><TeamSlot name={tB} score={m.s2} isWin={w===1} isLose={w===0} showScore={showScore} width={layout[`sf${mi}_1`]?.w} /></Draggable>,
        ];
      })}

      <Draggable id="fin_0"><TeamSlot name={fin0} score={final?.s1} isWin={finalW===0} isLose={finalW===1} showScore={(final?.s1||0)>0||(final?.s2||0)>0} width={layout.fin_0?.w} /></Draggable>
      <Draggable id="fin_1"><TeamSlot name={fin1} score={final?.s2} isWin={finalW===1} isLose={finalW===0} showScore={(final?.s1||0)>0||(final?.s2||0)>0} width={layout.fin_1?.w} /></Draggable>

      <Draggable id="champion"><ChampionBadge name={champion} width={layout.champion?.w} /></Draggable>
    </div>
  );
}

// ── 對戰表控制台 ──────────────────────────────────────────────────────────────
function BracketOperator({ onBack }) {
  const [state, setState] = useBracket();
  const [showPwChange, setShowPwChange] = useState(false);
  const [oldPw, setOldPw]     = useState('');
  const [newPw, setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg]     = useState(null);
  const [currentPw, setCurrentPw] = useState('1234');

  useEffect(() => {
    const dbRef = ref(bracketDb, 'bracket_password');
    const unsub = onValue(dbRef, snap => setCurrentPw(snap.val() ?? '1234'));
    return () => unsub();
  }, []);

  const { teams, qf, sf, final, title, background } = state;

  function autoWinner(s1, s2) {
    if (s1 != null && s1 >= 3) return 0;
    if (s2 != null && s2 >= 3) return 1;
    return null;
  }

  // 每個 setter 只寫入自己的 Firebase 路徑，避免 stale closure 覆蓋其他資料
  function updateField(key, val) {
    set(ref(bracketDb, `bracket/${key}`), val);
  }
  function updateTeam(i, val) {
    const t = [...teams]; t[i] = val;
    set(ref(bracketDb, 'bracket/teams'), t);
  }
  function setQFScore(i, s1, s2) {
    set(ref(bracketDb, `bracket/qf/${i}`), { ...qf[i], s1, s2, winner: autoWinner(s1, s2) });
  }
  function setSFScore(i, s1, s2) {
    set(ref(bracketDb, `bracket/sf/${i}`), { ...sf[i], s1, s2, winner: autoWinner(s1, s2) });
  }
  function setFinalScore(s1, s2) {
    set(ref(bracketDb, 'bracket/final'), { ...final, s1, s2, winner: autoWinner(s1, s2) });
  }
  function reset() {
    set(ref(bracketDb, 'bracket'), { ...BRACKET_DEFAULT });
  }

  function qfWinner(i) {
    const m = qf[i]; if (!m) return null;
    const w = m.winner ?? autoWinner(m.s1, m.s2);
    if (w == null) return null;
    return w === 0 ? teams[m.t1] : teams[m.t2];
  }
  function sfWinner(i) {
    const m = sf[i]; if (!m) return null;
    const w = m.winner ?? autoWinner(m.s1, m.s2);
    if (w == null) return null;
    return w === 0 ? qfWinner(i * 2) : qfWinner(i * 2 + 1);
  }
  const fin = [sfWinner(0), sfWinner(1)];
  const champion = final?.winner != null ? (final.winner === 0 ? fin[0] : fin[1]) : null;

  function changePw() {
    if (oldPw !== currentPw) return setPwMsg({ type: 'err', text: '原密碼錯誤' });
    if (!newPw) return setPwMsg({ type: 'err', text: '新密碼不能為空' });
    if (newPw !== confirmPw) return setPwMsg({ type: 'err', text: '兩次新密碼不符' });
    set(ref(bracketDb, 'bracket_password'), newPw);
    setPwMsg({ type: 'ok', text: '密碼已更新！' });
    setOldPw(''); setNewPw(''); setConfirmPw('');
  }

  function MatchCard({ label, teamA, teamB, winner, s1, s2, onScore, disabled }) {
    const canPlay = (teamA || teamB) && !disabled;
    return (
      <div className={`bg-white rounded-2xl p-4 border shadow-sm ${!canPlay ? 'opacity-50' : 'border-slate-200'}`}>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
        <div className="flex flex-col gap-1">
          {[{ name: teamA, w: 0, score: s1, other: s2 }, { name: teamB, w: 1, score: s2, other: s1 }].map(({ name, w, score, other }) => {
            const isWin = winner === w;
            const isLose = winner != null && winner !== w;
            return (
              <div key={w} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all
                ${isWin ? 'bg-yellow-50 border border-yellow-300' : isLose ? 'bg-slate-50 opacity-50' : 'bg-slate-50'}`}>
                <span className={`flex-1 text-sm font-bold truncate ${isWin ? 'text-yellow-700' : 'text-slate-700'}`}>
                  {isWin && '👑 '}{name || <span className="opacity-40">待定</span>}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => canPlay && onScore(w === 0 ? Math.max(0, (s1 ?? 0) - 1) : s1, w === 1 ? Math.max(0, (s2 ?? 0) - 1) : s2)}
                    disabled={!canPlay || score == null || score <= 0}
                    className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 font-black text-slate-600 disabled:opacity-30 text-xs flex items-center justify-center">−</button>
                  <span className={`w-7 text-center font-black text-base ${isWin ? 'text-yellow-600' : 'text-slate-600'}`}>
                    {score ?? 0}
                  </span>
                  <button onClick={() => canPlay && onScore(w === 0 ? (s1 ?? 0) + 1 : s1, w === 1 ? (s2 ?? 0) + 1 : s2)}
                    disabled={!canPlay}
                    className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 font-black text-slate-600 disabled:opacity-30 text-xs flex items-center justify-center">＋</button>
                </div>
              </div>
            );
          })}
          {(s1 != null || s2 != null) && (
            <button onClick={() => onScore(null, null)} className="text-xs text-red-400 hover:text-red-600 font-bold mt-1 text-center">重置比數</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-wrap gap-3 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1">
            <Home size={16} /> 首頁
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> 對戰表控制台 🟢
          </h1>
        </div>
        <button onClick={reset} className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-bold">重置對戰表</button>
      </header>

      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 overflow-y-auto">
        <div className="xl:col-span-3 space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h2 className="font-bold text-base mb-4 border-b pb-2">🎨 顯示設定</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">標題</label>
                <input type="text" value={title || ''} onChange={e => updateField('title', e.target.value)} className="w-full p-2 border rounded outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">背景（顏色或圖片網址）</label>
                <div className="flex gap-2">
                  <input type="color" value={background?.startsWith('#') ? background : '#020617'} onChange={e => updateField('background', e.target.value)} className="w-10 h-9 rounded cursor-pointer border-0 p-0.5 shrink-0" />
                  <input type="text" value={background || ''} onChange={e => updateField('background', e.target.value)} className="flex-1 p-2 border rounded outline-none text-sm font-mono min-w-0" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h2 className="font-bold text-base mb-4 border-b pb-2">👥 8 支隊伍</h2>
            <div className="space-y-2">
              {teams.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-bold w-5 text-right shrink-0">{i + 1}</span>
                  <input type="text" value={name} onChange={e => updateTeam(i, e.target.value)} className="flex-1 p-2 border rounded outline-none text-sm min-w-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <button onClick={() => setShowPwChange(v => !v)} className="w-full flex items-center justify-between font-bold text-sm text-slate-700">
              <span className="flex items-center gap-2"><KeyRound size={15} className="text-yellow-500" /> 修改密碼</span>
              <span className="text-slate-400 text-xs">{showPwChange ? '▲' : '▼'}</span>
            </button>
            {showPwChange && (
              <div className="mt-3 space-y-2">
                {[['原密碼', oldPw, setOldPw], ['新密碼', newPw, setNewPw], ['確認新密碼', confirmPw, setConfirmPw]].map(([label, val, fn]) => (
                  <div key={label}>
                    <label className="block text-xs text-slate-400 mb-1">{label}</label>
                    <input type="password" value={val} onChange={e => { fn(e.target.value); setPwMsg(null); }}
                      onKeyDown={e => e.key === 'Enter' && changePw()}
                      className="w-full p-2 border rounded outline-none text-sm font-mono tracking-widest" />
                  </div>
                ))}
                {pwMsg && <p className={`text-xs font-bold ${pwMsg.type === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{pwMsg.text}</p>}
                <button onClick={changePw} className="w-full mt-2 py-2 rounded-lg bg-yellow-400 text-slate-900 font-black text-sm hover:opacity-90">確認修改</button>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-9 space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">🏅 八強賽</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {qf.map((m, i) => (
                <MatchCard key={i} label={`QF ${i + 1}`}
                  teamA={teams[m.t1]} teamB={teams[m.t2]} winner={m.winner}
                  s1={m.s1 ?? 0} s2={m.s2 ?? 0}
                  onScore={(s1, s2) => setQFScore(i, s1, s2)} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">🥈 四強賽</h2>
            <div className="grid grid-cols-2 gap-4">
              {sf.map((m, i) => (
                <MatchCard key={i} label={`SF ${i + 1}`}
                  teamA={qfWinner(i * 2)} teamB={qfWinner(i * 2 + 1)} winner={m.winner}
                  s1={m.s1 ?? 0} s2={m.s2 ?? 0}
                  onScore={(s1, s2) => setSFScore(i, s1, s2)}
                  disabled={!qfWinner(i * 2) && !qfWinner(i * 2 + 1)} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">🥇 決賽</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <MatchCard label="決賽"
                teamA={fin[0]} teamB={fin[1]} winner={final?.winner}
                s1={final?.s1 ?? 0} s2={final?.s2 ?? 0}
                onScore={(s1, s2) => setFinalScore(s1, s2)}
                disabled={!fin[0] && !fin[1]} />
              <div className="flex flex-col items-center justify-center bg-yellow-50 rounded-2xl border-2 border-yellow-300 p-6 shadow-sm">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-2">冠軍</div>
                <div className="text-lg font-black text-yellow-700 text-center">{champion || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// 記分板系統
// ═══════════════════════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════════════════════
// 賽事記分板系統（自由 Canvas 款式）
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_GAMES = 5;
const makeGame = () => ({ s1: null, s2: null, modeImage: '', mapImage: '', mapName: '', status: 'pending' });

const SCOREBOARD_DEFAULT = {
  background: '#0d0d12',
  roundLabel: '八強',
  winColor: '#ec4899',
  maxWins: 3,
  team1: { name: 'Team 1', players: '', color: '#ffffff' },
  team2: { name: 'Team 2', players: '', color: '#ffffff' },
  games: Array.from({ length: MAX_GAMES }, makeGame),
};

const DEFAULT_SB_LAYOUT = {
  label:   { x:  5, y: 46, w: 170, visible: true },
  mode_0:  { x: 22, y:  6, w: 110, visible: true },
  mode_1:  { x: 36, y:  6, w: 110, visible: true },
  mode_2:  { x: 50, y:  6, w: 110, visible: true },
  mode_3:  { x: 64, y:  6, w: 110, visible: true },
  mode_4:  { x: 78, y:  6, w: 110, visible: true },
  map_0:   { x: 22, y: 24, w: 110, visible: true },
  map_1:   { x: 36, y: 24, w: 110, visible: true },
  map_2:   { x: 50, y: 24, w: 110, visible: true },
  map_3:   { x: 64, y: 24, w: 110, visible: true },
  map_4:   { x: 78, y: 24, w: 110, visible: true },
  t1_name: { x:  5, y: 52, w: 220, visible: true },
  t1_0:    { x: 22, y: 56, w: 110, visible: true },
  t1_1:    { x: 36, y: 56, w: 110, visible: true },
  t1_2:    { x: 50, y: 56, w: 110, visible: true },
  t1_3:    { x: 64, y: 56, w: 110, visible: true },
  t1_4:    { x: 78, y: 56, w: 110, visible: true },
  t1_wins: { x: 91, y: 56, w: 100, visible: true },
  t2_name: { x:  5, y: 74, w: 220, visible: true },
  t2_0:    { x: 22, y: 78, w: 110, visible: true },
  t2_1:    { x: 36, y: 78, w: 110, visible: true },
  t2_2:    { x: 50, y: 78, w: 110, visible: true },
  t2_3:    { x: 64, y: 78, w: 110, visible: true },
  t2_4:    { x: 78, y: 78, w: 110, visible: true },
  t2_wins: { x: 91, y: 78, w: 100, visible: true },
};

function useScoreboard() {
  const [state, setState] = useState(SCOREBOARD_DEFAULT);
  useEffect(() => {
    const dbRef = ref(scoreboardDb, 'scoreboard');
    const unsub = onValue(dbRef, snap => {
      const data = snap.val();
      if (data) {
        const norm = { ...SCOREBOARD_DEFAULT, ...data };
        if (data.games) {
          const arr = Array.isArray(data.games) ? data.games : Object.values(data.games);
          norm.games = Array.from({ length: MAX_GAMES }, (_, i) => ({ ...makeGame(), ...(arr[i] || {}) }));
        }
        setState(norm);
      } else { set(dbRef, SCOREBOARD_DEFAULT); setState(SCOREBOARD_DEFAULT); }
    });
    return () => unsub();
  }, []);
  function update(path, value) { set(ref(scoreboardDb, `scoreboard/${path}`), value); }
  function updateGame(i, field, value) { set(ref(scoreboardDb, `scoreboard/games/${i}`), { ...state.games[i], [field]: value }); }
  return [state, update, updateGame];
}

function calcWins(games) {
  let w1 = 0, w2 = 0;
  for (const g of games) {
    if (g.status === 'done' && g.s1 != null && g.s2 != null) {
      if (g.s1 > g.s2) w1++;
      else if (g.s2 > g.s1) w2++;
    }
  }
  return { w1, w2 };
}

function ScoreboardOperator({ onBack }) {
  const [state, update, updateGame] = useScoreboard();
  const [showPwChange, setShowPwChange] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [cfmPw, setCfmPw] = useState('');
  const [pwMsg, setPwMsg] = useState(null);
  const [currentPw, setCurrentPw] = useState('1234');
  useEffect(() => {
    const unsub = onValue(ref(scoreboardDb, 'scoreboard_password'), snap => setCurrentPw(snap.val() ?? '1234'));
    return () => unsub();
  }, []);
  function changePw() {
    if (oldPw !== currentPw) return setPwMsg({ type: 'err', text: '原密碼錯誤' });
    if (!newPw) return setPwMsg({ type: 'err', text: '新密碼不能為空' });
    if (newPw !== cfmPw) return setPwMsg({ type: 'err', text: '兩次新密碼不符' });
    set(ref(scoreboardDb, 'scoreboard_password'), newPw);
    setPwMsg({ type: 'ok', text: '密碼已更新！' });
    setOldPw(''); setNewPw(''); setCfmPw('');
  }
  const { w1, w2 } = calcWins(state.games);
  const maxWins = state.maxWins ?? 3;
  const STATUS_LABELS = { pending: '❓待定', live: '🔴進行中', done: '✅結束', skip: '➖跳過' };
  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-wrap gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 text-sm"><Home size={16} /> 首頁</button>
          <h1 className="text-xl font-black flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> 記分板控制台 🟢</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-500">目前：</span>
          <span className="font-black text-xl" style={{ color: state.winColor }}>{w1} : {w2}</span>
          <button onClick={() => set(ref(scoreboardDb, 'scoreboard'), { ...SCOREBOARD_DEFAULT })} className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-bold transition">重置</button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 space-y-5 overflow-y-auto max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h2 className="font-bold text-base mb-4 border-b pb-2">🎨 全域設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">輪次標題</label>
              <input type="text" value={state.roundLabel || ''} onChange={e => update('roundLabel', e.target.value)} className="w-full p-2 border rounded-lg outline-none text-sm font-bold focus:border-yellow-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">先到幾勝</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => update('maxWins', n)} className={`flex-1 py-2 rounded-lg font-black text-sm transition border ${maxWins===n?'bg-yellow-400 text-slate-900 border-yellow-400':'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">背景</label>
              <div className="flex gap-2">
                <input type="color" value={state.background?.startsWith('#') ? state.background : '#0d0d12'} onChange={e => update('background', e.target.value)} className="w-10 h-9 rounded cursor-pointer border-0 p-0.5 shrink-0" />
                <input type="text" value={state.background || ''} onChange={e => update('background', e.target.value)} className="flex-1 p-2 border rounded-lg outline-none text-sm font-mono min-w-0 focus:border-yellow-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">勝場數字顏色</label>
              <div className="flex gap-2">
                <input type="color" value={state.winColor || '#ec4899'} onChange={e => update('winColor', e.target.value)} className="w-10 h-9 rounded cursor-pointer border-0 p-0.5 shrink-0" />
                <input type="text" value={state.winColor || ''} onChange={e => update('winColor', e.target.value)} className="flex-1 p-2 border rounded-lg outline-none text-sm font-mono min-w-0 focus:border-yellow-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {['team1','team2'].map((team, ti) => (
            <div key={team} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <h2 className="font-bold text-base mb-4 border-b pb-2">{ti===0?'🔵':'🔴'} 隊伍 {ti+1}</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">隊伍名稱</label>
                  <input type="text" value={state[team]?.name||''} onChange={e => update(`${team}/name`, e.target.value)} className="w-full p-2 border rounded-lg outline-none text-sm font-bold focus:border-yellow-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">選手</label>
                  <textarea value={state[team]?.players||''} onChange={e => update(`${team}/players`, e.target.value)} rows={2} className="w-full p-2 border rounded-lg outline-none text-sm resize-none focus:border-yellow-400" placeholder="Player1, Player2, Player3" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h2 className="font-bold text-base mb-4 border-b pb-2">🎮 場次設定</h2>
          <div className="space-y-3">
            {state.games.map((g, i) => (
              <div key={i} className={`rounded-xl border p-4 ${g.status==='done'?'border-emerald-200 bg-emerald-50':g.status==='live'?'border-red-200 bg-red-50':g.status==='skip'?'opacity-50 bg-slate-50 border-slate-100':'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span className="font-black text-slate-600 text-sm">Game {i+1}</span>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(STATUS_LABELS).map(([k,v]) => (
                      <button key={k} onClick={() => updateGame(i,'status',k)} className={`px-2 py-1 rounded-lg text-xs font-bold transition ${g.status===k?'bg-yellow-400 text-slate-900':'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">模式圖示網址</label>
                    <input type="text" value={g.modeImage||''} onChange={e => updateGame(i,'modeImage',e.target.value)} placeholder="https://..." className="w-full p-1.5 border rounded-lg outline-none text-xs font-mono focus:border-yellow-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">地圖圖片網址</label>
                    <input type="text" value={g.mapImage||''} onChange={e => updateGame(i,'mapImage',e.target.value)} placeholder="https://..." className="w-full p-1.5 border rounded-lg outline-none text-xs font-mono focus:border-yellow-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">地圖名稱</label>
                    <input type="text" value={g.mapName||''} onChange={e => updateGame(i,'mapName',e.target.value)} placeholder="中心舞台" className="w-full p-1.5 border rounded-lg outline-none text-xs focus:border-yellow-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">比分（隊1 : 隊2）</label>
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" value={g.s1??''} onChange={e => updateGame(i,'s1',e.target.value===''?null:Number(e.target.value))} className="w-12 p-1.5 border rounded-lg outline-none text-sm font-black text-center focus:border-yellow-400" />
                      <span className="text-slate-300 font-bold">:</span>
                      <input type="number" min="0" value={g.s2??''} onChange={e => updateGame(i,'s2',e.target.value===''?null:Number(e.target.value))} className="w-12 p-1.5 border rounded-lg outline-none text-sm font-black text-center focus:border-yellow-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <button onClick={() => setShowPwChange(v => !v)} className="w-full flex items-center justify-between font-bold text-sm text-slate-700">
            <span className="flex items-center gap-2"><KeyRound size={15} className="text-yellow-500" /> 修改密碼</span>
            <span className="text-slate-400">{showPwChange?'▲':'▼'}</span>
          </button>
          {showPwChange && (
            <div className="mt-4 space-y-2">
              {[['原密碼',oldPw,setOldPw],['新密碼',newPw,setNewPw],['確認新密碼',cfmPw,setCfmPw]].map(([label,val,fn])=>(
                <div key={label}>
                  <label className="block text-xs text-slate-400 mb-1">{label}</label>
                  <input type="password" value={val} onChange={e=>{fn(e.target.value);setPwMsg(null);}} onKeyDown={e=>e.key==='Enter'&&changePw()} className="w-full p-2 border rounded-lg outline-none text-sm font-mono tracking-widest focus:border-yellow-400" />
                </div>
              ))}
              {pwMsg && <p className={`text-xs font-bold ${pwMsg.type==='ok'?'text-emerald-500':'text-red-500'}`}>{pwMsg.text}</p>}
              <button onClick={changePw} className="w-full mt-2 py-2 rounded-lg bg-yellow-400 text-slate-900 font-black text-sm hover:opacity-90">確認修改</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ScoreboardViewer({ onBack }) {
  const [state] = useScoreboard();
  const [layout, setLayout] = useState(DEFAULT_SB_LAYOUT);
  const [editMode, setEditMode] = useState(false);
  const draggingRef    = useRef(null);
  const resizingRef    = useRef(null);
  const dragOffRef     = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mx: 0, w: 0 });
  const layoutRef      = useRef(layout);
  const containerRef   = useRef(null);
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  const { team1, team2, background, roundLabel, winColor, maxWins = 3, games } = state;
  const { w1, w2 } = calcWins(games);
  const textDim = 'rgba(255,255,255,0.35)';

  useEffect(() => {
    const dbRef = ref(scoreboardDb, 'scoreboard_layout');
    const unsub = onValue(dbRef, snap => {
      const data = snap.val();
      if (data) setLayout({ ...DEFAULT_SB_LAYOUT, ...data });
    });
    return () => unsub();
  }, []);

  function saveLayout(l) { set(ref(scoreboardDb, 'scoreboard_layout'), l).catch(() => {}); }

  const bgStyle = background?.startsWith('http')
    ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: background || '#0d0d12' };

  function startDrag(e, key) {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const el = layoutRef.current[key];
    dragOffRef.current = { x: cx - rect.left - (el.x / 100) * rect.width, y: cy - rect.top - (el.y / 100) * rect.height };
    draggingRef.current = key;
  }
  function startResize(e, key) {
    e.preventDefault(); e.stopPropagation();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    resizeStartRef.current = { mx: cx, w: layoutRef.current[key].w };
    resizingRef.current = key;
  }
  function onMove(e) {
    const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    if (draggingRef.current) {
      const key = draggingRef.current;
      const x = Math.min(98, Math.max(0, ((cx - dragOffRef.current.x - rect.left) / rect.width) * 100));
      const y = Math.min(97, Math.max(0, ((cy - dragOffRef.current.y - rect.top) / rect.height) * 100));
      setLayout(l => ({ ...l, [key]: { ...l[key], x, y } }));
    }
    if (resizingRef.current) {
      const key = resizingRef.current;
      const newW = Math.max(60, resizeStartRef.current.w + (cx - resizeStartRef.current.mx));
      setLayout(l => ({ ...l, [key]: { ...l[key], w: newW } }));
    }
  }
  function onUp() {
    if (draggingRef.current || resizingRef.current) saveLayout(layoutRef.current);
    draggingRef.current = null; resizingRef.current = null;
  }
  function hideEl(key) { const l = { ...layoutRef.current, [key]: { ...layoutRef.current[key], visible: false } }; setLayout(l); saveLayout(l); }
  function resetLayout() { setLayout(DEFAULT_SB_LAYOUT); saveLayout(DEFAULT_SB_LAYOUT); }

  function Draggable({ id, children }) {
    const el = layout[id]; if (!el?.visible) return null;
    return (
      <div onMouseDown={e => startDrag(e, id)} onTouchStart={e => startDrag(e, id)}
        style={{ position:'absolute', left:`${el.x}%`, top:`${el.y}%`, width:el.w, cursor:editMode?'grab':'default', userSelect:'none', zIndex:10, outline:editMode?'1.5px dashed rgba(250,204,21,0.55)':'none', borderRadius:6 }}>
        {children}
        {editMode && (<>
          <button onMouseDown={e => { e.stopPropagation(); hideEl(id); }} style={{ position:'absolute',top:-9,right:-9,zIndex:200,width:20,height:20,borderRadius:'50%',background:'#ef4444',border:'2px solid #fff',color:'#fff',fontWeight:900,fontSize:11,cursor:'pointer',lineHeight:1,padding:0,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
          <div onMouseDown={e => startResize(e, id)} onTouchStart={e => startResize(e, id)} style={{ position:'absolute',bottom:-6,right:-6,zIndex:200,width:14,height:14,borderRadius:4,background:'#facc15',border:'2px solid #fff',cursor:'se-resize' }} />
        </>)}
      </div>
    );
  }

  function fs(w, base, min = 12, max = 80) { return Math.max(min, Math.min(max, (w || 110) / base)); }

  const visGames = games.slice(0, maxWins * 2 - 1);

  return (
    <div ref={containerRef}
      style={{ width:'100vw', height:'100vh', overflow:'hidden', position:'relative', ...bgStyle, fontFamily:'sans-serif' }}
      onMouseMove={onMove} onMouseUp={onUp} onTouchMove={onMove} onTouchEnd={onUp} translate="no">

      <button onClick={onBack} style={{ position:'absolute',top:10,left:10,zIndex:300,background:'rgba(0,0,0,0.55)',color:'#fff',border:'none',padding:'4px 12px',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer',opacity:0,transition:'opacity 0.3s' }} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=0}>← 首頁</button>
      <div style={{ position:'absolute',top:10,right:10,zIndex:300,display:'flex',gap:8 }}>
        {editMode && <button onClick={resetLayout} style={{ background:'rgba(239,68,68,0.85)',color:'#fff',border:'none',padding:'4px 12px',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer' }}>重置位置</button>}
        <button onClick={() => setEditMode(v => !v)} style={{ background:editMode?'#facc15':'rgba(0,0,0,0.45)',color:editMode?'#1e293b':'#fff',border:editMode?'none':'1px solid rgba(255,255,255,0.2)',padding:'4px 14px',borderRadius:7,fontSize:12,fontWeight:900,cursor:'pointer',opacity:editMode?1:0,transition:'opacity 0.3s' }} onMouseEnter={e=>{ if(!editMode) e.target.style.opacity=1; }} onMouseLeave={e=>{ if(!editMode) e.target.style.opacity=0; }}>{editMode?'✓ 完成':'✥ 編輯'}</button>
      </div>
      {editMode && <div style={{ position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',background:'rgba(250,204,21,0.9)',color:'#1e293b',padding:'5px 18px',borderRadius:18,fontSize:11,fontWeight:900,zIndex:300,pointerEvents:'none',whiteSpace:'nowrap' }}>拖曳移動 ｜ 右下角縮放 ｜ ✕ 隱藏 ｜「重置位置」還原</div>}

      <Draggable id="label">
        <div style={{ fontWeight:900, fontSize:fs(layout.label?.w||170,7,18,44), color:'rgba(255,255,255,0.9)' }}>{roundLabel||'八強'}</div>
      </Draggable>

      {visGames.map((g, i) => (
        <Draggable key={`mode_${i}`} id={`mode_${i}`}>
          {g.modeImage
            ? <img src={g.modeImage} alt="" style={{ width:'100%', height:'auto', objectFit:'contain' }} />
            : <div style={{ textAlign:'center', fontSize:fs(layout[`mode_${i}`]?.w||110,2.5,32,80), color:textDim, fontWeight:900 }}>?</div>
          }
        </Draggable>
      ))}

      {/* ── 地圖圖片（只在進行中時出現）── */}
      {visGames.map((g, i) => (
        g.status === 'live' ? (
          <Draggable key={`map_${i}`} id={`map_${i}`}>
            {g.mapImage ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <img src={g.mapImage} alt="" style={{ width:'100%', objectFit:'cover', borderRadius:6 }} />
                {g.mapName && <div style={{ fontSize:fs(layout[`map_${i}`]?.w||110,12,9,14), color:'rgba(255,255,255,0.6)', textAlign:'center', fontWeight:700, lineHeight:1.3 }}>{g.mapName}</div>}
              </div>
            ) : g.mapName ? (
              <div style={{ fontSize:fs(layout[`map_${i}`]?.w||110,10,10,16), color:'rgba(255,255,255,0.6)', textAlign:'center', fontWeight:700 }}>{g.mapName}</div>
            ) : <div style={{ fontSize:fs(layout[`map_${i}`]?.w||110,3,20,48), color:textDim, textAlign:'center', fontWeight:900 }}>🔴</div>}
          </Draggable>
        ) : null
      ))}

      <Draggable id="t1_name">
        <div>
          <div style={{ fontWeight:900, fontSize:fs(layout.t1_name?.w||220,10,14,36), color:'#fff', lineHeight:1.2 }}>{team1?.name||'Team 1'}</div>
          {team1?.players && <div style={{ fontSize:fs(layout.t1_name?.w||220,16,10,20), color:textDim, marginTop:3 }}>{team1.players}</div>}
        </div>
      </Draggable>

      {visGames.map((g, i) => {
        if (g.status === 'live') return null;
        const won = g.status==='done' && g.s1!=null && g.s2!=null && g.s1>g.s2;
        const elW = layout[`t1_${i}`]?.w||110;
        return (
          <Draggable key={`t1_${i}`} id={`t1_${i}`}>
            <div style={{ textAlign:'center', fontWeight:900 }}>
              {g.status==='skip'
                ? <span style={{ fontSize:fs(elW,3,20,64), color:textDim }}>—</span>
                : g.status==='done' && g.s1!=null
                  ? <span style={{ fontSize:fs(elW,1.8,28,90), color:won?'#fff':textDim }}>{g.s1}</span>
                  : <span style={{ fontSize:fs(elW,3,20,64), color:textDim }}>?</span>
              }
            </div>
          </Draggable>
        );
      })}

      <Draggable id="t1_wins">
        <div style={{ textAlign:'center', fontWeight:900, fontSize:fs(layout.t1_wins?.w||100,1.5,36,110), color:winColor||'#ec4899' }}>{w1}</div>
      </Draggable>

      <Draggable id="t2_name">
        <div>
          <div style={{ fontWeight:900, fontSize:fs(layout.t2_name?.w||220,10,14,36), color:'#fff', lineHeight:1.2 }}>{team2?.name||'Team 2'}</div>
          {team2?.players && <div style={{ fontSize:fs(layout.t2_name?.w||220,16,10,20), color:textDim, marginTop:3 }}>{team2.players}</div>}
        </div>
      </Draggable>

      {visGames.map((g, i) => {
        if (g.status === 'live') return null;
        const won = g.status==='done' && g.s1!=null && g.s2!=null && g.s2>g.s1;
        const elW = layout[`t2_${i}`]?.w||110;
        return (
          <Draggable key={`t2_${i}`} id={`t2_${i}`}>
            <div style={{ textAlign:'center', fontWeight:900 }}>
              {g.status==='skip'
                ? <span style={{ fontSize:fs(elW,3,20,64), color:textDim }}>—</span>
                : g.status==='done' && g.s2!=null
                  ? <span style={{ fontSize:fs(elW,1.8,28,90), color:won?'#fff':textDim }}>{g.s2}</span>
                  : <span style={{ fontSize:fs(elW,3,20,64), color:textDim }}>?</span>
              }
            </div>
          </Draggable>
        );
      })}

      <Draggable id="t2_wins">
        <div style={{ textAlign:'center', fontWeight:900, fontSize:fs(layout.t2_wins?.w||100,1.5,36,110), color:winColor||'#ec4899' }}>{w2}</div>
      </Draggable>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 抽獎系統（6 種模式，支援 300+ 人）
// ═══════════════════════════════════════════════════════════════════════════════

const LOTTERY_COLORS = ['#3b82f6','#ef4444','#22c55e','#f59e0b','#a855f7','#ec4899','#06b6d4','#f97316','#10b981','#6366f1'];

function LotteryApp({ onBack }) {
  const [rawText, setRawText]   = useState('');
  const [names, setNames]       = useState([]);
  const [pool, setPool]         = useState([]);
  const [winCount, setWinCount] = useState(1);
  const [mode, setMode]         = useState('flash');
  const [phase, setPhase]       = useState('idle'); // idle | running | done
  const [winners, setWinners]   = useState([]);
  const [history, setHistory]   = useState([]);
  const [removeWinners, setRemoveWinners] = useState(true);

  // mode-specific display state
  const [flashItems, setFlashItems]       = useState([]);
  const [flashFinal, setFlashFinal]       = useState([]);
  const [elimList, setElimList]           = useState([]);
  const [elimGone, setElimGone]           = useState(new Set());
  const [elimPending, setElimPending]     = useState(null);
  const [spotlight, setSpotlight]         = useState(-1);
  const [spotNames, setSpotNames]         = useState([]);
  const [matrixLines, setMatrixLines]     = useState([]);
  const [matrixWinner, setMatrixWinner]   = useState('');
  const [gridNames, setGridNames]         = useState([]);
  const [gridPick, setGridPick]           = useState(-1);
  const [bubbles, setBubbles]             = useState([]);
  const [bubbleWinners, setBubbleWinners] = useState([]);
  const [raceFinishers, setRaceFinishers] = useState([]);
  const [raceRunning, setRaceRunning]     = useState(false);
  const raceCanvasRef = useRef(null);

  // horse mode
  const [horses, setHorses] = useState([
    { emoji:'🍎', name:'蘋果', color:'#ef4444', pos:0 },
    { emoji:'🍌', name:'香蕉', color:'#eab308', pos:0 },
    { emoji:'🍇', name:'葡萄', color:'#8b5cf6', pos:0 },
    { emoji:'🍊', name:'橘子', color:'#f97316', pos:0 },
    { emoji:'🍉', name:'西瓜', color:'#22c55e', pos:0 },
  ]);
  const [hTrack, setHTrack]   = useState(20);
  const [hMin, setHMin]       = useState(0);
  const [hMax, setHMax]       = useState(5);
  const [hFinish, setHFinish] = useState([]);
  const [hCD, setHCD]         = useState(0);
  const hFinRef = useRef([]);

  const timerRef    = useRef(null);
  const itvRef      = useRef(null);
  const rafRef      = useRef(null);
  const stateRef    = useRef({});

  function parseNames(text) {
    return [...new Set(text.split(/[\n,、，]+/).map(s => s.trim()).filter(Boolean))];
  }
  function handleText(e) {
    setRawText(e.target.value);
    const p = parseNames(e.target.value);
    setNames(p); setPool(p);
  }
  function stopAll() {
    clearInterval(itvRef.current);
    clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
  }
  function doReset() {
    stopAll();
    setPhase('idle'); setWinners([]);
    setFlashItems([]); setFlashFinal([]);
    setElimList([]); setElimGone(new Set()); setElimPending(null);
    setSpotlight(-1); setSpotNames([]);
    setMatrixLines([]); setMatrixWinner('');
    setGridNames([]); setGridPick(-1);
    setBubbles([]); setBubbleWinners([]);
    setPool([...names]);
  }
  function pickFrom(arr, n) {
    const s = [...arr].sort(() => Math.random() - 0.5);
    return s.slice(0, n);
  }
  function finishDraw(picked) {
    stopAll();
    setWinners(picked);
    setPhase('done');
    const ts = new Date().toLocaleTimeString();
    setHistory(h => [...picked.map(name => ({ name, time: ts })), ...h]);
    if (removeWinners) setPool(p => p.filter(n => !picked.includes(n)));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 模式 1：⚡ 閃光 – 名字快速閃爍，慢慢停下
  // ──────────────────────────────────────────────────────────────────────────
  function startFlash() {
    const cur = [...pool];
    if (cur.length < winCount) return;
    const picked = pickFrom(cur, winCount);
    const show = Math.min(cur.length, Math.max(winCount * 3, 12), 30);
    let tick = 0, total = 45 + Math.floor(Math.random() * 15);
    setFlashFinal([]);
    itvRef.current = setInterval(() => {
      tick++;
      const sample = pickFrom(cur, show);
      setFlashItems(sample);
      if (tick >= total) {
        clearInterval(itvRef.current);
        setFlashItems(picked);
        setFlashFinal(picked);
        finishDraw(picked);
      }
    }, 50 + Math.floor(tick / total * 150));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 模式 2：💥 消除賽 – 逐一淘汰，越到後面越慢
  // ──────────────────────────────────────────────────────────────────────────
  function startEliminate() {
    const cur = [...pool];
    if (cur.length < winCount) return;
    const shuffled = [...cur].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, winCount);
    const toElim = shuffled.slice(winCount);
    setElimList(shuffled);
    setElimGone(new Set());
    setElimPending(null);
    stateRef.current = { toElim, picked, idx: 0 };

    function next() {
      const { toElim, picked, idx } = stateRef.current;
      if (idx >= toElim.length) { finishDraw(picked); return; }
      const name = toElim[idx];
      setElimPending(name);
      const pct = idx / toElim.length;
      const delay = pct < 0.5 ? 120 : pct < 0.8 ? 250 : pct < 0.95 ? 500 : 900;
      timerRef.current = setTimeout(() => {
        setElimGone(g => new Set([...g, name]));
        setElimPending(null);
        stateRef.current.idx++;
        timerRef.current = setTimeout(next, 60);
      }, delay);
    }
    timerRef.current = setTimeout(next, 300);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 模式 3：🔦 聚光燈 – 燈光掃過名字列表
  // ──────────────────────────────────────────────────────────────────────────
  function startSpotlight() {
    const cur = [...pool];
    if (cur.length < winCount) return;
    const picked = pickFrom(cur, winCount);
    const display = [...cur].sort(() => Math.random() - 0.5).slice(0, Math.min(cur.length, 40));
    // 確保 picked 都在 display 裡
    picked.forEach((p, i) => { if (!display.includes(p)) display[i] = p; });
    setSpotNames(display.sort(() => Math.random() - 0.5));
    setSpotlight(-1);
    stateRef.current = { picked, display: display.sort(() => Math.random() - 0.5), step: 0, total: 60 + display.length };

    function tick() {
      const s = stateRef.current;
      s.step++;
      const pct = s.step / s.total;
      const idx = Math.floor((pct * pct) * s.display.length) % s.display.length;
      setSpotlight(idx);
      const delay = 40 + pct * pct * 400;
      if (s.step < s.total) {
        timerRef.current = setTimeout(tick, delay);
      } else {
        const finalIdx = s.display.indexOf(s.picked[0]);
        setSpotlight(finalIdx >= 0 ? finalIdx : 0);
        timerRef.current = setTimeout(() => finishDraw(s.picked), 600);
      }
    }
    timerRef.current = setTimeout(tick, 200);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 模式 4：🌀 矩陣雨 – 綠色字符雨，最後顯示得獎者
  // ──────────────────────────────────────────────────────────────────────────
  function startMatrix() {
    const cur = [...pool];
    if (cur.length < winCount) return;
    const picked = pickFrom(cur, winCount);
    const COLS = 18;
    // 每列獨立滾動，每列顯示一個名字
    const colNames = Array.from({ length: COLS }, () => cur[Math.floor(Math.random() * cur.length)]);
    let tick = 0, total = 60;
    itvRef.current = setInterval(() => {
      tick++;
      const pct = tick / total;
      const lines = Array.from({ length: COLS }, (_, c) => {
        if (pct > 0.6 && c < winCount) return picked[c];
        return cur[Math.floor(Math.random() * cur.length)];
      });
      setMatrixLines(lines);
      if (tick >= total) {
        clearInterval(itvRef.current);
        setMatrixLines(Array.from({ length: COLS }, (_, c) => c < winCount ? picked[c] : ''));
        timerRef.current = setTimeout(() => finishDraw(picked), 500);
      }
    }, 80);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 模式 5：🎪 九宮格輪盤 – 格子上快速跑，最後停在得獎者
  // ──────────────────────────────────────────────────────────────────────────
  function startGrid() {
    const cur = [...pool];
    if (cur.length < winCount) return;
    const picked = pickFrom(cur, winCount);
    const SLOTS = 9;
    const grid = Array.from({ length: SLOTS }, (_, i) => {
      if (i < winCount) return picked[i];
      return cur[Math.floor(Math.random() * cur.length)];
    }).sort(() => Math.random() - 0.5);
    const winnerIdx = grid.indexOf(picked[0]);
    setGridNames(grid);
    setGridPick(-1);

    let idx = 0, tick = 0, total = 50;
    itvRef.current = setInterval(() => {
      tick++;
      const pct = tick / total;
      setGridPick(Math.floor(Math.random() * SLOTS));
      if (tick >= total) {
        clearInterval(itvRef.current);
        setGridPick(winnerIdx);
        timerRef.current = setTimeout(() => finishDraw(picked), 800);
      }
    }, 60 + Math.floor(tick / total * 200));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 模式 6：🫧 泡泡 – React state 版，不用 Canvas，不卡死
  // ──────────────────────────────────────────────────────────────────────────
  function startBubble() {
    const cur = [...pool];
    if (cur.length < winCount) return;
    const picked = pickFrom(cur, winCount);
    const count = Math.min(cur.length, 40); // 最多 40 顆
    const sample = [...cur].sort(() => Math.random() - 0.5).slice(0, count);
    picked.forEach((p, i) => { if (!sample.includes(p)) sample[i] = p; });

    const initial = sample.map((name, i) => ({
      id: i, name,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: LOTTERY_COLORS[i % LOTTERY_COLORS.length],
      r: 44,
    }));
    setBubbles(initial);
    setBubbleWinners([]);
    stateRef.current = { bubbles: initial, picked, tick: 0, total: 120 };

    function frame() {
      const s = stateRef.current;
      s.tick++;
      const decay = s.tick < s.total * 0.6 ? 0.998 : 0.97;
      const next = s.bubbles.map(b => {
        let x = b.x + b.vx * 0.5;
        let y = b.y + b.vy * 0.5;
        let vx = b.vx * decay;
        let vy = b.vy * decay;
        if (x < 5)  { x = 5;  vx = Math.abs(vx); }
        if (x > 95) { x = 95; vx = -Math.abs(vx); }
        if (y < 5)  { y = 5;  vy = Math.abs(vy); }
        if (y > 95) { y = 95; vy = -Math.abs(vy); }
        return { ...b, x, y, vx, vy };
      });
      s.bubbles = next;
      setBubbles([...next]);
      if (s.tick < s.total) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        setBubbleWinners(s.picked);
        timerRef.current = setTimeout(() => finishDraw(s.picked), 800);
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 模式 7：🏁 迷宮賽跑 – 300 個數字在迷宮裡賽跑
  // ──────────────────────────────────────────────────────────────────────────
  function startRace() {
    const cur = [...pool];
    if (cur.length < winCount) return;

    setRaceFinishers([]);
    setRaceRunning(true);

    setTimeout(() => {
      const canvas = raceCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;

      // ── 隨機生成迷宮牆壁（每次不同）──
      const WALL_COUNT = 5 + Math.floor(Math.random() * 4); // 5~8 道牆
      const walls = [];
      for (let i = 0; i < WALL_COUNT; i++) {
        const xPct = 0.12 + (i / WALL_COUNT) * 0.75 + (Math.random() - 0.5) * 0.04;
        const gapH = H * (0.15 + Math.random() * 0.18); // 缺口高度 15%~33%
        const gapY = Math.random() * (H - gapH);
        // 有些牆有兩個缺口（更有趣）
        const hasTwoGaps = Math.random() > 0.65;
        const gap2H = hasTwoGaps ? H * (0.12 + Math.random() * 0.12) : 0;
        const gap2Y = hasTwoGaps ? Math.random() * (H - gap2H) : 0;
        walls.push({ x: W * xPct, gapY, gapH, gap2Y, gap2H, hasTwoGaps });
      }

      const startX = 30;
      const finishX = W - 25;
      const n = cur.length;
      const runnerR = n > 250 ? 5 : n > 150 ? 7 : n > 80 ? 9 : n > 30 ? 11 : 13;

      // ── 初始化賽跑者（速度差異更大 → 更刺激）──
      const runners = cur.map((name, i) => ({
        id: i, name, num: i + 1,
        x: startX - 10 + Math.random() * 20,
        y: runnerR + Math.random() * (H - runnerR * 2),
        vy: 0,
        speed: 0.25 + Math.random() * 0.55,  // 降速讓賽程拉長到 ~20 秒
        boost: 0,  // 加速 buff
        color: `hsl(${(i * 47 + Math.random() * 20) % 360}, 72%, 58%)`,
        r: runnerR,
        finished: false,
        rank: 0,
        trail: [],  // 軌跡
      }));

      stateRef.current = {
        runners, walls, finishers: [], W, H, startX, finishX,
        frame: 0, doneTimer: null,
        particles: [],  // 粒子特效
        stars: Array.from({ length: 40 }, () => ({ x: Math.random()*W, y: Math.random()*H, s: 0.5+Math.random()*1.5, b: Math.random() })),
      };

      const targetFinishers = Math.min(winCount, n);

      // ── 隨機事件：每隔幾秒給隨機幾個人加速 ──
      const boostItv = setInterval(() => {
        const s = stateRef.current;
        const active = s.runners.filter(r => !r.finished);
        const lucky = Math.floor(active.length * (0.05 + Math.random() * 0.1));
        for (let i = 0; i < lucky; i++) {
          const r = active[Math.floor(Math.random() * active.length)];
          if (r) r.boost = 40 + Math.floor(Math.random() * 30); // 持續 40~70 幀
        }
      }, 2500);
      itvRef.current = boostItv;

      // ── 繪製背景與牆壁 ──
      function drawScene() {
        const s = stateRef.current;
        s.frame++;

        // 深色背景
        ctx.fillStyle = '#080818';
        ctx.fillRect(0, 0, W, H);

        // 星星背景（閃爍）
        s.stars.forEach(st => {
          st.b += 0.02 + Math.random() * 0.01;
          const alpha = 0.15 + Math.abs(Math.sin(st.b)) * 0.35;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2);
          ctx.fill();
        });

        // 起跑線（脈動）
        const startAlpha = 0.3 + Math.sin(s.frame * 0.06) * 0.15;
        ctx.strokeStyle = `rgba(34,197,94,${startAlpha})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(startX, 0); ctx.lineTo(startX, H); ctx.stroke();
        ctx.setLineDash([]);

        // 終點線（金色脈動 + 格紋）
        const finAlpha = 0.5 + Math.sin(s.frame * 0.08) * 0.3;
        ctx.strokeStyle = `rgba(250,204,21,${finAlpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(finishX, 0); ctx.lineTo(finishX, H); ctx.stroke();
        // 終點格紋
        const sq = 8;
        for (let y = 0; y < H; y += sq) {
          for (let dx = 0; dx < 12; dx += sq) {
            const isWhite = ((y / sq + dx / sq) % 2 === 0);
            ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
            ctx.fillRect(finishX + 2 + dx, y, sq, sq);
          }
        }
        ctx.fillStyle = 'rgba(250,204,21,0.9)';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁', finishX + 8, 20);

        // 牆壁（磚牆質感 + 缺口發光）
        walls.forEach(w => {
          const wallW = 10;
          // 上段牆
          drawBrickWall(ctx, w.x - wallW/2, 0, wallW, w.gapY, s.frame);
          // 下段牆
          const belowY = w.gapY + w.gapH;
          if (w.hasTwoGaps) {
            // 中間段
            const midEnd = w.gap2Y;
            const midStart = belowY;
            if (midEnd > midStart) drawBrickWall(ctx, w.x - wallW/2, midStart, wallW, midEnd - midStart, s.frame);
            // 第二缺口下段
            drawBrickWall(ctx, w.x - wallW/2, w.gap2Y + w.gap2H, wallW, H - (w.gap2Y + w.gap2H), s.frame);
          } else {
            drawBrickWall(ctx, w.x - wallW/2, belowY, wallW, H - belowY, s.frame);
          }
          // 缺口邊緣光暈
          const glowAlpha = 0.3 + Math.sin(s.frame * 0.05 + w.x) * 0.15;
          ctx.fillStyle = `rgba(59,130,246,${glowAlpha})`;
          ctx.fillRect(w.x - wallW/2 - 2, w.gapY, wallW + 4, 3);
          ctx.fillRect(w.x - wallW/2 - 2, w.gapY + w.gapH - 3, wallW + 4, 3);
          if (w.hasTwoGaps) {
            ctx.fillRect(w.x - wallW/2 - 2, w.gap2Y, wallW + 4, 3);
            ctx.fillRect(w.x - wallW/2 - 2, w.gap2Y + w.gap2H - 3, wallW + 4, 3);
          }
        });

        // 粒子
        s.particles = s.particles.filter(p => p.life > 0);
        s.particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.life--;
          ctx.globalAlpha = p.life / p.maxLife;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }

      function drawBrickWall(c, x, y, w, h, frame) {
        if (h <= 0) return;
        const brickH = 8, brickW = w;
        for (let by = y; by < y + h; by += brickH) {
          const bh = Math.min(brickH, y + h - by);
          const shade = 0.25 + Math.sin(frame * 0.02 + by * 0.1) * 0.05;
          c.fillStyle = `rgba(100,116,139,${shade})`;
          c.fillRect(x, by, brickW, bh - 1);
          c.fillStyle = 'rgba(255,255,255,0.06)';
          c.fillRect(x, by, brickW, 1);
        }
      }

      function drawRunners() {
        const s = stateRef.current;
        const rs = [...s.runners].sort((a, b) => a.x - b.x);

        rs.forEach(r => {
          // 軌跡
          if (r.trail.length > 1) {
            ctx.strokeStyle = r.boost > 0 ? `rgba(250,204,21,0.15)` : `rgba(255,255,255,0.04)`;
            ctx.lineWidth = r.r * 0.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            r.trail.forEach((pt, i) => { i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y); });
            ctx.stroke();
          }

          const isTop = r.finished && r.rank <= 3;
          const isWin = r.finished && r.rank <= targetFinishers;
          const isBoosted = r.boost > 0;

          // 光暈
          if (isTop || isBoosted) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.r + 4, 0, Math.PI * 2);
            const glow = ctx.createRadialGradient(r.x, r.y, r.r * 0.5, r.x, r.y, r.r + 6);
            glow.addColorStop(0, isTop ? 'rgba(250,204,21,0.5)' : 'rgba(59,130,246,0.5)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fill();
          }

          // 球體
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
          if (isTop) {
            const g = ctx.createRadialGradient(r.x - r.r*0.3, r.y - r.r*0.3, 0, r.x, r.y, r.r);
            g.addColorStop(0, '#fff');
            g.addColorStop(0.3, '#facc15');
            g.addColorStop(1, '#d97706');
            ctx.fillStyle = g;
          } else if (isBoosted) {
            ctx.fillStyle = '#60a5fa';
          } else {
            ctx.fillStyle = r.color;
          }
          ctx.fill();
          if (isTop) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // 數字
          ctx.fillStyle = (isTop || isBoosted) ? '#1e293b' : '#fff';
          ctx.font = `bold ${Math.max(7, r.r * 0.85)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(r.num, r.x, r.y);

          // 排名標記
          if (isTop && r.finished) {
            const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉';
            ctx.font = `${r.r}px sans-serif`;
            ctx.fillText(medal, r.x, r.y - r.r - 6);
          }
        });
      }

      function isInGap(wall, y, r) {
        if (y + r > wall.gapY && y - r < wall.gapY + wall.gapH) return true;
        if (wall.hasTwoGaps && y + r > wall.gap2Y && y - r < wall.gap2Y + wall.gap2H) return true;
        return false;
      }

      function nearestGapCenter(wall, y) {
        const c1 = wall.gapY + wall.gapH / 2;
        if (!wall.hasTwoGaps) return c1;
        const c2 = wall.gap2Y + wall.gap2H / 2;
        return Math.abs(y - c1) < Math.abs(y - c2) ? c1 : c2;
      }

      function stepPhysics() {
        const s = stateRef.current;
        const { runners, walls, H, finishX } = s;

        for (const r of runners) {
          if (r.finished) continue;

          // 加速 buff 倒數
          if (r.boost > 0) r.boost--;
          const speedMult = r.boost > 0 ? 1.8 : 1;

          // 找前方最近的牆
          const nextWall = walls.find(w => w.x > r.x - 8 && w.x < r.x + r.speed * 120);

          if (nextWall) {
            const gapC = nearestGapCenter(nextWall, r.y);
            const dy = gapC - r.y;
            const dist = Math.abs(nextWall.x - r.x);
            const urgency = Math.max(0.015, 0.1 - dist / 1500);
            r.vy = r.vy * 0.82 + dy * urgency + (Math.random() - 0.5) * 0.6;
          } else {
            r.vy = r.vy * 0.9 + (Math.random() - 0.5) * 0.3;
          }
          r.vy = Math.max(-3, Math.min(3, r.vy));

          const newX = r.x + r.speed * speedMult;
          const newY = r.y + r.vy;

          // 牆碰撞
          let blocked = false;
          for (const w of walls) {
            if (r.x < w.x && newX >= w.x - 5 && newX <= w.x + 8) {
              if (!isInGap(w, newY, r.r * 0.5)) {
                blocked = true;
                const gapC = nearestGapCenter(w, r.y);
                r.vy = r.y < gapC ? 2 : -2;
                break;
              }
            }
          }

          if (!blocked) r.x = newX;
          r.y = Math.max(r.r, Math.min(H - r.r, newY));

          // 軌跡（最近 8 幀）
          r.trail.push({ x: r.x, y: r.y });
          if (r.trail.length > 8) r.trail.shift();

          // 抵達終點
          if (r.x >= finishX - r.r && !r.finished) {
            r.x = finishX;
            r.finished = true;
            r.rank = s.finishers.length + 1;
            s.finishers.push(r.name);
            // 撒花粒子
            for (let p = 0; p < 12; p++) {
              s.particles.push({
                x: r.x, y: r.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 30 + Math.random() * 20,
                maxLife: 50,
                size: 2 + Math.random() * 3,
                color: r.rank <= 3 ? '#facc15' : r.color,
              });
            }
          }
        }

        if (s.finishers.length >= targetFinishers && !s.doneTimer) {
          s.doneTimer = setTimeout(() => {
            clearInterval(boostItv);
            const picked = s.finishers.slice(0, targetFinishers);
            setRaceRunning(false);
            setRaceFinishers([...s.finishers]);
            finishDraw(picked);
          }, 1200);
        }
      }

      function animate() {
        const s = stateRef.current;
        stepPhysics();
        drawScene();
        drawRunners();
        setRaceFinishers([...s.finishers]);

        if (s.finishers.length < s.runners.length && !s.doneTimer) {
          rafRef.current = requestAnimationFrame(animate);
        } else if (!s.doneTimer) {
          clearInterval(boostItv);
          const picked = s.finishers.slice(0, targetFinishers);
          setRaceRunning(false);
          finishDraw(picked);
        } else {
          rafRef.current = requestAnimationFrame(animate);
        }
      }

      drawScene();
      drawRunners();
      rafRef.current = requestAnimationFrame(animate);
    }, 100);
  }

  // ── 模式 8：🏇 賽馬 ──────────────────────────────────────────────────────────
  function startHorse() {
    setHorses(h => h.map(x => ({ ...x, pos: 0 })));
    setHFinish([]); hFinRef.current = [];
    setHCD(3);
    let c = 3;
    const cdItv = setInterval(() => {
      c--;
      setHCD(c);
      if (c <= 0) {
        clearInterval(cdItv);
        setHCD(0);
        // 開跑
        itvRef.current = setInterval(() => {
          setHorses(prev => {
            const next = prev.map(h => {
              if (h.pos >= hTrack) return h;
              const step = hMin + Math.floor(Math.random() * (hMax - hMin + 1));
              return { ...h, pos: Math.min(h.pos + step, hTrack) };
            });
            const nf = [...hFinRef.current];
            next.forEach(h => {
              if (h.pos >= hTrack && !nf.find(f => f.name === h.name))
                nf.push({ emoji: h.emoji, name: h.name, rank: nf.length + 1 });
            });
            hFinRef.current = nf;
            setHFinish([...nf]);
            if (nf.length >= next.length) {
              clearInterval(itvRef.current);
              setPhase('done');
              setWinners(nf.map(f => `${f.emoji} ${f.name}`));
              const ts = new Date().toLocaleTimeString();
              setHistory(hist => [{ name: `🥇${nf[0]?.emoji}${nf[0]?.name}`, time: ts }, ...hist]);
            }
            return next;
          });
        }, 1000);
      }
    }, 700);
    timerRef.current = cdItv;
  }

  function handleStart() {
    stopAll();
    setPhase('running');
    setWinners([]); setFlashFinal([]); setBubbleWinners([]);
    if (mode === 'flash')     startFlash();
    if (mode === 'eliminate') startEliminate();
    if (mode === 'spotlight') startSpotlight();
    if (mode === 'matrix')    startMatrix();
    if (mode === 'grid')      startGrid();
    if (mode === 'bubble')    startBubble();
    if (mode === 'race')      startRace();
    if (mode === 'horse')     startHorse();
  }

  const MODES = [
    { id:'flash',     e:'⚡', label:'閃光',   desc:'名字高速閃爍後揭曉' },
    { id:'eliminate', e:'💥', label:'消除賽', desc:'逐一淘汰到最後' },
    { id:'spotlight', e:'🔦', label:'聚光燈', desc:'燈光掃過名單停下' },
    { id:'matrix',    e:'🌀', label:'矩陣雨', desc:'字符雨中浮現贏家' },
    { id:'grid',      e:'🎪', label:'九宮格', desc:'格子輪盤停在贏家' },
    { id:'bubble',    e:'🫧', label:'泡泡球', desc:'彩球飛舞最後金球' },
    { id:'race',      e:'🏁', label:'迷宮賽跑', desc:'數字在迷宮賽跑前幾名得獎' },
    { id:'horse',     e:'🏇', label:'賽馬', desc:'水果賽馬競速' },
  ];

  const dim = 'rgba(255,255,255,0.4)';
  const cannotStart = phase === 'running' || (mode !== 'horse' && (pool.length < winCount || names.length === 0));

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d1a', color:'#fff', fontFamily:'sans-serif', display:'flex', flexDirection:'column' }} translate="no">
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#1e293b}::-webkit-scrollbar-thumb{background:#475569;border-radius:3px}
        @keyframes popIn{0%{transform:scale(0.3);opacity:0}70%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}
        @keyframes shimmer{0%,100%{background-position:-200% center}50%{background-position:200% center}}
        @keyframes matrixFall{0%{transform:translateY(-20px);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes pulse2{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        .winner-pop{animation:popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .shimmer-text{background:linear-gradient(90deg,#facc15,#fff,#facc15);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 2s linear infinite}
        .pulse-gold{animation:pulse2 0.8s ease-in-out infinite}
        .matrix-cell{animation:matrixFall 0.1s ease-out}
      `}</style>

      {/* Header */}
      <div style={{ background:'rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.1)', padding:'12px 20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:dim, cursor:'pointer', fontWeight:700, fontSize:14 }}>← 首頁</button>
        <h1 style={{ fontSize:20, fontWeight:900 }}>🎰 抽獎系統</h1>
        <div style={{ marginLeft:'auto', display:'flex', gap:6, flexWrap:'wrap' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); doReset(); }} style={{
              padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', transition:'all 0.2s',
              background: mode===m.id ? '#facc15' : 'rgba(255,255,255,0.08)',
              color: mode===m.id ? '#1e293b' : 'rgba(255,255,255,0.65)',
            }}>{m.e} {m.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        {/* ── 左側設定 ── */}
        <div style={{ width:250, borderRight:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', padding:16, gap:12, overflowY:'auto', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:dim, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>名單 ({names.length} 人 / 剩 {pool.length})</div>
            <textarea value={rawText} onChange={handleText}
              placeholder={'每行一個名字或逗號分隔\n支援 300+ 人\n\n例：\n小明\n小花,大雄\n志玲姐姐'}
              style={{ width:'100%', height:200, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#fff', fontSize:13, padding:10, resize:'vertical', outline:'none', lineHeight:1.7 }} />
          </div>

          <div>
            <div style={{ fontSize:11, fontWeight:700, color:dim, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>抽出人數</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => setWinCount(w => Math.max(1, w-1))} style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', fontSize:18, fontWeight:900, cursor:'pointer' }}>−</button>
              <input type="number" min="1" value={winCount} onChange={e => setWinCount(Math.max(1, parseInt(e.target.value)||1))}
                style={{ width:56, textAlign:'center', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#fff', fontSize:18, fontWeight:900, padding:'3px 0', outline:'none' }} />
              <button onClick={() => setWinCount(w => w+1)} style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', fontSize:18, fontWeight:900, cursor:'pointer' }}>＋</button>
            </div>
          </div>

          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <div onClick={() => setRemoveWinners(v => !v)} style={{ width:34, height:19, borderRadius:10, background:removeWinners?'#facc15':'rgba(255,255,255,0.15)', transition:'all 0.2s', position:'relative', cursor:'pointer', flexShrink:0 }}>
              <div style={{ position:'absolute', top:2, left:removeWinners?16:2, width:15, height:15, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
            </div>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>抽出後移除</span>
          </label>

          <div style={{ display:'flex', gap:6 }}>
            <button onClick={doReset} style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.6)', padding:'7px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer' }}>↺ 重置</button>
            <button onClick={() => { setPool([...names]); doReset(); }} style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.6)', padding:'7px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer' }}>♻ 還原名單</button>
          </div>

          {/* 歷史 */}
          <div style={{ fontSize:11, fontWeight:700, color:dim, letterSpacing:'0.08em', textTransform:'uppercase', display:'flex', justifyContent:'space-between' }}>
            <span>紀錄</span>
            <button onClick={() => setHistory([])} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.25)', fontSize:11, cursor:'pointer' }}>清除</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
            {history.length === 0 && <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', textAlign:'center', padding:'10px 0' }}>尚無紀錄</div>}
            {history.slice(0, 60).map((h, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.05)', borderRadius:8, padding:'5px 10px', borderLeft:'2px solid #facc15', fontSize:12, fontWeight:700 }}>
                {h.name} <span style={{ fontSize:10, color:dim, fontWeight:400 }}>{h.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 主畫面 ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:20, position:'relative', overflow:'hidden', minWidth:0 }}>

          {/* ⚡ 閃光 */}
          {mode === 'flash' && (
            <div style={{ width:'100%', maxWidth:700, minHeight:220, background:'rgba(255,255,255,0.03)', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)', padding:20, display:'flex', flexWrap:'wrap', gap:8, alignContent:'center', justifyContent:'center' }}>
              {flashItems.length === 0 && phase==='idle' && <span style={{ color:dim, fontSize:15, fontWeight:700 }}>輸入名單後按開始</span>}
              {flashItems.map((n, i) => {
                const isW = flashFinal.includes(n);
                return (
                  <div key={n+i} style={{
                    padding:'8px 18px', borderRadius:50, fontWeight:900, fontSize:Math.max(12, Math.min(20, 280/Math.max(flashItems.length,1))),
                    background: isW ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.07)',
                    border: `2px solid ${isW ? '#facc15' : 'rgba(255,255,255,0.1)'}`,
                    color: isW ? '#facc15' : '#fff',
                    transform: isW ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isW ? '0 0 20px rgba(250,204,21,0.4)' : 'none',
                    transition:'all 0.15s',
                  }}>{n}</div>
                );
              })}
            </div>
          )}

          {/* 💥 消除賽 */}
          {mode === 'eliminate' && (
            <div style={{ width:'100%', maxWidth:820, maxHeight:'58vh', overflowY:'auto', background:'rgba(255,255,255,0.03)', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)', padding:20 }}>
              {elimList.length === 0 && phase==='idle' && <div style={{ color:dim, fontSize:15, fontWeight:700, textAlign:'center', padding:40 }}>輸入名單後按開始</div>}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
                {elimList.map((n, i) => {
                  const gone   = elimGone.has(n);
                  const active = elimPending === n;
                  const win    = phase==='done' && winners.includes(n);
                  return (
                    <div key={n+i} style={{
                      padding:'7px 16px', borderRadius:50, fontWeight:800, fontSize:14,
                      background: win ? 'rgba(250,204,21,0.2)' : active ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)',
                      border: `2px solid ${win?'#facc15':active?'#ef4444':'rgba(255,255,255,0.1)'}`,
                      color: win ? '#facc15' : '#fff',
                      opacity: gone ? 0.1 : 1,
                      transform: active ? 'scale(1.15)' : win ? 'scale(1.08)' : gone ? 'scale(0.85)' : 'scale(1)',
                      transition:'all 0.2s',
                      userSelect:'none',
                      boxShadow: win ? '0 0 20px rgba(250,204,21,0.4)' : 'none',
                    }}>{n}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🔦 聚光燈 */}
          {mode === 'spotlight' && (
            <div style={{ width:'100%', maxWidth:740, background:'rgba(0,0,0,0.6)', borderRadius:20, padding:20, minHeight:200, position:'relative', overflow:'hidden' }}>
              {spotNames.length === 0 && phase==='idle' && <div style={{ color:dim, fontSize:15, fontWeight:700, textAlign:'center', padding:40 }}>輸入名單後按開始</div>}
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
                {spotNames.map((n, i) => {
                  const lit = spotlight === i;
                  const win = phase==='done' && winners.includes(n);
                  return (
                    <div key={n+i} style={{
                      padding:'8px 18px', borderRadius:50, fontWeight:900, fontSize:15,
                      background: win ? 'rgba(250,204,21,0.25)' : lit ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.04)',
                      color: win ? '#facc15' : lit ? '#0d0d1a' : 'rgba(255,255,255,0.2)',
                      border: `2px solid ${win?'#facc15':lit?'#fff':'rgba(255,255,255,0.06)'}`,
                      transform: (lit||win) ? 'scale(1.12)' : 'scale(1)',
                      boxShadow: lit ? '0 0 30px rgba(255,255,255,0.6)' : win ? '0 0 25px rgba(250,204,21,0.5)' : 'none',
                      transition:'all 0.08s',
                    }}>{n}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🌀 矩陣雨 */}
          {mode === 'matrix' && (
            <div style={{ width:'100%', maxWidth:780, background:'#000', borderRadius:20, padding:'20px 12px', minHeight:240, fontFamily:'monospace' }}>
              {matrixLines.length === 0 && phase==='idle' && <div style={{ color:'#00ff41', fontSize:14, fontWeight:700, textAlign:'center', padding:40, opacity:0.5 }}>{'> 輸入名單後按開始_'}</div>}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 10px', justifyContent:'center' }}>
                {matrixLines.map((n, i) => {
                  const isWin = phase==='done' && winners.includes(n);
                  const isEmpty = !n;
                  return (
                    <div key={i} className={phase==='running'?'matrix-cell':''} style={{
                      fontSize: Math.max(12, Math.min(18, 580 / Math.max(matrixLines.length, 1))),
                      fontWeight: 900,
                      color: isEmpty ? 'transparent' : isWin ? '#facc15' : `rgba(0,255,65,${0.4 + Math.random() * 0.6})`,
                      textShadow: isWin ? '0 0 20px #facc15' : n ? '0 0 8px #00ff41' : 'none',
                      padding:'2px 6px',
                      transition:'color 0.2s',
                    }}>{n || '.'}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🎪 九宮格 */}
          {mode === 'grid' && (
            <div style={{ width:'100%', maxWidth:480 }}>
              {gridNames.length === 0 && phase==='idle' && <div style={{ color:dim, fontSize:15, fontWeight:700, textAlign:'center', padding:40 }}>輸入名單後按開始</div>}
              {gridNames.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {gridNames.map((n, i) => {
                    const active = gridPick === i;
                    const win    = phase==='done' && i === gridPick;
                    return (
                      <div key={i} style={{
                        background: win ? 'rgba(250,204,21,0.25)' : active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
                        border: `2px solid ${win?'#facc15':active?'#fff':'rgba(255,255,255,0.1)'}`,
                        borderRadius:14, padding:'20px 10px', textAlign:'center',
                        fontWeight:900, fontSize:Math.max(11,Math.min(18,140/Math.max(n.length,1))),
                        color: win ? '#facc15' : active ? '#fff' : 'rgba(255,255,255,0.6)',
                        transform: (active||win) ? 'scale(1.06)' : 'scale(1)',
                        boxShadow: win ? '0 0 30px rgba(250,204,21,0.5)' : active ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
                        transition:'all 0.08s',
                        userSelect:'none',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>{n}</div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 🫧 泡泡 - React DOM 版，不卡 */}
          {mode === 'bubble' && (
            <div style={{ width:'100%', maxWidth:600, height:360, background:'rgba(255,255,255,0.03)', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)', position:'relative', overflow:'hidden' }}>
              {bubbles.length === 0 && phase==='idle' && (
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:dim, fontSize:15, fontWeight:700 }}>輸入名單後按開始</div>
              )}
              {bubbles.map(b => {
                const isWin = bubbleWinners.includes(b.name);
                return (
                  <div key={b.id} className={isWin ? 'pulse-gold' : ''} style={{
                    position:'absolute',
                    left: `${b.x}%`, top: `${b.y}%`,
                    width: b.r * 2, height: b.r * 2,
                    marginLeft: -b.r, marginTop: -b.r,
                    borderRadius:'50%',
                    background: isWin ? '#facc15' : b.color,
                    border: `3px solid ${isWin?'#fff':b.color}`,
                    boxShadow: isWin ? '0 0 24px #facc15' : 'none',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontWeight:900, fontSize:Math.max(9, Math.min(15, b.r * 0.55)),
                    color: isWin ? '#1e293b' : '#fff',
                    overflow:'hidden',
                    pointerEvents:'none',
                    transition:'background 0.3s, box-shadow 0.3s',
                  }}>
                    <span style={{ textAlign:'center', padding:'0 4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: b.r * 1.8 }}>
                      {b.name.length > 6 ? b.name.slice(0,5)+'…' : b.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 🏁 迷宮賽跑 */}
          {mode === 'race' && (
            <div style={{ width:'100%', maxWidth:900, display:'flex', gap:12 }}>
              {/* Canvas 賽道 */}
              <div style={{ flex:1, minWidth:0 }}>
                <canvas ref={raceCanvasRef} width={720} height={440}
                  style={{ width:'100%', height:'auto', borderRadius:16, background:'#0a0a14', border:'1px solid rgba(255,255,255,0.1)', display:'block' }} />
                {!raceRunning && phase==='idle' && (
                  <div style={{ textAlign:'center', marginTop:12, color:dim, fontSize:14, fontWeight:700 }}>
                    💡 {names.length} 位參賽者 · 前 {winCount} 名獲獎
                  </div>
                )}
              </div>

              {/* 排行榜 */}
              <div style={{ width:170, flexShrink:0, background:'rgba(255,255,255,0.04)', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', padding:12, maxHeight:440, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                <div style={{ fontSize:11, fontWeight:700, color:dim, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, textAlign:'center', flexShrink:0 }}>🏆 排行榜</div>
                <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
                  {raceFinishers.length === 0 && phase!=='running' && (
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', textAlign:'center', padding:'20px 0' }}>尚未開始</div>
                  )}
                  {raceFinishers.map((name, i) => {
                    const isTop3 = i < 3;
                    const isWin = i < winCount;
                    const emoji = i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : `${i+1}.`;
                    return (
                      <div key={i} style={{
                        padding:'6px 8px', borderRadius:8,
                        background: isWin ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isWin?'rgba(250,204,21,0.4)':'rgba(255,255,255,0.08)'}`,
                        fontSize:12, fontWeight:800,
                        color: isTop3 ? '#facc15' : isWin ? '#fff' : 'rgba(255,255,255,0.6)',
                        display:'flex', gap:6, alignItems:'center',
                      }}>
                        <span style={{ fontSize: isTop3?14:11, minWidth:22 }}>{emoji}</span>
                        <span style={{ flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 🏇 賽馬 */}
          {mode === 'horse' && (
            <div style={{ width:'100%', maxWidth:900, position:'relative' }}>
              {/* 倒數 */}
              {hCD > 0 && (
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:30, background:'rgba(0,0,0,0.6)', borderRadius:20, backdropFilter:'blur(4px)' }}>
                  <div style={{ fontSize:'clamp(72px,14vw,160px)', fontWeight:900, color:'#facc15', textShadow:'0 0 50px rgba(250,204,21,0.6)' }}>{hCD}</div>
                </div>
              )}

              {/* 賽道 */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {horses.map((h, hi) => {
                  const pct = Math.min(h.pos / hTrack, 1);
                  const isFinished = h.pos >= hTrack;
                  const rank = hFinish.findIndex(f => f.name === h.name);
                  const isFirst = rank === 0 && isFinished;
                  return (
                    <div key={hi} style={{ display:'flex', alignItems:'center', gap:8, height:'clamp(44px,7vh,64px)' }}>
                      <div style={{ width:70, flexShrink:0, textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}>
                        {isFinished && rank >= 0 && <span style={{ fontSize:13 }}>{rank===0?'🥇':rank===1?'🥈':rank===2?'🥉':`${rank+1}`}</span>}
                        <span style={{ fontWeight:800, fontSize:13, color:h.color }}>{h.name}</span>
                      </div>
                      <div style={{ flex:1, position:'relative', height:'100%', background:`${h.color}0a`, borderRadius:10, overflow:'hidden' }}>
                        {/* 終點線 */}
                        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:3, background:'rgba(250,204,21,0.4)' }} />
                        {/* 進度 */}
                        <div style={{
                          position:'absolute', left:0, top:'18%', bottom:'18%',
                          width:`${pct * 100}%`,
                          background:`linear-gradient(90deg, ${h.color}10, ${h.color}35)`,
                          borderRadius:8, transition:'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                        }} />
                        {/* emoji */}
                        <div style={{
                          position:'absolute',
                          left:`calc(${pct * 100}% - ${pct > 0.5 ? 28 : -2}px)`,
                          top:'50%', transform:'translateY(-50%)',
                          fontSize:'clamp(22px,3.5vh,36px)',
                          transition:'left 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                          filter: isFirst ? 'drop-shadow(0 0 8px rgba(250,204,21,0.8))' : 'none',
                          zIndex:5,
                        }}>{h.emoji}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 賽馬設定（小型行內） */}
              {phase === 'idle' && (
                <div style={{ marginTop:16, background:'rgba(255,255,255,0.04)', borderRadius:14, padding:14, border:'1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700 }}>格數</span>
                      <input type="number" min="5" max="100" value={hTrack} onChange={e => setHTrack(Math.max(5, parseInt(e.target.value)||20))}
                        style={{ width:52, padding:'4px 6px', borderRadius:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', fontSize:14, fontWeight:900, textAlign:'center', outline:'none' }} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700 }}>步數</span>
                      <input type="number" min="0" max="20" value={hMin} onChange={e => setHMin(Math.max(0, parseInt(e.target.value)||0))}
                        style={{ width:42, padding:'4px 4px', borderRadius:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', fontSize:14, fontWeight:900, textAlign:'center', outline:'none' }} />
                      <span style={{ color:'rgba(255,255,255,0.3)' }}>~</span>
                      <input type="number" min="1" max="20" value={hMax} onChange={e => setHMax(Math.max(1, parseInt(e.target.value)||5))}
                        style={{ width:42, padding:'4px 4px', borderRadius:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', fontSize:14, fontWeight:900, textAlign:'center', outline:'none' }} />
                    </div>
                    {horses.map((h, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:3 }}>
                        <input type="text" value={h.emoji} onChange={e => setHorses(hs => hs.map((x,j) => j===i?{...x,emoji:e.target.value}:x))}
                          style={{ width:32, textAlign:'center', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, color:'#fff', fontSize:16, padding:'2px 0', outline:'none' }} />
                        <input type="text" value={h.name} onChange={e => setHorses(hs => hs.map((x,j) => j===i?{...x,name:e.target.value}:x))}
                          style={{ width:50, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, color:'#fff', fontSize:11, fontWeight:700, padding:'4px 5px', outline:'none' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 冠軍彈窗 */}
              {phase === 'done' && hFinish.length > 0 && hFinish.length >= horses.length && (
                <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:50 }}
                  onClick={() => { setPhase('idle'); setHorses(h => h.map(x => ({...x, pos:0}))); setHFinish([]); }}>
                  <div className="winner-pop" onClick={e => e.stopPropagation()} style={{
                    background:'linear-gradient(135deg,#1e1b4b,#0f172a)', border:'2px solid rgba(250,204,21,0.5)',
                    borderRadius:28, padding:'36px 48px', textAlign:'center', boxShadow:'0 0 100px rgba(250,204,21,0.4)', maxWidth:420, width:'90%',
                  }}>
                    <div style={{ fontSize:56, marginBottom:8 }}>🏆</div>
                    <div style={{ fontSize:12, fontWeight:700, color:'rgba(250,204,21,0.8)', letterSpacing:'0.2em', marginBottom:16 }}>比賽結果</div>
                    {hFinish.map((f, i) => (
                      <div key={i} style={{
                        display:'flex', alignItems:'center', gap:10, justifyContent:'center',
                        padding:'7px 14px', borderRadius:12, marginBottom:6,
                        background: i===0?'rgba(250,204,21,0.18)':'rgba(255,255,255,0.04)',
                        border:`1px solid ${i===0?'rgba(250,204,21,0.5)':'rgba(255,255,255,0.08)'}`,
                      }}>
                        <span style={{ fontSize:18 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}</span>
                        <span style={{ fontSize:22 }}>{f.emoji}</span>
                        <span style={{ fontWeight:900, fontSize:17, color:i===0?'#facc15':'#fff' }}>{f.name}</span>
                      </div>
                    ))}
                    <button onClick={() => { setPhase('idle'); setHorses(h => h.map(x => ({...x, pos:0}))); setHFinish([]); }} style={{
                      marginTop:16, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
                      color:'rgba(255,255,255,0.7)', padding:'10px 32px', borderRadius:20, fontSize:14, fontWeight:700, cursor:'pointer',
                    }}>關閉</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 開始按鈕 */}
          <button onClick={handleStart} disabled={cannotStart} style={{
            padding:'13px 48px', borderRadius:50, fontSize:19, fontWeight:900, cursor: cannotStart?'not-allowed':'pointer', border:'none',
            background: cannotStart ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#facc15,#f59e0b)',
            color: cannotStart ? 'rgba(255,255,255,0.35)' : '#1e293b',
            boxShadow: cannotStart ? 'none' : '0 0 40px rgba(250,204,21,0.5)',
            transition:'all 0.2s',
          }}>
            {phase==='running' ? '🎰 進行中...' : mode==='horse' ? '🏇 開始賽馬！' : '🎯 開始抽獎'}
          </button>

          {/* 得獎彈窗 */}
          {phase === 'done' && winners.length > 0 && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.78)', backdropFilter:'blur(6px)', zIndex:50 }}
              onClick={() => setPhase('idle')}>
              <div className="winner-pop" onClick={e => e.stopPropagation()}
                style={{ background:'linear-gradient(135deg,#1e1b4b,#0f172a)', border:'2px solid rgba(250,204,21,0.5)', borderRadius:28, padding:'40px 52px', textAlign:'center', boxShadow:'0 0 100px rgba(250,204,21,0.4)', maxWidth:540, width:'92%' }}>
                <div style={{ fontSize: winners.length>1 ? 40:64, marginBottom:12 }}>🎉</div>
                <div style={{ fontSize:12, fontWeight:700, color:'rgba(250,204,21,0.8)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:14 }}>恭喜得獎</div>
                {winners.length === 1 ? (
                  <div className="shimmer-text" style={{ fontSize:'clamp(30px,6vw,58px)', fontWeight:900, marginBottom:24, letterSpacing:'-0.02em' }}>{winners[0]}</div>
                ) : (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:24, maxHeight:200, overflowY:'auto' }}>
                    {winners.map((w,i) => (
                      <div key={i} style={{ padding:'7px 18px', borderRadius:50, background:'rgba(250,204,21,0.2)', border:'2px solid #facc15', color:'#facc15', fontWeight:900, fontSize:15 }}>{w}</div>
                    ))}
                  </div>
                )}
                <button onClick={() => setPhase('idle')} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.7)', padding:'10px 32px', borderRadius:20, fontSize:14, fontWeight:700, cursor:'pointer' }}>關閉</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('home');

  // 支援 URL 參數直接跳入特定模式（?view=viewer / ?view=operator / ?view=multiplayer）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const v = urlParams.get('view');
    if (v === 'viewer')           setView('viewer');
    else if (v === 'operator')    setView('operator');
    else if (v === 'multiplayer') setView('multiplayer');
    else if (v === 'bracket_operator')    setView('bracket_operator');
    else if (v === 'bracket_viewer')       setView('bracket_viewer');
    else if (v === 'scoreboard_operator')  setView('scoreboard_operator');
    else if (v === 'scoreboard_viewer')    setView('scoreboard_viewer');
    else if (v === 'lottery')              setView('lottery');
  }, []);

  if (view === 'multiplayer')       return <MultiplayerBPRoom      onBack={() => setView('home')} />;
  if (view === 'operator')          return <OperatorPanel           onBack={() => setView('home')} />;
  if (view === 'viewer')            return <ViewerView              onBack={() => setView('home')} />;
  if (view === 'bracket_operator')  return <BracketOperator         onBack={() => setView('home')} />;
  if (view === 'bracket_viewer')    return <BracketViewer           onBack={() => setView('home')} />;
  if (view === 'scoreboard_operator') return <ScoreboardOperator   onBack={() => setView('home')} />;
  if (view === 'scoreboard_viewer')   return <ScoreboardViewer     onBack={() => setView('home')} />;
  if (view === 'lottery')             return <LotteryApp           onBack={() => setView('home')} />;
  return <HomePage onNavigate={setView} />;
}
