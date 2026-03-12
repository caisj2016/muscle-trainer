/* ═══════════════════════════════════════════════════════════════════
   MUSCLE MAP PRO — 全局登记表
   ⚠️  每次新增/删除变量、函数、window 导出时必须同步更新此处
   ════════════════════════════════════════════════════════════════════

   ── 全局状态变量 ─────────────────────────────────────────────────
   _currentUser      object|null   当前 Firebase 匿名用户
   _syncEnabled      bool          是否已连接同步（有 uid）
   _unsubscribeFn    fn|null       Firestore 监听取消函数
   userProfile       object        { bodyType, goal, level }  体型/目标/水平
   selectedMuscle    string|null   当前选中的肌肉部位 key
   activeFilters     Set<string>   动作库当前筛选标签
   animFrames        object        canvas 动画 requestAnimationFrame ID 表
   currentEx         object|null   当前打开的动作详情
   currentPlatform   string        视频平台 'auto'|'youtube'|'bilibili'
   iframeLoadTimer   timer|null    视频加载超时计时器
   _nutrState        object        营养计算结果 { h,w,a,sex,act,goal,bf,freq,
                                    bmr,tdee,target,bmi,protG,fatG,carbG,goalSetAt }
   _mealPrefs        Set<string>   饮食偏好标签
   _ciMuscles        Set<string>   打卡表单：已选训练部位
   _ciFeel           string|null   打卡表单：训练感受

   ── 常量 ─────────────────────────────────────────────────────────
   firebaseConfig    object        Firebase 项目配置
   ACHIEVEMENTS      array         成就定义列表
   FEEL_EMOJI        object        感受 → emoji 映射
   bodyTypeInfo      object        体型信息表
   goalInfo          object        目标名称映射
   levelInfo         object        水平名称映射
   muscleDB          object        肌肉部位 → 动作数据库

   ── 数据读写函数（localStorage + Firebase） ────────────────────────
   loadLogsLocal()               读取打卡日志数组
   saveLogsLocal(logs)           保存打卡日志到本地
   loadNutrLocal()               读取营养状态对象
   loadProfileLocal()            读取体型档案
   saveProfileLocal(profile)     保存体型档案
   loadArchive()                 读取目标归档数组
   saveArchive(arr)              保存目标归档
   archiveCurrentGoal(pct)       将当前目标快照存入归档
   deleteArchiveEntry(id)        删除指定归档条目
   setCookie / getCookie         Cookie 读写工具

   ── 核心逻辑函数 ──────────────────────────────────────────────────
   initApp()                     页面初始化（Firebase auth 后调用）
   restoreNutrInputs(s)          将 _nutrState 填回输入框并显示结果面板
   subscribeFirestore(uid)        开启 Firestore 实时监听
   setSyncStatus(status)         更新顶栏同步状态徽章
   calcStreak(logs)              计算连续打卡天数
   getWeekStart()                获取本周一日期字符串

   ── 页面导航 ───────────────────────────────────────────────────────
   switchPage(name)              桌面端切换页面 'train'|'nutrition'|'checkin'
   mobileTab(tab)                手机端切换 tab
   openCheckinForm()             打开打卡表单（手机滑动/桌面切换）
   closeCheckinForm()            关闭打卡表单

   ── 渲染函数 ────────────────────────────────────────────────────────
   renderCheckinPage()           渲染整个打卡页
   renderForest(logs)            渲染 SVG 森林
   renderProfile()               渲染右侧档案卡
   renderWeeklyPlan()            渲染本周计划
   renderProgress()              渲染部位进度
   renderAchievements(logs, streak)
   renderFreqCompare(logs)       本周 vs 目标对比条
   renderTrendBars(logs, freq)   近4周趋势图
   renderHeatCal(logs, days)     打卡热力图
   renderArchive()               过往目标归档列表
   renderProgressRing(...)       进度环
   buildTimeline(s)              营养页见效时间轴
   buildMealPlan(s, prefs)       营养页备餐方案

   ── window 导出（HTML onclick 使用的函数必须在此注册）─────────────
   window.switchPage             页面切换
   window.mobileTab              手机 tab 切换
   window.openCheckinForm        打开打卡表单
   window.closeCheckinForm       关闭打卡表单
   window.startApp               完成 onboarding 进入 app
   window.resetProfile           重置体型档案
   window.nextStep               onboarding 步骤推进
   window.selectBodyType         选择体型
   window.selectGoal             选择目标
   window.selectLevel            选择水平
   window.submitCheckin          提交打卡
   window.deleteLog              删除打卡记录
   window.clearAllLogs           清空所有记录
   window.closeCelebration       关闭庆祝弹窗
   window.toggleMuscle           切换打卡部位选择
   window.selectFeel             选择训练感受
   window.renderForest           强制重渲染森林（调试用）
   window.calcNutrition          计算营养目标
   window.togglePref             切换饮食偏好
   window.applyPrefsAndRegen     应用偏好并重新生成备餐
   window.setView                切换正面/背面肌肉图
   window.filterEx               筛选动作列表
   window.openModal              打开动作详情弹窗
   window.closeModal             关闭弹窗
   window.switchPlatform         切换视频平台
   window.toggleSteps            展开/收起动作步骤
   window.showAuthOverlay        显示同步码登录界面
   window.hideAuthOverlay        关闭同步码界面
   window.copySyncCode           复制我的同步码
   window.connectSyncCode        用同步码连接设备
   window.onBadgeClick           点击用户头像
   window.toggleArchive          展开/收起目标归档
   window.deleteArchiveEntry     删除归档条目

   ════════════════════════════════════════════════════════════════════
   新增函数 checklist：
   1. 函数内只用上方「全局状态变量」中登记的变量
   2. HTML onclick 用到的函数 → 必须加 window.xxx = xxx（文件末尾）
   3. 新全局变量 → 在「全局状态变量」区声明并登记到此表
   4. 改完后运行：grep "onclick=" index.html | grep -oP "(?<=onclick=\")\w+"
      对比 window 导出列表，确认全部覆盖
═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   FIREBASE 配置
   ⚠️  将下方替换为你自己的 Firebase 项目配置
   获取方式：Firebase Console → 项目设置 → 你的应用 → SDK 配置
═══════════════════════════════════════════════════════════ */
const firebaseConfig = {
  apiKey:            "AIzaSyDcndrrVj6qQxjDaRhEvtyvmf1A8SzJSus",
  authDomain:        "muscle-map-pro.firebaseapp.com",
  projectId:         "muscle-map-pro",
  storageBucket:     "muscle-map-pro.firebasestorage.app",
  messagingSenderId: "928969932436",
  appId:             "1:928969932436:web:7e608f493279bc16107e81",
  measurementId:     "G-W89E6QT6HB"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

/* ═══════════════════════════════════════════════════════════
   同步状态
═══════════════════════════════════════════════════════════ */
let _currentUser   = null;
let _syncEnabled   = false;
let _unsubscribeFn = null;

function setSyncStatus(status) {
  const dot  = document.getElementById('sync-dot');
  const text = document.getElementById('sync-text');
  if (!dot || !text) return;
  dot.className = 'sync-dot ' + (status === 'guest' ? '' : status);
  text.textContent = {
    synced: '已同步', syncing: '同步中…',
    error:  '同步失败', guest: '点击同步', offline: '离线'
  }[status] || status;
}

function updateTopbarUser(user) {
  const iconEl = document.getElementById('badge-icon');
  if (!iconEl) return;

  try {
    if (
      user &&
      typeof bodyTypeInfo !== "undefined" &&
      typeof userProfile !== "undefined"
    ) {
      const bt = bodyTypeInfo[userProfile?.bodyType];
      if (bt) iconEl.textContent = bt.icon;
    }
  } catch (e) {
    console.warn("updateTopbarUser skipped:", e);
  }
}

/* ─── 启动时自动匿名登录 ─── */
auth.onAuthStateChanged(async (user) => {
  _currentUser = user;
  _syncEnabled = !!user;

  if (user) {
    setSyncStatus('syncing');
    localStorage.setItem('mmp_uid', user.uid);
    await pushLocalToFirestore(user.uid);
    await restoreLinkedUid();   // 如果之前链接过其他设备，恢复该连接
    if (!localStorage.getItem('mmp_uid_linked')) {
      subscribeFirestore(user.uid);
    }
  } else {
    // 未登录 → 自动匿名登录
    try {
      await auth.signInAnonymously();
    } catch(e) {
      console.warn('[Firebase] anonymous sign-in failed:', e.message);
      setSyncStatus('offline');
    }
  }
});

/* ═══════════════════════════════════════════════════════════
   同步码系统
   原理：
   - 每个设备登录后生成 6 位同步码，存在 Firestore /syncCodes/{code}
   - 另一台设备输入同步码 → 找到对应 uid → 用 Custom Token 切换到同一账号
   - 实际实现：直接用「主账号 uid 转移数据」方案，不需要 Custom Token
     即：输入同步码的设备把自己的本地数据 merge 到目标 uid 下，然后切换 uid
═══════════════════════════════════════════════════════════ */

/* 生成 6 位大写同步码（字母+数字，去掉容易混淆的 0/O/I/1） */
function generateSyncCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // 中间加横线更易读：ABC-123
  return code.slice(0,3) + '-' + code.slice(3);
}

/* 展示同步码 overlay，同时生成/读取本设备的同步码 */
async function showAuthOverlay() {
  document.getElementById('auth-overlay').classList.remove('hidden');
  showAuthMsg('', '');

  const codeEl = document.getElementById('my-sync-code');
  codeEl.textContent = '生成中…';

  if (!_currentUser) {
    codeEl.textContent = '请稍候…';
    return;
  }

  // 查 Firestore 看这个 uid 有没有已存的同步码
  try {
    const uid = _currentUser.uid;
    const snap = await db.collection('syncCodes')
      .where('uid', '==', uid).limit(1).get();

    let code;
    if (!snap.empty) {
      code = snap.docs[0].id;
    } else {
      // 生成新同步码，写入 Firestore（有效期 30 天）
      code = generateSyncCode();
      const expiry = new Date(Date.now() + 30 * 86400000);
      await db.collection('syncCodes').doc(code).set({
        uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiry
      });
    }

    codeEl.textContent = code;
    localStorage.setItem('mmp_syncCode', code);
  } catch(e) {
    console.warn('[SyncCode] generate failed:', e);
    codeEl.textContent = '网络错误';
  }
}

function hideAuthOverlay() {
  document.getElementById('auth-overlay').classList.add('hidden');
}

function copySyncCode() {
  const code = document.getElementById('my-sync-code').textContent;
  if (!code || code === '——' || code === '生成中…') return;
  navigator.clipboard?.writeText(code).catch(() => {});
  const hint = document.getElementById('copy-hint');
  hint.classList.add('show');
  setTimeout(() => hint.classList.remove('show'), 2000);
}

function showAuthMsg(msg, type) {
  const el = document.getElementById('auth-msg');
  if (!el) return;
  el.textContent = msg;
  el.className = 'auth-msg' + (msg ? ' show ' + type : '');
}

/* 在另一台设备上输入同步码，连接到主设备的数据 */
async function connectSyncCode() {
  const input = document.getElementById('input-sync-code');
  const btn   = document.getElementById('sync-connect-btn');
  const raw   = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  // 支持有横线和无横线两种输入
  const code = raw.length === 6 ? raw.slice(0,3) + '-' + raw.slice(3) : input.value.trim().toUpperCase();

  showAuthMsg('', '');
  if (code.replace('-','').length < 6) {
    showAuthMsg('请输入完整的6位同步码', 'error');
    return;
  }
  if (!_currentUser) {
    showAuthMsg('正在初始化，请稍候再试', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = '连接中…';

  try {
    // 查找同步码对应的 uid
    const snap = await db.collection('syncCodes').doc(code).get();
    if (!snap.exists) {
      showAuthMsg('同步码无效或已过期，请检查后重试', 'error');
      btn.disabled = false; btn.textContent = '同步';
      return;
    }

    const targetUid = snap.data().uid;
    const myUid     = _currentUser.uid;

    if (targetUid === myUid) {
      showAuthMsg('这是本设备的同步码，请在另一台设备上输入', 'error');
      btn.disabled = false; btn.textContent = '同步';
      return;
    }

    // 把本设备的本地数据 merge 到目标 uid
    setSyncStatus('syncing');
    await pushLocalToFirestore(targetUid);   // 把本机数据推送到目标账号

    // 停止当前监听
    if (_unsubscribeFn) { _unsubscribeFn(); _unsubscribeFn = null; }

    // 切换到目标 uid：删除本机旧的匿名账号数据，改监听目标 uid
    // （Firebase 匿名账号不支持直接切换，我们改为监听目标uid的数据）
    localStorage.setItem('mmp_uid_linked', targetUid);
    _currentUser = { uid: targetUid, _linked: true };  // 虚拟user对象
    _syncEnabled = true;

    subscribeFirestore(targetUid);

    // 把本机的同步码也绑定到目标uid（可选，让目标也能找到）
    showAuthMsg('✓ 同步成功！数据已合并', 'ok');
    input.value = '';
    showToast('🔗 设备已连接，数据同步中…');
    setTimeout(hideAuthOverlay, 1500);

  } catch(e) {
    console.warn('[SyncCode] connect failed:', e);
    showAuthMsg('连接失败：' + e.message, 'error');
    btn.disabled = false; btn.textContent = '同步';
  }
}

/* 处理已链接的 uid（页面刷新后恢复） */
async function restoreLinkedUid() {
  const linkedUid = localStorage.getItem('mmp_uid_linked');
  if (!linkedUid || !_currentUser) return;
  // 如果本设备已经链接到另一个 uid，切换监听
  if (linkedUid !== _currentUser.uid) {
    if (_unsubscribeFn) { _unsubscribeFn(); _unsubscribeFn = null; }
    subscribeFirestore(linkedUid);
    _currentUser = { uid: linkedUid, _linked: true };
    setSyncStatus('syncing');
  }
}

function onBadgeClick() { resetProfile(); }

/* ═══════════════════════════════════════════════════════════
   FIRESTORE 数据结构
   /users/{uid}               → { profile, nutr, updatedAt }
   /users/{uid}/logs/{logId}  → { id, date, muscles, feel, note, duration, sets, ts }
═══════════════════════════════════════════════════════════ */

/* 本地数据推送到 Firestore（登录时调用一次，合并而非覆盖） */
async function pushLocalToFirestore(uid) {
  try {
    const ref = db.collection('users').doc(uid);
    // profile
    if (userProfile?.bodyType) {
      await ref.set({ profile: userProfile, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    // nutr
    if (_nutrState?.goal) {
      await ref.set({ nutr: _nutrState }, { merge: true });
    }
    // 归档
    const archive = loadArchive();
    if (archive.length) {
      await ref.set({ goalArchive: archive }, { merge: true });
    }
    // logs 批量写入
    const localLogs = loadLogsLocal();
    if (localLogs.length) {
      const batch   = db.batch();
      const logsRef = ref.collection('logs');
      localLogs.forEach(log => {
        batch.set(logsRef.doc(String(log.id)),
          { ...log, ts: firebase.firestore.FieldValue.serverTimestamp() },
          { merge: true });
      });
      await batch.commit();
    }
    setSyncStatus('synced');
  } catch (e) {
    console.warn('[Firebase] push failed:', e.message);
    setSyncStatus('error');
  }
}

/* Firestore → 本地实时监听 */
function subscribeFirestore(uid) {
  if (_unsubscribeFn) _unsubscribeFn();
  const ref = db.collection('users').doc(uid);

  // 监听 profile + nutr
  const unsubDoc = ref.onSnapshot(snap => {
    if (!snap.exists) return;
    const data = snap.data();
    if (data.profile?.bodyType) {
      userProfile = data.profile;
      saveProfileLocal(userProfile);
      if (!_currentUser) {
        const bt = bodyTypeInfo[userProfile.bodyType];
        const iconEl = document.getElementById('badge-icon');
        if (bt && iconEl) iconEl.textContent = bt.icon;
      }
    }
    if (data.nutr?.goal) {
      _nutrState = data.nutr;
      restoreNutrInputs(_nutrState);  // 同步回来时填回输入框
    }
    if (data.goalArchive) {
      try { localStorage.setItem('mmp_goal_archive', JSON.stringify(data.goalArchive)); } catch(e) {}
    }
    setSyncStatus('synced');
  }, err => { console.warn('[Firebase] doc:', err); setSyncStatus('error'); });

  // 监听打卡日志
  const unsubLogs = ref.collection('logs')
    .orderBy('ts', 'desc').limit(365)
    .onSnapshot(snap => {
      const remote = snap.docs.map(d => { const r = { ...d.data() }; delete r.ts; return r; });
      if (remote.length) {
        // Firebase 有数据 → 以 Firebase 为准（多设备同步）
        saveLogsLocal(remote);
      }
      // 无论 remote 是否为空，都刷新页面（避免旧状态残留）
      if (document.getElementById('page-checkin')?.classList.contains('active')) {
        renderCheckinPage();
      }
      setSyncStatus('synced');
    }, err => { console.warn('[Firebase] logs:', err); setSyncStatus('error'); });

  _unsubscribeFn = () => { unsubDoc(); unsubLogs(); };
}

/* 写单条日志到 Firestore */
async function fsWriteLog(log) {
  if (!_syncEnabled || !_currentUser) return;
  setSyncStatus('syncing');
  try {
    await db.collection('users').doc(_currentUser.uid)
      .collection('logs').doc(String(log.id))
      .set({ ...log, ts: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    setSyncStatus('synced');
  } catch (e) { setSyncStatus('error'); }
}

/* 删单条日志 */
async function fsDeleteLog(id) {
  if (!_syncEnabled || !_currentUser) return;
  try {
    await db.collection('users').doc(_currentUser.uid)
      .collection('logs').doc(String(id)).delete();
  } catch (e) { console.warn(e); }
}

/* 写 profile */
async function fsWriteProfile(profile) {
  if (!_syncEnabled || !_currentUser) return;
  setSyncStatus('syncing');
  try {
    await db.collection('users').doc(_currentUser.uid)
      .set({ profile, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    setSyncStatus('synced');
  } catch (e) { setSyncStatus('error'); }
}

/* 写营养数据 */
async function fsWriteNutr(nutr) {
  // 先保存到本地
  try { localStorage.setItem('mmp_nutr', JSON.stringify(nutr)); } catch(e) {}
  if (!_syncEnabled || !_currentUser) return;
  try {
    await db.collection('users').doc(_currentUser.uid).set({ nutr }, { merge: true });
  } catch (e) { console.warn(e); }
}
function loadNutrLocal() {
  try {
    const s = localStorage.getItem('mmp_nutr');
    if (s) return JSON.parse(s);
  } catch(e) {}
  return null;
}

/* ── 目标归档 ── */
function loadArchive() {
  try {
    const s = localStorage.getItem('mmp_goal_archive');
    if (s) return JSON.parse(s);
  } catch(e) {}
  return [];
}
function saveArchive(arr) {
  try { localStorage.setItem('mmp_goal_archive', JSON.stringify(arr)); } catch(e) {}
  // 同步 Firebase
  if (_syncEnabled && _currentUser) {
    db.collection('users').doc(_currentUser.uid)
      .set({ goalArchive: arr }, { merge: true })
      .catch(e => console.warn('[Firebase] archive:', e));
  }
}
function archiveCurrentGoal(progressPct) {
  const s = _nutrState;
  if (!s || !s.goal || !s.goalSetAt) return;
  const arr = loadArchive();
  const goalNames = { cut:'减脂', bulk:'增肌', 'bulk-lean':'精益增肌', maintain:'体型维持' };
  arr.unshift({
    id: Date.now(),
    goal:        s.goal,
    goalName:    goalNames[s.goal] || s.goal,
    goalSetAt:   s.goalSetAt,
    archivedAt:  localToday(),
    progressPct: Math.round(progressPct || 0),
    target:      s.target,
    protG:       s.protG,
    fatG:        s.fatG,
    carbG:       s.carbG,
    tdee:        s.tdee,
    w:           s.w,
    h:           s.h,
  });
  saveArchive(arr);
}
function deleteArchiveEntry(id) {
  const arr = loadArchive().filter(a => a.id !== id);
  saveArchive(arr);
  renderArchive();
}

/* ═══════════════════════════════════════════════════════════
   本地存储（localStorage 优先，cookie 备用）
   ——对外接口与原版完全相同，外部代码无需改动——
═══════════════════════════════════════════════════════════ */
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 864e5);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function getCookie(name) {
  const m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
  return m ? decodeURIComponent(m[1]) : null;
}

function saveProfileLocal(profile) {
  try { localStorage.setItem('mmp_profile', JSON.stringify(profile)); } catch(e) {}
  try { setCookie('mmp_profile', JSON.stringify(profile), 365); } catch(e) {}
}
function loadProfileLocal() {
  try {
    const ls = localStorage.getItem('mmp_profile');
    if (ls) return JSON.parse(ls);
    const ck = getCookie('mmp_profile');
    if (ck) return JSON.parse(ck);
  } catch(e) {}
  return null;
}
function saveLogsLocal(logs) {
  try { localStorage.setItem('mmp_logs', JSON.stringify(logs.slice(0, 365))); } catch(e) {}
}
/* ── 本地时区今日日期（YYYY-MM-DD），避免 UTC 偏移导致日期显示错误 ── */
function localToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
/* 将任意 Date 对象转为本地 YYYY-MM-DD */
function localDateOf(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

/* N天前的本地日期字符串 */
function nDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateOf(d);
}


function loadLogsLocal() {
  try {
    const ls = localStorage.getItem('mmp_logs');
    if (ls) return JSON.parse(ls);
    const ck = getCookie('mmp_logs');
    if (ck) return JSON.parse(decodeURIComponent(ck));
  } catch(e) {}
  return [];
}

/* 对外接口保持原名不变 */
function saveProfileCookie(p) { saveProfileLocal(p); }
function loadProfileCookie()  { return loadProfileLocal(); }
function loadLogs()           { return loadLogsLocal(); }
function saveLogs(logs)       { saveLogsLocal(logs); }

/* ═══════════════════════════════════════════════════════════
   TOAST 通知
═══════════════════════════════════════════════════════════ */
function showToast(msg, ms = 2500) {
  const el = document.getElementById('mmp-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('visible'), ms);
}

/* ═══════════════════════════════════════════════════════════
   以下为原 app.js 全量代码（仅修改存储调用，逻辑不变）
═══════════════════════════════════════════════════════════ */

/* ─── USER PROFILE STATE ─── */
let userProfile    = { bodyType: null, goal: null, level: null };
let selectedMuscle = null;
let activeFilters  = new Set(['all']);

/* ─── 启动时自动读取已保存的 profile ─── */
(function() {
  const saved = loadProfileLocal();
  if (saved && saved.bodyType && saved.goal && saved.level) {
    userProfile = saved;
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    window._skipOnboarding = true;
  }
})();

/* ─── ONBOARDING ─── */
function selectBodyType(el) {
  document.querySelectorAll('.body-type-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  userProfile.bodyType = el.dataset.type;
  document.getElementById('btn-step1').disabled = false;
}
function selectGoal(el) {
  document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  userProfile.goal = el.dataset.goal;
  document.getElementById('btn-step2').disabled = false;
}
function selectLevel(el) {
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  userProfile.level = el.dataset.level;
  document.getElementById('btn-step3').disabled = false;
}
function nextStep(n) {
  document.querySelectorAll('.ob-step').forEach((s,i) => s.classList.toggle('active', i===n-1));
  document.querySelectorAll('.dot').forEach((d,i) => d.classList.toggle('active', i<n));
}
function startApp() {
  saveProfileLocal(userProfile);      // 本地存储
  fsWriteProfile(userProfile);        // 🔥 同步到 Firebase
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  initApp();
}
function resetProfile() {
  localStorage.removeItem('mmp_profile');
  setCookie('mmp_profile', '', -1);
  userProfile = { bodyType: null, goal: null, level: null };
  selectedMuscle = null;
  document.getElementById('onboarding').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.querySelectorAll('.ob-step').forEach((s,i) => s.classList.toggle('active', i===0));
  document.querySelectorAll('.dot').forEach((d,i) => d.classList.toggle('active', i===0));
  document.querySelectorAll('.body-type-card, .goal-card, .level-btn').forEach(el => el.classList.remove('selected'));
  ['btn-step1','btn-step2','btn-step3'].forEach(id => document.getElementById(id).disabled = true);
}

/* ─── APP INIT ─── */
const bodyTypeInfo = {
  ectomorph: { icon:'🦴', name:'外胚层体型', color:'#3b8fff' },
  mesomorph: { icon:'💪', name:'中胚层体型', color:'#f0c040' },
  endomorph: { icon:'🍎', name:'内胚层体型', color:'#ff5a36' }
};
const goalInfo  = { muscle:'增肌塑形', fat:'减脂燃脂', strength:'提升力量', health:'健康维护', cut:'减脂', bulk:'增肌', 'bulk-lean':'精益增肌', maintain:'体型维持' };
const levelInfo = { beginner:'新手', intermediate:'进阶', advanced:'高手' };

function initApp() {
  // 读取版本配置
  const verEl = document.getElementById('app-version');
  if (verEl && typeof APP_CONFIG !== 'undefined') verEl.textContent = APP_CONFIG.version;
  const bt = bodyTypeInfo[userProfile.bodyType];
  if (!_currentUser) {
    document.getElementById('badge-icon').textContent = bt.icon;
    document.getElementById('badge-name').textContent = bt.name;
  }
  document.getElementById('badge-type').textContent =
    `${goalInfo[userProfile.goal] || ''} · ${levelInfo[userProfile.level] || ''}`;

  renderProfile();
  renderWeeklyPlan();
  renderProgress();
  attachMuscleClicks();

  const tipMap = {
    ectomorph: '你是外胚层体型，建议以增肌为主，减少有氧，每组8-12次，组间休息充足。',
    mesomorph: '你是中胚层体型，天生适合健身！可以多样化训练，增肌减脂双线进行。',
    endomorph: '你是内胚层体型，建议多做复合动作+有氧结合，控制组间休息在45-60秒。'
  };
  document.getElementById('tip-text').textContent = tipMap[userProfile.bodyType];

  const isMobile = window.innerWidth <= 767;
  const hasLogs  = (loadLogsLocal() || []).length > 0;

  if (isMobile) {
    document.getElementById('mobile-tabs').style.display = 'flex';
    document.getElementById('desktop-nav').style.display = 'none';
  }

  // 有打卡记录 → 默认进打卡页；否则进训练页
  if (hasLogs) {
    if (isMobile) {
      document.querySelectorAll('.mobile-tab').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-checkin')?.classList.add('active');
      mobileTab('checkin');
    } else {
      switchPage('checkin');
    }
  } else {
    if (isMobile) {
      document.getElementById('tab-body')?.classList.add('active');
    }
    switchPage('train');
  }

  // 恢复上次保存的营养数据
  const savedNutr = loadNutrLocal();
  if (savedNutr && savedNutr.goal) {
    _nutrState = savedNutr;
    restoreNutrInputs(savedNutr);
  }
}

/* 把营养数据填回输入框 + 恢复计算结果 */
function restoreNutrInputs(s) {
  if (!s || !s.goal) return;
  if (!document.getElementById('n-height')) return; // 页面未就绪
  document.getElementById('n-height').value   = s.h    || '';
  document.getElementById('n-weight').value   = s.w    || '';
  document.getElementById('n-age').value      = s.a    || '';
  document.getElementById('n-sex').value      = s.sex  || 'male';
  document.getElementById('n-activity').value = s.act  || '1.375';
  document.getElementById('n-goal').value     = s.goal || 'cut';
  document.getElementById('n-freq').value     = s.freq || '3';
  if (s.bf) document.getElementById('n-bodyfat').value = s.bf;
  // 恢复计算结果面板
  buildTimeline(s);
  buildMealPlan(s, getActivePrefs());
  document.getElementById('nutr-result')?.classList.remove('nutr-hidden');
  document.getElementById('timeline-card')?.classList.remove('nutr-hidden');
  document.getElementById('meal-card')?.classList.remove('nutr-hidden');
  document.getElementById('pref-card') && (document.getElementById('pref-card').style.display = 'block');
}

/* ─── PAGE NAVIGATION ─── */
function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.desktop-nav-btn').forEach(b => b.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if (pg) pg.classList.add('active');
  const btn = document.getElementById('dnav-' + name);
  if (btn) btn.classList.add('active');
  if (name === 'checkin') renderCheckinPage();
  // 切换到营养页时确保数据已恢复显示
  if (name === 'nutrition' && _nutrState && _nutrState.goal) {
    restoreNutrInputs(_nutrState);
  }
}

function mobileTab(tab) {
  document.querySelectorAll('.mobile-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');

  // 所有 page 先隐藏
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const bodyPanel = document.getElementById('body-panel');
  const exPanel   = document.getElementById('exercise-panel');
  const nutrPage  = document.getElementById('page-nutrition');
  const ciPage    = document.getElementById('page-checkin');
  const trainPage = document.getElementById('page-train');

  if (tab === 'body') {
    trainPage?.classList.add('active');
    [bodyPanel, exPanel].forEach(el => el?.classList.remove('mobile-hidden'));
    exPanel?.classList.add('mobile-hidden');
    bodyPanel?.classList.remove('mobile-hidden');
  } else if (tab === 'exercises') {
    trainPage?.classList.add('active');
    bodyPanel?.classList.add('mobile-hidden');
    exPanel?.classList.remove('mobile-hidden');
  } else if (tab === 'nutrition') {
    nutrPage?.classList.add('active');
    if (_nutrState && _nutrState.goal) restoreNutrInputs(_nutrState);
  } else if (tab === 'checkin') {
    ciPage?.classList.add('active');
    renderCheckinPage();
  }
}

/* ─── CHECKIN PANEL NAVIGATION ─── */
function openCheckinForm() {
  const isMobile = window.innerWidth <= 767;
  if (isMobile) {
    document.getElementById('ci-slider')?.classList.add('show-form');
  } else {
    document.getElementById('page-checkin')?.classList.add('form-open');
  }
}

function closeCheckinForm() {
  const isMobile = window.innerWidth <= 767;
  if (isMobile) {
    document.getElementById('ci-slider')?.classList.remove('show-form');
  } else {
    document.getElementById('page-checkin')?.classList.remove('form-open');
  }
}

function renderProfile() {
  const bt  = userProfile.bodyType, g = userProfile.goal, l = userProfile.level;
  const calMap  = { ectomorph:'+500大卡盈余', mesomorph:'维持±200大卡', endomorph:'-300大卡赤字' };
  const freqMap = { beginner:'每周3次', intermediate:'每周4次', advanced:'每周5次' };
  const el = document.getElementById('profile-display');
  if (!el) return;
  el.innerHTML = `
    <div class="profile-row"><span class="profile-key">体型</span><span class="profile-val">${bodyTypeInfo[bt]?.icon||''} ${bodyTypeInfo[bt]?.name||''}</span></div>
    <div class="profile-row"><span class="profile-key">目标</span><span class="profile-val">${goalInfo[g]||g}</span></div>
    <div class="profile-row"><span class="profile-key">水平</span><span class="profile-val">${levelInfo[l]||l}</span></div>
    <div class="profile-row"><span class="profile-key">热量建议</span><span class="profile-val">${calMap[bt]||''}</span></div>
    <div class="profile-row"><span class="profile-key">训练频率</span><span class="profile-val">${freqMap[l]||''}</span></div>`;
}

function renderWeeklyPlan() {
  const plans = {
    beginner:     [{d:'一',t:'上肢',cls:'day-upper'},{d:'二',t:'休息',cls:'day-rest'},{d:'三',t:'下肢',cls:'day-lower'},{d:'四',t:'休息',cls:'day-rest'},{d:'五',t:'全身',cls:'day-full'},{d:'六',t:'有氧',cls:'day-cardio'},{d:'日',t:'休息',cls:'day-rest'}],
    intermediate: [{d:'一',t:'胸肩三',cls:'day-upper'},{d:'二',t:'背二头',cls:'day-upper'},{d:'三',t:'下肢',cls:'day-lower'},{d:'四',t:'休息',cls:'day-rest'},{d:'五',t:'上肢',cls:'day-upper'},{d:'六',t:'下肢',cls:'day-lower'},{d:'日',t:'有氧',cls:'day-cardio'}],
    advanced:     [{d:'一',t:'胸',cls:'day-upper'},{d:'二',t:'背',cls:'day-upper'},{d:'三',t:'腿',cls:'day-lower'},{d:'四',t:'肩',cls:'day-upper'},{d:'五',t:'手臂',cls:'day-upper'},{d:'六',t:'全身',cls:'day-full'},{d:'日',t:'有氧',cls:'day-cardio'}]
  };
  const plan = plans[userProfile.level] || plans.beginner;
  const el = document.getElementById('weekly-plan');
  if (el) el.innerHTML = plan.map(p => `
    <div class="day-row">
      <span class="day-label">${p.d}</span>
      <div class="day-bar-wrap"><div class="day-bar ${p.cls}" style="width:${p.cls==='day-rest'?'40%':'85%'}">${p.t}</div></div>
    </div>`).join('');
}

function renderProgress() {
  const muscles = [{n:'胸肌',p:68},{n:'背部',p:55},{n:'腿部',p:40},{n:'肩膀',p:72},{n:'核心',p:50}];
  const el = document.getElementById('prog-list');
  if (el) el.innerHTML = muscles.map(m => `
    <div class="prog-item">
      <div class="prog-label"><span>${m.n}</span><span class="prog-pct">${m.p}%</span></div>
      <div class="prog-bar-wrap"><div class="prog-bar" style="width:${m.p}%"></div></div>
    </div>`).join('');
}

/* ─── TRAINING LOGS（Firebase 同步版） ─── */
let _ciMuscles = new Set();
let _ciFeel    = null;

function toggleMuscle(el) {
  const m = el.dataset.m;
  if (_ciMuscles.has(m)) { _ciMuscles.delete(m); el.classList.remove('on'); }
  else                   { _ciMuscles.add(m);    el.classList.add('on'); }
}
function selectFeel(el) {
  document.querySelectorAll('.feel-btn').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  _ciFeel = el.dataset.f;
}

/* ══════════════════════════════════════════════
   成就系统
══════════════════════════════════════════════ */
const ACHIEVEMENTS = [
  { id:'first',    icon:'🌱', name:'第一步',    desc:'完成第一次打卡',        check:(logs,streak)=> logs.length >= 1 },
  { id:'week1',    icon:'🔥', name:'坚持一周',  desc:'连续训练7天',           check:(logs,streak)=> streak >= 7 },
  { id:'month1',   icon:'💪', name:'月度勇士',  desc:'累计打卡30次',          check:(logs,streak)=> logs.length >= 30 },
  { id:'streak3',  icon:'⚡', name:'三连击',    desc:'连续训练3天',           check:(logs,streak)=> streak >= 3 },
  { id:'streak14', icon:'🏆', name:'两周不间断',desc:'连续训练14天',          check:(logs,streak)=> streak >= 14 },
  { id:'total10',  icon:'🎯', name:'十次打卡',  desc:'累计打卡10次',          check:(logs,streak)=> logs.length >= 10 },
  { id:'total50',  icon:'💎', name:'五十次精英',desc:'累计打卡50次',          check:(logs,streak)=> logs.length >= 50 },
  { id:'allparts', icon:'🫀', name:'全身战士',  desc:'单次覆盖5个以上部位',   check:(logs,streak)=> logs.some(l=>l.muscles&&l.muscles.length>=5) },
];

function getUnlockedAchievements(logs, streak) {
  return ACHIEVEMENTS.filter(a => a.check(logs, streak));
}

function renderAchievements(logs, streak) {
  const el = document.getElementById('achievements-row');
  if (!el) return;
  const unlocked = new Set(getUnlockedAchievements(logs, streak).map(a=>a.id));
  el.innerHTML = ACHIEVEMENTS.map(a => `
    <div class="badge-item ${unlocked.has(a.id)?'unlocked':''}" title="${a.desc}">
      <span class="badge-icon">${a.icon}</span>
      <span>${a.name}</span>
    </div>`).join('');
}

/* ══════════════════════════════════════════════
   本周 vs 目标 + 4周趋势
══════════════════════════════════════════════ */
function renderFreqCompare(logs) {
  const today      = localToday();
  const weekStart  = getWeekStart();
  const uniqueDays = [...new Set(logs.map(l=>l.date))].sort().reverse();
  const thisWeek   = uniqueDays.filter(d => d>=weekStart && d<=today).length;
  const targetFreq = (_nutrState && _nutrState.freq) ? _nutrState.freq : 3;
  const pct        = Math.min(100, Math.round(thisWeek / targetFreq * 100));

  // 目标条
  const targetBar = document.getElementById('freq-target-bar');
  const targetText= document.getElementById('freq-target-text');
  const targetNum = document.getElementById('freq-target-num');
  if (targetBar)  targetBar.style.width = '100%';
  if (targetText) targetText.textContent= `每周 ${targetFreq} 次`;
  if (targetNum)  targetNum.textContent = targetFreq;

  // 实际条
  const actualBar  = document.getElementById('freq-actual-bar');
  const actualText = document.getElementById('freq-actual-text');
  const actualNum  = document.getElementById('freq-actual-num');
  const cls = pct>=100 ? 'actual-good' : pct>=60 ? 'actual-ok' : 'actual-low';
  if (actualBar) {
    actualBar.style.width = Math.max(4, pct) + '%';
    actualBar.className   = `freq-bar-fill ${cls}`;
  }
  if (actualText) actualText.textContent = thisWeek > 0 ? `${thisWeek}次` : '';
  if (actualNum)  actualNum.textContent  = thisWeek;

  // 差距提示
  const gapMsg = document.getElementById('freq-gap-msg');
  if (gapMsg) {
    const gap = targetFreq - thisWeek;
    if (gap <= 0) {
      gapMsg.innerHTML = `🎉 <b style="color:#2ecc71">本周目标已完成！</b>超额完成 ${-gap} 次`;
    } else {
      const dayOfWeek = new Date().getDay();
      const daysLeft  = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      gapMsg.innerHTML= `本周还差 <b style="color:var(--accent)" ${gap}</b> 次达标，还有 ${daysLeft} 天`;
    }
  }

  // 近4周趋势
  renderTrendBars(logs, targetFreq);
}

function renderTrendBars(logs, targetFreq) {
  const el = document.getElementById('trend-bars');
  const msgEl = document.getElementById('trend-msg');
  if (!el) return;

  const today = new Date();
  const weeks = [];
  for (let w = 3; w >= 0; w--) {
    const wEnd   = new Date(today); wEnd.setDate(today.getDate() - w*7);
    const wStart = new Date(wEnd);  wStart.setDate(wEnd.getDate() - 6);
    const wStartStr = localDateOf(wStart);
    const wEndStr   = localDateOf(wEnd);
    const cnt = [...new Set(
      logs.filter(l=>l.date>=wStartStr && l.date<=wEndStr).map(l=>l.date)
    )].length;
    weeks.push({ count: cnt, label: w===0?'本周':`${w}周前` });
  }

  const maxCount = Math.max(targetFreq, ...weeks.map(w=>w.count), 1);
  const CHART_H = 60; // px

  el.innerHTML = weeks.map((w, i) => {
    const isThis = i === 3;
    const reached = w.count >= targetFreq;
    const barH = Math.max(3, Math.round(w.count / maxCount * CHART_H));
    const color = reached
      ? 'rgba(46,204,113,.75)'
      : isThis
        ? 'rgba(240,192,64,.75)'
        : 'rgba(90,100,128,.4)';
    const countColor = reached ? '#2ecc71' : isThis ? 'var(--accent)' : 'var(--muted)';
    const glow = (reached || isThis) ? `box-shadow:0 0 8px ${color}` : '';

    return `
      <div class="trend-week-col" style="height:${CHART_H+28}px;justify-content:flex-end">
        <div style="font-size:11px;font-weight:800;color:${countColor};height:16px;line-height:16px;text-align:center">
          ${w.count > 0 ? w.count : ''}
        </div>
        <div style="width:100%;height:${barH}px;border-radius:5px 5px 0 0;background:${color};${glow};transition:height 0.7s cubic-bezier(0.4,0,0.2,1)"></div>
        <div style="width:100%;height:1px;background:rgba(255,255,255,.08)"></div>
        <div style="font-size:9px;color:${isThis?'var(--accent)':'var(--muted)'};text-align:center;margin-top:4px;font-weight:${isThis?'700':'400'}">${w.label}</div>
      </div>`;
  }).join('');

  // 目标虚线（用伪元素模拟，用 JS 注入 inline style）
  const targetH = Math.round(targetFreq / maxCount * CHART_H);
  el.style.position = 'relative';

  if (msgEl) {
    const counts = weeks.map(w=>w.count);
    const last2avg = (counts[2]+counts[3])/2;
    const first2avg = (counts[0]+counts[1])/2;
    const thisWeek = counts[3];
    if (thisWeek >= targetFreq) {
      msgEl.innerHTML = `<span style="color:#2ecc71">✓ 本周已达标</span>`;
    } else if (last2avg > first2avg + 0.5) {
      msgEl.innerHTML = `📈 训练频率上升中`;
    } else if (last2avg < first2avg - 0.5) {
      msgEl.innerHTML = `💡 最近频率下降，加油补上！`;
    } else {
      const avg = (counts.reduce((a,b)=>a+b,0)/4).toFixed(1);
      msgEl.innerHTML = `均 <b style="color:var(--accent)">${avg}</b> 次/周`;
    }
  }
}

/* ══════════════════════════════════════════════
   打卡成功庆祝弹窗
══════════════════════════════════════════════ */
function showCelebration(entry, logs, streak) {
  const prevUnlocked = new Set(getUnlockedAchievements(logs.slice(1), calcStreak(logs.slice(1))).map(a=>a.id));
  const nowUnlocked  = getUnlockedAchievements(logs, streak);
  const newBadges    = nowUnlocked.filter(a => !prevUnlocked.has(a.id));

  // 决定庆祝等级
  let emoji, title, msg;
  if (streak >= 30) {
    emoji = '🏆'; title = '传奇训练者！';
    msg   = `连续训练 <b>${streak}</b> 天！你已经超越了绝大多数人，这种毅力令人敬佩。`;
  } else if (streak >= 14) {
    emoji = '🔥'; title = '两周连续达成！';
    msg   = `连续坚持 <b>${streak}</b> 天，习惯已经形成。你的身体正在发生真实的改变！`;
  } else if (streak >= 7) {
    emoji = '⚡'; title = '一周连续完成！';
    msg   = `连续训练 <b>${streak}</b> 天，本周目标全达成！研究表明坚持7天后放弃率大幅下降。`;
  } else if (newBadges.length > 0) {
    emoji = '🏅'; title = '解锁新成就！';
    msg   = `恭喜解锁：<b>${newBadges.map(b=>b.icon+b.name).join('、')}</b>！`;
  } else if (entry.feel === 'great') {
    emoji = '🔥'; title = '状态极佳！';
    const msgs = [
      '今天训练状态绝佳！趁热打铁，记录一下今天的重量和感受。',
      '极佳状态！身体适应得很好，可以考虑适当加量了。',
      '满状态出击！每一次极佳的训练都在加速你的进步。'
    ];
    msg = msgs[logs.length % msgs.length];
  } else if (entry.feel === 'tired') {
    emoji = '😤'; title = '疲劳中的坚持！';
    msg   = '疲劳也来了！这种坚持比轻松的训练更有价值。超级补偿就在恢复期。';
  } else {
    const total = logs.length;
    emoji = ['💪','✅','🎯','⚡','💥'][total % 5];
    const titleList = ['训练完成！','又一次完美打卡！','坚持就是胜利！','进步从不停歇！','每次都是突破！'];
    title = titleList[total % titleList.length];
    // 个性化消息
    const goal   = _nutrState?.goal;
    const bt     = userProfile?.bodyType;
    const msgs_map = {
      cut:       ['热量赤字正在发挥作用，每次训练都在加速燃脂！','减脂路上的每次打卡都让目标更近一步。'],
      bulk:      ['训练刺激到位，接下来就是充足睡眠和蛋白质！','肌肉在你训练时撕裂，在你休息时生长。'],
      strength:  ['力量提升需要系统积累，你今天又加了一块砖！','渐进超负荷是王道，记录今天的重量！'],
      maintain:  ['保持健康状态，你正在做最重要的事！','规律训练是最好的抗衰老方式。'],
    };
    const pool = msgs_map[goal] || ['每一次打卡都是对自己的投资！', '坚持是最强的天赋。'];
    msg = pool[total % pool.length];
  }

  // 填充弹窗
  document.getElementById('cel-emoji').textContent = emoji;
  document.getElementById('cel-title').textContent = title;
  document.getElementById('cel-msg').innerHTML     = msg;

  // 统计数据
  const weekStart  = getWeekStart();
  const today      = localToday();
  const thisWeekCount = [...new Set(logs.map(l=>l.date))].filter(d=>d>=weekStart&&d<=today).length;
  document.getElementById('cel-stats').innerHTML = `
    <div class="cel-stat"><div class="cel-stat-num">${streak}</div><div class="cel-stat-lbl">🔥 连续天数</div></div>
    <div class="cel-stat"><div class="cel-stat-num">${logs.length}</div><div class="cel-stat-lbl">📅 累计打卡</div></div>
    <div class="cel-stat"><div class="cel-stat-num">${thisWeekCount}</div><div class="cel-stat-lbl">本周次数</div></div>
  `;

  // 新解锁徽章
  const badgeRow = document.getElementById('cel-badge-row');
  if (newBadges.length > 0) {
    badgeRow.innerHTML = `
      <div style="font-size:11px;color:var(--accent);margin-bottom:8px;font-weight:700">🏅 新成就解锁！</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        ${newBadges.map(b=>`<div class="badge-item unlocked"><span class="badge-icon">${b.icon}</span><span>${b.name}</span></div>`).join('')}
      </div>`;
  } else {
    badgeRow.innerHTML = '';
  }

  // 纸屑动画
  spawnConfetti();

  // 显示弹窗
  const modal = document.getElementById('checkin-celebration');
  modal.classList.add('show');
}

function closeCelebration() {
  document.getElementById('checkin-celebration').classList.remove('show');
}

function spawnConfetti() {
  const box = document.getElementById('cel-confetti');
  if (!box) return;
  box.innerHTML = '';
  const colors = ['#f0c040','#ff5a36','#3b8fff','#2ecc71','#ffffff'];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left:${10+Math.random()*80}%;
      top:${-10+Math.random()*30}px;
      background:${colors[i%colors.length]};
      animation-delay:${Math.random()*0.5}s;
      animation-duration:${0.8+Math.random()*0.8}s;
      transform:rotate(${Math.random()*180}deg);
    `;
    box.appendChild(el);
  }
}

function submitCheckin() {
  if (!_ciMuscles.size) { alert('请选择至少一个训练部位'); return; }
  if (!_ciFeel)         { alert('请选择训练感受'); return; }

  const entry = {
    id:       Date.now(),
    date:     localToday(),
    muscles:  [..._ciMuscles],
    sets:     parseInt(document.getElementById('ci-sets').value) || null,
    duration: parseInt(document.getElementById('ci-duration').value) || null,
    feel:     _ciFeel,
    note:     document.getElementById('ci-note').value.trim()
  };

  const logs = loadLogs();
  logs.unshift(entry);
  saveLogs(logs);
  fsWriteLog(entry);

  _ciMuscles.clear(); _ciFeel = null;
  document.querySelectorAll('.muscle-pick-btn').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.feel-btn').forEach(b => b.classList.remove('on'));
  document.getElementById('ci-sets').value     = '';
  document.getElementById('ci-duration').value = '';
  document.getElementById('ci-note').value     = '';

  renderCheckinPage();

  const streak = calcStreak(logs);

  // 先返回森林面板
  closeCheckinForm();

  // 短暂延迟后浇水 + 庆祝
  setTimeout(() => {
    playWaterAnimation(logs);
    const streakEl = document.getElementById('ci-streak-num');
    if (streakEl) {
      streakEl.classList.remove('streak-pulse');
      void streakEl.offsetWidth;
      streakEl.classList.add('streak-pulse');
    }
    setTimeout(() => showCelebration(entry, logs, streak), 700);
  }, 400);
}

function deleteLog(id) {
  saveLogs(loadLogs().filter(l => l.id !== id));
  fsDeleteLog(id);              // 🔥 同步删除到 Firebase
  renderCheckinPage();
}

function clearAllLogs() {
  if (!confirm('确定清空所有训练记录？')) return;
  saveLogs([]);
  // 批量删除 Firestore 中的日志
  if (_syncEnabled && _currentUser) {
    db.collection('users').doc(_currentUser.uid).collection('logs').get().then(snap => {
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      return batch.commit();
    }).catch(console.warn);
  }
  renderCheckinPage();
}

const FEEL_EMOJI = { great:'🔥', good:'💪', tired:'😓' };

/* ─── CHECKIN 渲染（原代码完整保留） ─── */
function calcStreak(logs) {
  const days = [...new Set(logs.map(l => l.date))].sort().reverse();
  let streak = 0;
  const cur = new Date();
  for (let i = 0; i < 365; i++) {
    if (days.includes(localDateOf(cur))) { streak++; cur.setDate(cur.getDate()-1); }
    else break;
  }
  return streak;
}
function getWeekStart() {
  const d = new Date(), day = d.getDay();
  d.setDate(d.getDate() - (day===0 ? 6 : day-1));
  return localDateOf(d);
}
function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  const days = ['日','一','二','三','四','五','六'];
  return `${d.getMonth()+1}/${d.getDate()} 周${days[d.getDay()]}`;
}

function renderCheckinPage() {
  const logs        = loadLogs();
  const today       = localToday();
  const uniqueDays  = [...new Set(logs.map(l => l.date))].sort().reverse();
  const streak      = calcStreak(logs);
  const todayLogs   = logs.filter(l => l.date === today);
  const todayDone   = todayLogs.length > 0;   // 今天是否已打卡（可多次）
  const todayCount  = todayLogs.length;        // 今天打卡次数

  const heroFlame = document.getElementById('ci-hero-flame');
  const heroTitle = document.getElementById('ci-hero-title');
  const heroSub   = document.getElementById('ci-hero-sub');
  if (heroFlame && heroTitle && heroSub) {
    if (todayDone) {
      heroFlame.textContent = todayCount >= 2 ? '🔥' : '✅';
      heroTitle.textContent = todayCount >= 2
        ? `今天已打卡 ${todayCount} 次，继续冲！`
        : '今日任务完成，还想加练？';
      heroSub.textContent = streak > 1
        ? `连续 ${streak} 天训练 · 点击继续加练 💪`
        : '每次打卡都会种下一棵树 🌱';
    } else {
      const hour = new Date().getHours();
      heroFlame.textContent = hour < 12 ? '🌅' : hour < 18 ? '💪' : '🌙';
      heroTitle.textContent = hour < 12 ? '早上好，今天准备好了吗？' : hour < 18 ? '下午冲，今天还没打卡！' : '晚上也可以训练，加油！';
      heroSub.textContent   = streak > 0 ? `已连续 ${streak} 天，别让连击断掉！` : '今天是第 ' + (uniqueDays.length+1) + ' 次打卡的机会';
    }
  }
  const snEl = document.getElementById('ci-streak-num');
  if (snEl) snEl.textContent = streak;

  const weekStart = getWeekStart();
  const thisWeek  = uniqueDays.filter(d => d >= weekStart && d <= today).length;
  const d28ago    = nDaysAgo(28);
  const past28    = uniqueDays.filter(d => d >= d28ago).length;
  const freq28    = (past28/4).toFixed(1);
  document.getElementById('st-week').textContent  = thisWeek;
  document.getElementById('st-total').textContent = uniqueDays.length;
  document.getElementById('st-freq').textContent  = freq28;

  // 更新森林卡片状态
  const forestCard = document.getElementById('forest-card');
  const tapHint    = document.getElementById('forest-tap-hint');
  if (forestCard) {
    forestCard.classList.toggle('checked-today', todayDone);
    // 多次打卡：始终显示点击提示，但内容随状态变化
    if (tapHint) {
      tapHint.style.display = '';
      tapHint.textContent = todayDone
        ? `今天已打卡 ${todayCount} 次，点击再练一组 💪`
        : '点击开始今天的训练';
    }
  }
  renderHeatCal(logs);
  renderForecastChart(logs);
  renderFreqCompare(logs);
  renderAchievements(logs, streak);
  renderForest(logs);

  const listEl = document.getElementById('log-list');
  if (listEl) {
    if (!logs.length) {
      listEl.innerHTML = '<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px">完成第一次训练打卡吧 💪</div>';
    } else {
      listEl.innerHTML = logs.slice(0,30).map(l => `
        <div class="log-entry">
          <div class="log-left">
            <div class="log-date">${formatDate(l.date)}${l.duration?' · '+l.duration+'分钟':''}${l.sets?' · '+l.sets+'组':''}</div>
            <div class="log-muscles">${l.muscles.join(' / ')}</div>
            ${l.note?`<div style="font-size:11px;color:var(--muted);margin-top:2px">"${l.note}"</div>`:''}
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <div class="log-feel-emoji">${FEEL_EMOJI[l.feel]||'💪'}</div>
            <button class="log-del" onclick="deleteLog(${l.id})">✕</button>
          </div>
        </div>`).join('');
    }
  }
}

/* ─── PROGRESS RING + MILESTONES（原代码完整保留） ─── */
function renderProgressRing(logs, uniqueDays, actualFreq) {
  const s = _nutrState;
  const hasGoal = s && s.goal;
  const noGoalNote = document.getElementById('ci-no-goal-note');
  const msList     = document.getElementById('ci-milestones-list');
  const daysLeftEl = document.getElementById('st-days-left');
  if (!hasGoal) {
    if (noGoalNote) noGoalNote.style.display = 'block';
    if (msList) msList.innerHTML = '';
    if (daysLeftEl) daysLeftEl.textContent = '—';
    animateRing(0, '0%', '未设目标');
    return;
  }
  if (noGoalNote) noGoalNote.style.display = 'none';
  const goal = s.goal, plannedFreq = s.freq || 3;
  const today = localToday();
  // 用目标设定日作为起点，没有则退回第一条打卡
  const startIso = s.goalSetAt || (uniqueDays.length ? uniqueDays[uniqueDays.length-1] : today);
  const startDate = new Date(startIso + 'T12:00:00');
  const weeksElapsed = Math.max(0.5, (Date.now() - startDate) / 604800000);
  // 只统计目标设定日之后的打卡
  const logsAfterGoal = logs.filter(l => l.date >= startIso);
  const uniqueAfterGoal = [...new Set(logsAfterGoal.map(l => l.date))];
  const freqAfterGoal = parseFloat((uniqueAfterGoal.length / Math.max(1, weeksElapsed)).toFixed(1));
  let planWeeks=12, progressPct=0, adjustedWeeks=12, ringColor='#f0c040', milestones=[];

  if (goal==='cut') {
    const deficit=(s.tdee||2000)-(s.target||1700);
    const kgPerWk=Math.min(1.2,deficit*7/7700);
    const completionRate=Math.min(1.2,freqAfterGoal/Math.max(1,plannedFreq));
    const effectiveRate=kgPerWk*(0.7+0.3*completionRate);
    const totalKg=kgPerWk*planWeeks;
    const achievedKg=effectiveRate*weeksElapsed;
    progressPct=Math.min(100,(achievedKg/totalKg)*100);
    adjustedWeeks=Math.ceil((totalKg-achievedKg)/Math.max(0.05,effectiveRate))+Math.round(weeksElapsed);
    ringColor=progressPct>=80?'#2ecc71':progressPct>=40?'#f0c040':'#3b8fff';
    milestones=[
      {week:2, icon:'💧',desc:'初期水分流失',  detail:`体重开始下降，约 ${(kgPerWk*0.5+0.5).toFixed(1)} kg`},
      {week:4, icon:'🔥',desc:'真实脂肪燃烧',  detail:`每周稳定减 ${kgPerWk.toFixed(2)} kg 脂肪`},
      {week:8, icon:'✨',desc:'体型轮廓变化',  detail:`体脂率已降约 ${(kgPerWk*6/s.w*100).toFixed(1)}%，衣服明显宽松`},
      {week:planWeeks,icon:'🏆',desc:'目标体型达成',detail:`预计总减脂 ${totalKg.toFixed(1)} kg`}
    ];
  } else if (goal==='bulk'||goal==='bulk-lean') {
    const level=userProfile.level||'beginner';
    const baseRate=level==='beginner'?0.9:level==='intermediate'?0.6:0.3;
    const freqMult=freqAfterGoal>=4?1.1:freqAfterGoal>=3?1.0:0.85;
    const effRate=baseRate*freqMult;
    planWeeks=16;
    const totalKg=baseRate*(planWeeks/4);
    const achieved=effRate*(weeksElapsed/4);
    progressPct=Math.min(100,(achieved/totalKg)*100);
    adjustedWeeks=Math.ceil((totalKg-achieved)/Math.max(0.01,effRate/4))+Math.round(weeksElapsed);
    milestones=[
      {week:2, icon:'⚡',desc:'神经肌肉适应',detail:'力量提升 10–25%（神经募集改善）'},
      {week:5, icon:'📈',desc:'肌肉合成启动',detail:`泵感增强，累计约 ${(effRate*1).toFixed(1)} kg`},
      {week:10,icon:'💪',desc:'围度明显增加',detail:`臂围/胸围 +1–2cm，力量大幅提升`},
      {week:planWeeks,icon:'🏆',desc:'增肌目标完成',detail:`净增肌约 ${totalKg.toFixed(1)} kg`}
    ];
  } else {
    progressPct=Math.min(100,(weeksElapsed/planWeeks)*100*Math.min(1,actualFreq/Math.max(1,plannedFreq)));
    adjustedWeeks=planWeeks; ringColor='#2ecc71';
    milestones=[
      {week:2, icon:'⚖️',desc:'热量平衡适应',detail:'体重稳定，水分波动正常'},
      {week:6, icon:'💪',desc:'体能提升',     detail:'可能发生 Body Recomp（同期增减）'},
      {week:12,icon:'🏆',desc:'体型优化完成', detail:'体脂率改善，整体状态最佳'}
    ];
  }

  const remWeeks=Math.max(0,adjustedWeeks-weeksElapsed);
  const remDays=Math.round(remWeeks*7);
  if (daysLeftEl) daysLeftEl.textContent = remDays>0?remDays:'已达标';
  const ringLabel=document.getElementById('ci-ring-label');
  const ringDays =document.getElementById('ci-ring-days');
  const goalNames={cut:'减脂进度',bulk:'增肌进度','bulk-lean':'精益增肌',maintain:'体型维持'};
  if (ringLabel) ringLabel.textContent = goalNames[goal]||'目标进度';
  if (ringDays)  ringDays.textContent  = remDays>0?`预计还需 ${remDays} 天`:'🎉 目标达成！';
  animateRing(progressPct, Math.round(progressPct)+'%', '', ringColor);

  if (msList) {
    msList.innerHTML = milestones.map(ms => {
      const msDate=new Date(startDate); msDate.setDate(msDate.getDate()+ms.week*7);
      const msIso=localDateOf(msDate);
      const done=today>=msIso||progressPct>=(ms.week/planWeeks*100);
      const active=!done&&progressPct>=((ms.week-(planWeeks/milestones.length))/planWeeks*100);
      const cls=done?'done':active?'active':'future';
      return `
        <div class="ci-ms-item">
          <div class="ci-ms-dot ${cls}">${ms.icon}</div>
          <div class="ci-ms-body">
            <div class="ci-ms-week">${msIso.slice(5).replace('-','/')} 前后</div>
            <div class="ci-ms-desc">${ms.desc}</div>
            <div class="ci-ms-detail">${ms.detail}</div>
          </div>
          <div class="ci-ms-badge ${cls}">${done?'✓ 已达成':active?'进行中':'第'+ms.week+'周'}</div>
        </div>`;
    }).join('');
  }
}

function animateRing(pct, label, sub, color) {
  color = color || '#f0c040';
  const fill=document.getElementById('ci-ring-fill');
  const pctEl=document.getElementById('ci-ring-pct');
  const subEl=document.getElementById('ci-ring-sub');
  if (!fill||!pctEl) return;
  const circ=2*Math.PI*55, offset=circ*(1-pct/100);
  fill.style.stroke=color; fill.style.strokeDasharray=circ; fill.style.strokeDashoffset=circ;
  requestAnimationFrame(()=>{ setTimeout(()=>{ fill.style.strokeDashoffset=offset; },60); });
  pctEl.textContent=label;
  if (subEl&&sub) subEl.textContent=sub;
}

/* ─── 月历打卡记录 ─── */
let _calYear  = new Date().getFullYear();
let _calMonth = new Date().getMonth(); // 0-indexed

function calNavMonth(dir) {
  _calMonth += dir;
  if (_calMonth > 11) { _calMonth = 0;  _calYear++; }
  if (_calMonth < 0)  { _calMonth = 11; _calYear--; }
  const logs = loadLogs();
  renderCalendar(logs);
}

function renderHeatCal(logs) {
  // reset to current month when called from renderCheckinPage
  _calYear  = new Date().getFullYear();
  _calMonth = new Date().getMonth();
  renderCalendar(logs);
}

function renderCalendar(logs) {
  const grid  = document.getElementById('ci-cal-grid');
  const label = document.getElementById('ci-cal-month-label');
  if (!grid || !label) return;

  const today    = localToday();  // 本地时区，避免UTC偏移导致日期错误

  // month label
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  label.textContent = `${_calYear}年 ${monthNames[_calMonth]}`;

  // first day of month (0=Sun)
  const firstDay = new Date(_calYear, _calMonth, 1).getDay();
  // days in month
  const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();

  let html = '';
  // leading empty cells
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="ci-cal-cell ci-cal-empty"></div>`;
  }
  // day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const iso      = `${_calYear}-${String(_calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayLogs  = logs.filter(l => l.date === iso);
    const cnt      = dayLogs.length;
    const isToday  = iso === today;
    const isFuture = iso > today;

    // ── 强度计算（0~4）──────────────────────────
    // 综合：打卡次数 × 肌群数 × 体感
    let intensity = 0;
    if (cnt > 0) {
      // 基础分：次数
      let score = cnt;
      // 肌群数加权（最多+2）
      const muscles = dayLogs.reduce((a, l) => a + (l.muscles?.length || 0), 0);
      score += Math.min(muscles / 3, 2);
      // 体感加权
      const feels = dayLogs.map(l => l.feel);
      if (feels.includes('great'))      score += 1.5;
      else if (feels.includes('tired')) score -= 0.5;
      // 映射到 1~4（已打卡时至少1）
      intensity = Math.min(4, Math.max(1, Math.round(score)));
    }
    // ──────────────────────────────────────────────

    let cls = 'ci-cal-cell';
    if (isToday)        cls += ' ci-cal-today' + (cnt > 0 ? ` ci-cal-i${intensity}` : '');
    else if (isFuture)  cls += ' ci-cal-future';
    else if (cnt > 0)   cls += ` ci-cal-i${intensity}`;
    else                cls += ' ci-cal-rest';

    const check = cnt > 0 ? `<span class="ci-cal-check">✓</span>` : '';
    const multi = cnt > 1 ? `<span class="ci-cal-multi">${cnt}</span>` : '';

    html += `<div class="${cls}" title="${iso}${cnt ? ' · '+cnt+'次' : ''}">
      <span class="ci-cal-num">${d}</span>${check}${multi}
    </div>`;
  }
  grid.innerHTML = html;
}

/* ─── NUTRITION（原代码完整保留，calcNutrition 末尾加 fsWriteNutr） ─── */
let _nutrState = {};
let _mealPrefs = new Set();

function getActivePrefs() { return [..._mealPrefs]; }
function togglePref(el) {
  const p=el.dataset.pref;
  if (_mealPrefs.has(p)) { _mealPrefs.delete(p); el.classList.remove('on'); }
  else                   { _mealPrefs.add(p);    el.classList.add('on'); }
  if (_nutrState.goal) buildMealPlan(_nutrState, getActivePrefs());
}

function calcNutrition() {
  const h=parseFloat(document.getElementById('n-height').value);
  const w=parseFloat(document.getElementById('n-weight').value);
  const a=parseInt(document.getElementById('n-age').value);
  const sex=document.getElementById('n-sex').value;
  const act=parseFloat(document.getElementById('n-activity').value);
  const goal=document.getElementById('n-goal').value;
  const bf=parseFloat(document.getElementById('n-bodyfat').value)||null;
  const freq=parseInt(document.getElementById('n-freq').value);
  if (!h||!w||!a||h<100||w<20||a<10) { alert('请填写完整的身体数据'); return; }

  let bmr, bmrMethod;
  if (bf&&bf>5&&bf<50) {
    const lbm=w*(1-bf/100); bmr=370+21.6*lbm;
    bmrMethod=`Katch-McArdle（LBM ${lbm.toFixed(1)}kg，体脂率 ${bf}%）`;
  } else {
    bmr=sex==='male'?10*w+6.25*h-5*a+5:10*w+6.25*h-5*a-161;
    bmrMethod='Mifflin-St Jeor（未填体脂率）';
  }
  const tdee=Math.round(bmr*act);
  const goalAdj={cut:-300,maintain:0,bulk:300,'bulk-lean':150};
  const target=tdee+(goalAdj[goal]||0);
  const bmi=(w/((h/100)**2)).toFixed(1);
  const bmiInfo=bmi<18.5?['#3b8fff','偏瘦']:bmi<24?['#2ecc71','正常']:bmi<28?['#f0c040','偏重']:['#ff5a36','肥胖'];
  const refW=(bf&&bf>5)?w*(1-bf/100):w;
  const pMult=goal==='bulk'||goal==='bulk-lean'?2.2:goal==='cut'?2.5:2.0;
  const protG=Math.round(refW*pMult);
  const fatG=Math.round(target*0.25/9);
  const carbG=Math.max(0,Math.round((target-protG*4-fatG*9)/4));
  // 如果已有目标，先归档（计算当前进度再存）
  if (_nutrState && _nutrState.goal && _nutrState.goalSetAt) {
    const logs = loadLogsLocal();
    const uniqueDays = [...new Set(logs.map(l => l.date))].sort();
    const actualFreq = (() => {
      const now = Date.now();
      const days28ago = nDaysAgo(28);
      const cnt = [...new Set(logs.filter(l=>l.date>=days28ago).map(l=>l.date))].length;
      return parseFloat((cnt/4).toFixed(1));
    })();
    // 简单估算当前进度
    const startDate = new Date(_nutrState.goalSetAt + 'T12:00:00');
    const weeksElapsed = Math.max(0, (Date.now() - startDate) / 604800000);
    const planWeeks = (_nutrState.goal === 'bulk' || _nutrState.goal === 'bulk-lean') ? 16 : 12;
    const pct = Math.min(100, Math.round(weeksElapsed / planWeeks * 100));
    archiveCurrentGoal(pct);
  }

  _nutrState = { h, w, a, sex, act, goal, bf, freq,
    bmr: Math.round(bmr), tdee, target, bmi, protG, fatG, carbG,
    goalSetAt: new Date().toISOString().slice(0, 10)  // ← 目标设定日
  };

  fsWriteNutr(_nutrState);        // 🔥 同步到 Firebase

  document.getElementById('res-kcal').textContent=target.toLocaleString();
  document.getElementById('bmi-dot').style.background=bmiInfo[0];
  document.getElementById('bmi-text').textContent=`BMI ${bmi} — ${bmiInfo[1]}`;
  document.getElementById('tdee-breakdown').innerHTML=
    `基础代谢 BMR <b>${Math.round(bmr)}</b> kcal &nbsp;·&nbsp; TDEE <b>${tdee}</b> kcal &nbsp;·&nbsp; 目标 <b>${target}</b> kcal<br>
    <span style="color:var(--muted);font-size:10px">公式：${bmrMethod}</span>`;

  const macroEl=document.getElementById('macro-bars');
  if (macroEl) {
    const total=protG*4+fatG*9+carbG*4;
    macroEl.innerHTML=[
      {label:'蛋白质',g:protG,kcal:protG*4,color:'#3b8fff'},
      {label:'脂肪',  g:fatG, kcal:fatG*9, color:'#f0c040'},
      {label:'碳水',  g:carbG,kcal:carbG*4,color:'#2ecc71'}
    ].map(m=>`
      <div class="macro-row">
        <div class="macro-label"><span style="color:${m.color}">${m.label}</span><span>${m.g}g / ${m.kcal}kcal</span></div>
        <div class="macro-bar-wrap"><div class="macro-bar" style="width:${total?Math.round(m.kcal/total*100):0}%;background:${m.color}"></div></div>
      </div>`).join('');
  }

  buildTimeline(_nutrState);
  buildMealPlan(_nutrState, getActivePrefs());
  document.getElementById('nutr-result')?.classList.remove('nutr-hidden');
  document.getElementById('timeline-card')?.classList.remove('nutr-hidden');
  document.getElementById('meal-card')?.classList.remove('nutr-hidden');
}

function buildTimeline(s) {
  const el=document.getElementById('nutr-timeline'); if (!el) return;
  const goalMap={
    cut:      [{w:2,icon:'💧',t:'适应期',d:'体重开始波动，以水分为主'},{w:4,icon:'🔥',t:'燃脂期',d:`每周约减 ${Math.min(1.2,(s.tdee-s.target)*7/7700).toFixed(2)} kg`},{w:12,icon:'✨',t:'塑形完成',d:'体型明显改善，维持新习惯'}],
    bulk:     [{w:2,icon:'⚡',t:'神经适应',d:'力量快速提升'},{w:8,icon:'📈',t:'合成爆发',d:'肌肉围度开始增加'},{w:16,icon:'💪',t:'增肌完成',d:'达到预期增肌目标'}],
    'bulk-lean':[{w:3,icon:'⚡',t:'神经适应',d:'力量提升，体脂不升'},{w:8,icon:'💪',t:'精益增肌',d:'肌肉增加，脂肪稳定'},{w:16,icon:'🏆',t:'目标达成',d:'体型最优化'}],
    maintain: [{w:2,icon:'⚖️',t:'热量平衡',d:'体重稳定'},{w:6,icon:'💪',t:'体能提升',d:'可能同期增减'},{w:12,icon:'🎯',t:'体型优化',d:'整体状态最佳'}]
  };
  const steps=goalMap[s.goal]||goalMap.maintain;
  el.innerHTML=steps.map((st,i)=>`
    <div class="tl-step">
      <div class="tl-icon">${st.icon}</div>
      <div class="tl-line${i===steps.length-1?' last':''}"></div>
      <div class="tl-body"><div class="tl-week">第 ${st.w} 周</div><div class="tl-title">${st.t}</div><div class="tl-desc">${st.d}</div></div>
    </div>`).join('');
}

function buildMealPlan(s, prefs) {
  const el       = document.getElementById('meal-plan');
  const tabsEl   = document.getElementById('meal-day-tabs');
  if (!el) return;

  // ── 读取偏好 ──
  const diet   = document.getElementById('pref-diet')?.value   || 'none';
  const cook   = document.getElementById('pref-cook')?.value   || 'normal';
  const budget = document.getElementById('pref-budget')?.value || 'mid';
  const avoid  = new Set(prefs);

  const isVeg     = diet === 'veg';
  const noLactose = diet === 'lactose';
  const isHalal   = diet === 'halal';

  // ── 食材池 ──
  const ALL_PROTEINS = [
    { key:'chicken',  label:'鸡胸肉 150g',     tags:[] },
    { key:'salmon',   label:'三文鱼 120g',      tags:['fish'] },
    { key:'egg',      label:'鸡蛋 2个',         tags:['egg'] },
    { key:'beef',     label:'牛肉 100g',        tags:['meat'] },
    { key:'tuna',     label:'金枪鱼罐头 100g',  tags:['fish'] },
    { key:'shrimp',   label:'虾仁 120g',        tags:['seafood'] },
    { key:'tofu',     label:'豆腐 150g',        tags:['veg'] },
    { key:'soy',      label:'豆浆 400ml',       tags:['veg','dairy'] },
    { key:'chickpea', label:'鹰嘴豆 100g',      tags:['veg'] },
    { key:'yogurt',   label:'希腊酸奶 200g',    tags:['dairy'] },
    { key:'lamb',     label:'羊肉 100g',        tags:['meat','halal'] },
    { key:'pork',     label:'瘦猪肉 120g',      tags:['meat'] },
    { key:'cod',      label:'鳕鱼 130g',        tags:['fish'] },
    { key:'tempeh',   label:'天贝 100g',        tags:['veg'] },
  ].filter(p => {
    if (avoid.has(p.key)) return false;
    if (isVeg  && !p.tags.includes('veg')) return false;
    if (noLactose && p.tags.includes('dairy')) return false;
    if (isHalal && (p.tags.includes('pork') || p.tags.includes('fish'))) return false;
    return true;
  }).map(p => p.label);
  if (!ALL_PROTEINS.length) ALL_PROTEINS.push('鸡胸肉 150g', '豆腐 150g');

  const ALL_CARBS = [
    { key:'oat',         label:'燕麦 80g' },
    { key:'bread',       label:'全麦面包 2片' },
    { key:'rice',        label:'糙米饭 150g' },
    { key:'sweetpotato', label:'红薯 200g' },
    { key:'corn',        label:'玉米 1根' },
    { key:'quinoa',      label:'藜麦 80g' },
    { key:'noodle',      label:'全麦面条 100g' },
    { key:'potato',      label:'土豆泥 150g' },
  ].filter(p => !avoid.has(p.key)).map(p => p.label);
  if (!ALL_CARBS.length) ALL_CARBS.push('糙米饭 150g', '红薯 200g');

  const SNACKS = {
    low:  [['香蕉 1根','花生 15g'],['苹果 1个','核桃 10g'],['橙子 1个','花生酱 1勺'],
           ['梨 1个','葵花籽 10g'],['猕猴桃 2个'],['葡萄 150g'],['蒸玉米 1根']],
    mid:  [['混合坚果 25g','水果 100g'],['蛋白棒 1根'],['坚果 20g + 蓝莓'],
           ['无糖酸奶 150g','草莓 100g'],['能量球 2个'],['坚果棒 1根'],['苹果片 + 花生酱']],
    high: [['乳清蛋白粉 1勺','牛奶 200ml'],['希腊酸奶 200g + 混合莓'],['蛋白棒 + 橙汁'],
           ['三文鱼片 50g + 车厘子'],['开心果 30g + 蓝莓 100g'],['黑巧克力 20g + 坚果'],['椰子水 + 蛋白棒']],
  };
  const snackArr = SNACKS[budget] || SNACKS.mid;

  const milkItem   = (avoid.has('milk') || noLactose) ? '豆浆 200ml' : '牛奶 200ml';
  const snackDairy = (avoid.has('milk') || noLactose) ? '无糖豆浆 200ml' : '低脂酸奶 120g';

  const vegOptions = cook === 'easy'
    ? ['焯菠菜 150g','生菜沙拉 100g','黄瓜 1根','番茄 2个','西芹 100g','紫甘蓝 80g','豆芽 100g']
    : cook === 'detail'
    ? ['清炒西兰花+菌菇 200g','番茄炒鸡蛋','蒜蓉菠菜 200g','彩椒炒木耳 150g','茄子蒸肉 150g','冬瓜汤 200g','蒸南瓜 150g']
    : ['蒸西兰花 150g','蒸南瓜 100g','炒包菜 150g','凉拌黄瓜 100g','番茄汤 200g','炒豆角 150g','蒸芦笋 150g'];

  const WEEK_DAYS = ['周一','周二','周三','周四','周五','周六','周日'];

  // ── 生成7天餐单（每天食材用不同组合，保证多样化）──
  const weekMeals = WEEK_DAYS.map((dayName, dayIdx) => {
    // 用 dayIdx 偏移食材池，每天不重复
    const p = (i) => ALL_PROTEINS[(dayIdx + i) % ALL_PROTEINS.length];
    const c = (i) => ALL_CARBS[(dayIdx + i) % ALL_CARBS.length];
    const v = (i) => vegOptions[(dayIdx + i) % vegOptions.length];
    const snk = snackArr[dayIdx % snackArr.length];
    const isRest = (dayIdx === 6); // 周日建议休息

    return {
      dayName,
      isRest,
      meals: isRest ? [
        { time:'07:30', name:'早餐', kcal: Math.round(s.target*0.25), items:[c(0), p(0), milkItem] },
        { time:'12:30', name:'午餐', kcal: Math.round(s.target*0.35), items:[c(1), p(1), v(0)] },
        { time:'18:30', name:'晚餐', kcal: Math.round(s.target*0.30), items:[c(2), '豆腐 100g', v(1)] },
        { time:'21:00', name:'夜宵', kcal: Math.round(s.target*0.10), items:[snackDairy,'水果 100g'] },
      ] : [
        { time:'07:00', name:'早餐',   kcal: Math.round(s.target*0.25), items:[c(0), p(0), milkItem] },
        { time:'10:00', name:'加餐',   kcal: Math.round(s.target*0.10), items: snk },
        { time:'12:30', name:'午餐',   kcal: Math.round(s.target*0.30), items:[c(1), p(1), v(0)] },
        { time:'15:30', name:'下午茶', kcal: Math.round(s.target*0.10), items:[snackDairy,'水果 80g'] },
        { time:'18:30', name:'晚餐',   kcal: Math.round(s.target*0.25), items:[c(2), p(2), v(1)] },
      ]
    };
  });

  // ── 渲染 tabs ──
  let _activeDayIdx = 0; // 默认显示周一
  // 判断今天是周几（0=周日 → 6, 1=周一 → 0）
  const todayDow = new Date().getDay();
  _activeDayIdx  = todayDow === 0 ? 6 : todayDow - 1;

  function renderDayMeals(idx) {
    const day = weekMeals[idx];
    el.innerHTML = day.meals.map(m => `
      <div class="meal-card">
        <div class="meal-top">
          <div><div class="meal-time">${m.time}</div><div class="meal-name">${m.name}${day.isRest?' 🧘':'💪'}</div></div>
          <div class="meal-kcal">${m.kcal} kcal</div>
        </div>
        <div class="meal-items">${m.items.map(it=>`<span class="meal-item">${it}</span>`).join('')}</div>
      </div>`).join('')
    + `<div style="font-size:11px;color:var(--muted);padding:8px 4px;text-align:center">
        蛋白质 <span style="color:var(--accent)">${s.protG}g</span> ·
        脂肪 <span style="color:var(--accent)">${s.fatG}g</span> ·
        碳水 <span style="color:var(--accent)">${s.carbG}g</span>
        ${day.isRest ? ' · <span style="color:var(--muted)">休息日低强度饮食</span>' : ''}
      </div>`;
  }

  if (tabsEl) {
    tabsEl.innerHTML = WEEK_DAYS.map((d, i) => `
      <button class="meal-day-tab${i===_activeDayIdx?' active':''}"
              data-idx="${i}" onclick="window._mealTabClick(${i})">
        ${d}${i===_activeDayIdx?'':''}
      </button>`).join('');
  }
  renderDayMeals(_activeDayIdx);

  window._mealTabClick = function(idx) {
    _activeDayIdx = idx;
    document.querySelectorAll('.meal-day-tab').forEach((b,i) => {
      b.classList.toggle('active', i === idx);
    });
    renderDayMeals(idx);
  };

  // ── 偏好摘要 ──
  const summaryEl = document.getElementById('meal-pref-summary');
  if (summaryEl) {
    const avoidLabels = [...avoid].map(v => ({
      salmon:'三文鱼',beef:'牛肉',lamb:'羊肉',shrimp:'虾',egg:'鸡蛋',
      milk:'牛奶',oat:'燕麦',broccoli:'西兰花',sweetpotato:'红薯',tofu:'豆腐'
    }[v]||v)).filter(Boolean);
    const dietLabel   = {none:'无限制',veg:'素食',lactose:'无乳糖',halal:'清真'}[diet]||'';
    const budgetLabel = {low:'经济型',mid:'中等',high:'高端'}[budget]||'';
    const cookLabel   = {easy:'快手',normal:'普通',detail:'精心'}[cook]||'';
    const parts = [];
    if (avoidLabels.length) parts.push(`🚫 ${avoidLabels.join('、')}`);
    if (diet !== 'none')    parts.push(`🥗 ${dietLabel}`);
    parts.push(`💰 ${budgetLabel}`, `🍳 ${cookLabel}`);
    summaryEl.textContent = parts.join(' · ');
  }
}

/* ─── BODY MAP（原代码完整保留） ─── */
function setView(view, btn) {
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('svg-front').classList.toggle('vis', view==='front');
  document.getElementById('svg-back').classList.toggle('vis',  view==='back');
  if (selectedMuscle) {
    document.querySelectorAll('.muscle-zone.sel').forEach(z=>z.classList.remove('sel'));
    document.querySelectorAll(`[data-m="${selectedMuscle}"]`).forEach(z=>z.classList.add('sel'));
  }
}
function attachMuscleClicks() {
  document.querySelectorAll('.muscle-zone').forEach(zone => {
    zone.addEventListener('click', () => {
      const m=zone.getAttribute('data-m');
      if (!muscleDB[m]) return;
      selectedMuscle=m;
      document.querySelectorAll('.muscle-zone.sel').forEach(z=>z.classList.remove('sel'));
      document.querySelectorAll(`[data-m="${m}"]`).forEach(z=>z.classList.add('sel'));
      renderExercises(m);
    });
  });
}
function renderExercises(muscleKey) {
  const data=muscleDB[muscleKey]; if (!data) return;
  document.getElementById('panel-header').style.display='flex';
  document.getElementById('panel-title').childNodes[0].textContent=data.name+' ';
  document.getElementById('panel-sub').textContent=data.en;
  const tipMap=data.bodyTypeTips||{};
  document.getElementById('tip-text').textContent=tipMap[userProfile.bodyType]||'点击动作卡片查看详细步骤';
  const types=[...new Set(data.exercises.map(e=>e.type))];
  document.getElementById('filter-row').innerHTML=`
    <div class="filter-chip on" data-f="all" onclick="filterEx(this,'all','${muscleKey}')">全部</div>
    ${types.map(t=>`<div class="filter-chip" data-f="${t}" onclick="filterEx(this,'${t}','${muscleKey}')">${t}</div>`).join('')}`;
  activeFilters=new Set(['all']);
  renderCards(muscleKey,'all');

  if (window.innerWidth<=767) {
    document.getElementById('body-panel')?.classList.add('mobile-hidden');
    document.getElementById('exercise-panel')?.classList.remove('mobile-hidden');
    document.getElementById('tab-body')?.classList.remove('active');
    document.getElementById('tab-exercises')?.classList.add('active');
  }
}
function filterEx(el,f,muscleKey) {
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  renderCards(muscleKey,f);
}
function renderCards(muscleKey, filter) {
  const data=muscleDB[muscleKey];
  const exercises=filter==='all'?data.exercises:data.exercises.filter(e=>e.type===filter);
  const level=userProfile.level, bodyType=userProfile.bodyType;
  const scroll=document.getElementById('exercises-scroll');
  scroll.innerHTML='';
  if (!exercises.length) { scroll.innerHTML='<div class="empty"><div class="empty-icon">🔍</div><h3>暂无该类型动作</h3></div>'; return; }
  exercises.forEach((ex,i)=>{
    const card=document.createElement('div');
    card.className='ex-card';
    card.style.animationDelay=`${i*0.07}s`;
    const diff=ex.diff[level]||ex.diff.beginner;
    const diffClass=diff==='初级'?'diff-beginner':diff==='中级'?'diff-intermediate':'diff-advanced';
    card.innerHTML=`
      <div class="card-anim" onclick="openModal('${ex.id}','${muscleKey}')">
        <canvas class="anim-canvas" id="canvas-${ex.id}" width="320" height="170"></canvas>
        <div class="diff-tag ${diffClass}">${diff==='初级'?'🟢':diff==='中级'?'🟡':'🔴'} ${diff}</div>
        <div class="video-tag">▶ 教程</div>
        <div class="play-overlay"><div class="play-btn">▶</div><div class="play-text">点击查看详细教程</div></div>
      </div>
      <div class="card-body">
        <div class="card-row1">
          <div><div class="card-name">${ex.icon} ${ex.name}</div><div class="card-en">${ex.en}</div></div>
          <span class="card-type-badge">${ex.type}</span>
        </div>
        <div class="card-desc">${ex.desc}</div>
        <div class="steps-toggle" onclick="toggleSteps(this)">
          <span class="steps-toggle-label">📋 动作步骤（${ex.steps.length}步）</span>
          <span class="steps-arrow">▼</span>
        </div>
        <div class="steps-body">
          ${ex.steps.map((s,idx)=>`
            <div class="step-item">
              <span class="step-num-circle">${idx+1}</span>
              <div class="step-content">${s.text}${s.tip?`<div class="step-tip">⚠️ 注意：${s.tip}</div>`:''}</div>
            </div>`).join('')}
        </div>
        <div class="card-stats">
          <div class="stat-pill"><div class="stat-val">${ex.sets[level]||ex.sets.beginner}</div><div class="stat-lbl">组数×次数</div></div>
          <div class="stat-pill"><div class="stat-val">${ex.rest[level]||ex.rest.beginner}</div><div class="stat-lbl">组间休息</div></div>
          <div class="stat-pill"><div class="stat-val" style="font-size:11px">${ex.weight[level]||ex.weight.beginner}</div><div class="stat-lbl">建议重量</div></div>
        </div>
        ${getBodyTypeAdvice(ex,bodyType)?`<div class="body-type-banner">💡 ${getBodyTypeAdvice(ex,bodyType)}</div>`:''}
      </div>`;
    scroll.appendChild(card);
    setTimeout(()=>drawAnimation(ex.id,ex.animation),50);
  });
}
function getBodyTypeAdvice(ex, bodyType) {
  const advices={
    ectomorph:{'复合':`外胚层：大重量低次数，充足休息120秒+`,'孤立':'外胚层：孤立动作作为辅助，主力靠复合动作','徒手':'外胚层：可加重背心增加刺激','等长':'外胚层：稳定性训练增强运动表现','拉伸':'外胚层：改善运动幅度和激活范围'},
    mesomorph: {'复合':'中胚层：天生适合！每4-6周更换变化','孤立':'中胚层：精雕细琢，配合复合效果佳','徒手':'中胚层：加入节奏变化增加难度','等长':'中胚层：核心训练提升所有动作表现','拉伸':'中胚层：良好柔韧性提升动作效率'},
    endomorph: {'复合':'内胚层：缩短组间休息至60秒，做超级组','孤立':'内胚层：15-20次高次数超级组燃脂塑形','徒手':'内胚层：HIIT变式燃脂效果极佳','等长':'内胚层：核心训练改善体型比例','拉伸':'内胚层：每次训练后必须拉伸'}
  };
  return advices[bodyType]?.[ex.type]||null;
}
function toggleSteps(el) {
  el.nextElementSibling.classList.toggle('open');
  el.querySelector('.steps-arrow').classList.toggle('open');
}

/* ─── CANVAS ANIMATIONS（原代码完整保留） ─── */
const animFrames={};
function drawAnimation(id,type) {
  const canvas=document.getElementById(`canvas-${id}`); if (!canvas) return;
  const ctx=canvas.getContext('2d');
  let frame=0;
  function loop() {
    ctx.clearRect(0,0,320,170);
    const grad=ctx.createLinearGradient(0,0,0,170);
    grad.addColorStop(0,'#0a0c14'); grad.addColorStop(1,'#0f1320');
    ctx.fillStyle=grad; ctx.fillRect(0,0,320,170);
    ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=1;
    for(let x=0;x<320;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,170);ctx.stroke();}
    for(let y=0;y<170;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(320,y);ctx.stroke();}
    drawExerciseAnim(ctx,type,frame,320,170);
    frame++;
    animFrames[id]=requestAnimationFrame(loop);
  }
  if (animFrames[id]) cancelAnimationFrame(animFrames[id]);
  loop();
}
function drawExerciseAnim(ctx,type,frame,W,H) {
  const t=frame/60,cx=W/2;
  const bodyColor='#c8d4e8',accentColor='#f0c040';
  const cycle=Math.sin(t*Math.PI*1.5),prog=(cycle+1)/2;
  function circle(x,y,r,color,glow){if(glow){ctx.shadowBlur=12;ctx.shadowColor=glow;}ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.shadowBlur=0;}
  function line(x1,y1,x2,y2,color,w,glow){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=w||3;ctx.lineCap='round';if(glow){ctx.shadowBlur=10;ctx.shadowColor=glow;}ctx.stroke();ctx.shadowBlur=0;}
  function label(text,x,y,color){ctx.fillStyle=color||'rgba(240,192,64,0.8)';ctx.font='10px Noto Sans SC,sans-serif';ctx.textAlign='center';ctx.fillText(text,x,y);}

  if(type==='bench'||type==='incline'){
    const tilt=type==='incline'?-0.35:0;
    ctx.save();ctx.translate(cx,H/2+10);ctx.rotate(tilt);
    ctx.fillStyle='#2a3040';ctx.fillRect(-70,10,140,12);ctx.fillRect(-70,22,12,28);ctx.fillRect(58,22,12,28);
    line(0,-30,0,12,bodyColor,14);circle(0,-40,10,bodyColor);
    const armAngle=0.6+prog*0.5;
    line(0,-20,-40*Math.cos(armAngle),-20+40*Math.sin(armAngle),bodyColor,10);
    line(0,-20,40*Math.cos(armAngle),-20+40*Math.sin(armAngle),bodyColor,10);
    const barY=-50+prog*20;
    line(-65,barY,65,barY,'#888',6,'#f0c040');circle(-60,barY,8,accentColor,accentColor);circle(60,barY,8,accentColor,accentColor);
    label(type==='incline'?'上斜卧推':'卧推',0,58,accentColor);ctx.restore();
  } else if(type==='squat'){
    ctx.save();ctx.translate(cx,H/2+20);
    const sd=0.4+prog*0.6,hipY=-sd*45;
    line(-55,-70,55,-70,'#888',5,'#f0c040');circle(-52,-70,7,accentColor);circle(52,-70,7,accentColor);
    const ta=0.2+sd*0.25,tH={x:0,y:hipY},tS={x:Math.sin(ta)*60,y:hipY-Math.cos(ta)*60};
    line(tH.x,tH.y,tS.x,tS.y,bodyColor,14);circle(tS.x,tS.y-10,10,bodyColor);
    const kx=sd*20;
    line(tH.x-8,tH.y,-kx-8,0,bodyColor,10);line(tH.x+8,tH.y,kx+8,0,bodyColor,10);
    line(-kx-8,0,-22,30,bodyColor,9);line(kx+8,0,22,30,bodyColor,9);
    line(-80,30,80,30,'#3a4050',2);label('深蹲',0,52,accentColor);ctx.restore();
  } else if(type==='deadlift'||type==='rdl'){
    ctx.save();ctx.translate(cx,H/2+20);
    const lH=-prog*55,tt=(1-prog)*0.8,hpx=5,hpy=lH-5,sx=Math.sin(tt)*55,sy=hpy-Math.cos(tt)*55;
    line(-65,lH,65,lH,'#888',5,accentColor);circle(-60,lH,9,accentColor);circle(60,lH,9,accentColor);
    line(hpx,hpy,sx,sy,bodyColor,14);circle(sx,sy-10,10,bodyColor);
    line(hpx-5,hpy,-12,-5+(1-prog)*20,bodyColor,10);line(hpx+5,hpy,12,-5+(1-prog)*20,bodyColor,10);
    line(-80,25,70,25,'#3a4050',2);label(type==='rdl'?'罗马尼亚硬拉':'硬拉',0,45,accentColor);ctx.restore();
  } else if(type==='pullup'||type==='lat-pulldown'){
    ctx.save();ctx.translate(cx,H/2-5);
    line(-60,-70,60,-70,'#888',7,accentColor);circle(-55,-70,6,accentColor);circle(55,-70,6,accentColor);
    const pp=prog,bt2=-20-pp*40;
    circle(0,bt2-10,10,bodyColor);line(0,bt2,0,bt2+50,bodyColor,13);
    line(-25,bt2+5,-45,-70+((1-pp)*140),bodyColor,9);line(25,bt2+5,45,-70+((1-pp)*140),bodyColor,9);
    label(type==='pullup'?'引体向上':'高位下拉',0,58,accentColor);ctx.restore();
  } else if(type==='curl'||type==='hammer'){
    ctx.save();ctx.translate(cx,H/2+10);
    circle(0,-60,10,bodyColor);line(0,-50,0,10,bodyColor,14);
    const ca=Math.PI*0.1+prog*Math.PI*0.75,ex2=-30,ey=-10;
    const hx=ex2-Math.cos(ca)*38,hy=ey+Math.sin(ca)*38;
    line(ex2,ey-15,ex2,ey,bodyColor,9);line(ex2,ey,hx,hy,bodyColor,8);
    line(hx-8,hy,hx+8,hy,'#888',5,accentColor);circle(hx-8,hy,5,accentColor);circle(hx+8,hy,5,accentColor);
    label(type==='hammer'?'锤式弯举':'哑铃弯举',0,58,accentColor);ctx.restore();
  } else if(type==='hip-thrust'){
    ctx.save();ctx.translate(cx-10,H/2+15);
    ctx.fillStyle='#2a3040';ctx.fillRect(-80,-20,50,18);
    const hipY2=-5-prog*40;
    line(-60,-10,-10,hipY2,bodyColor,13);line(-10,hipY2,40,hipY2-10,bodyColor,13);
    circle(-60,-20,9,bodyColor);
    line(-25,hipY2-5,30,hipY2-5,'#888',5,accentColor);
    line(40,hipY2-10,50,20,bodyColor,11);line(-80,25,120,25,'#3a4050',2);
    label('臀推',20,48,accentColor);ctx.restore();
  } else if(type==='lateral'){
    ctx.save();ctx.translate(cx,H/2+10);
    circle(0,-55,10,bodyColor);line(0,-45,0,10,bodyColor,13);line(0,10,-15,38,bodyColor,10);line(0,10,15,38,bodyColor,10);
    const ra=prog*Math.PI*0.85;
    line(0,-15,-Math.sin(ra)*55,-10+Math.cos(ra)*55-55,bodyColor,9);circle(-Math.sin(ra)*55,-10+Math.cos(ra)*55-55+55,6,accentColor,accentColor);
    line(0,-15,Math.sin(ra)*55,-10+Math.cos(ra)*55-55+55,bodyColor,9);circle(Math.sin(ra)*55,-10+Math.cos(ra)*55-55+55,6,accentColor,accentColor);
    label('侧平举',0,58,accentColor);ctx.restore();
  } else if(type==='crunch'){
    ctx.save();ctx.translate(cx-20,H/2+15);
    const ca2=prog*0.6;
    line(-80,20,120,20,'#3a4050',2);
    line(0,20,30,20,bodyColor,12);line(30,20,60,0,bodyColor,11);
    const ux=-Math.sin(ca2)*50,uy=20-Math.cos(ca2)*50;
    line(0,20,ux,uy,bodyColor,13);circle(ux+Math.sin(ca2)*8,uy-Math.cos(ca2)*10,10,bodyColor);
    label('卷腹',30,45,accentColor);ctx.restore();
  } else if(type==='plank'){
    ctx.save();ctx.translate(cx-30,H/2+10);
    const wb=Math.sin(t*3)*(1-prog)*3;
    line(-40,wb,70,wb,bodyColor,13);circle(-50,wb-12,9,bodyColor);
    line(-40,wb,-55,20,bodyColor,9);line(60,wb,72,20,bodyColor,9);
    line(-80,20,120,20,'#3a4050',2);label('平板支撑',15,45,accentColor);ctx.restore();
  } else if(type==='pushup'){
    ctx.save();ctx.translate(cx-20,H/2+20);
    const bodyY=-10-prog*22;
    line(-50,bodyY,50,bodyY,bodyColor,14);circle(-50+10,bodyY-12,9,bodyColor);
    const ab=0.3+(1-prog)*0.8;
    line(-20,bodyY,-35,bodyY+35*Math.sin(ab),bodyColor,8);line(20,bodyY,35,bodyY+35*Math.sin(ab),bodyColor,8);
    line(-80,15,120,15,'#3a4050',2);label('俯卧撑',10,40,accentColor);ctx.restore();
  } else {
    ctx.save();ctx.translate(cx,H/2);
    const bounce=Math.sin(t*Math.PI*2)*5;
    circle(0,-50+bounce,12,bodyColor);line(0,-38+bounce,0,10+bounce,bodyColor,13);
    line(0,10+bounce,-20,45,bodyColor,9);line(0,10+bounce,20,45,bodyColor,9);
    label('训练动作',0,62,accentColor);ctx.restore();
  }

  const phaseText=prog<0.45?'向心收缩':prog<0.55?'顶端停顿':'离心控制';
  const phaseColor=prog<0.45?'#2ecc71':prog<0.55?'#f0c040':'#3b8fff';
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(8,8,80,18);
  ctx.fillStyle=phaseColor;ctx.font='bold 10px Noto Sans SC,sans-serif';ctx.textAlign='left';
  ctx.fillText(phaseText,14,21);ctx.textAlign='center';
}

/* ─── VIDEO MODAL（原代码完整保留） ─── */
let currentEx=null, currentPlatform='auto', iframeLoadTimer=null;

function detectPreferredPlatform() {
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone, lang=navigator.language||'';
  return (tz.includes('Shanghai')||tz.includes('Chongqing')||lang.startsWith('zh-CN')||lang==='zh')?'bili':'youtube';
}
function getYoutubeUrl(ytId) { return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`; }

function loadVideo(platform) {
  if (!currentEx) return;
  const iframe=document.getElementById('video-iframe');
  const loading=document.getElementById('video-loading');
  const errorDiv=document.getElementById('video-error');
  const errorBtn=document.getElementById('error-switch-btn');
  const errorLink=document.getElementById('error-open-link');
  iframe.style.opacity='0'; iframe.src='';
  errorDiv.classList.remove('show');
  if (iframeLoadTimer) clearTimeout(iframeLoadTimer);
  document.getElementById('btn-tencent').className='platform-btn'+(platform==='tencent'?' active-tencent':'');
  document.getElementById('btn-yt').className='platform-btn'+(platform==='youtube'?' active-yt':'');
  if (platform==='bili'||platform==='tencent') {
    loading.classList.add('hidden');
    const keyword=currentEx.bilibiliSearch;
    const searchUrl=`https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}&search_type=video&order=stow`;
    errorDiv.classList.add('show');
    errorDiv.style.background='linear-gradient(135deg,#0d1117,#0a1628)';
    document.getElementById('error-msg').innerHTML=`
      <div style="text-align:center">
        <div style="font-size:42px;margin-bottom:10px">📺</div>
        <div style="font-size:15px;font-weight:700;color:#00c8ff;margin-bottom:6px">${currentEx.name}</div>
        <div style="font-size:12px;color:#5a6480;margin-bottom:16px">B站不支持页面内嵌入，点击下方按钮搜索该动作教程</div>
        <div style="background:rgba(0,160,224,0.08);border:1px solid rgba(0,160,224,0.25);border-radius:10px;padding:12px;text-align:left">
          <div style="font-size:10px;color:#5a6480;margin-bottom:4px">搜索关键词</div>
          <div style="font-size:13px;color:#e8eaf0;font-weight:600">🔍 ${keyword}</div>
        </div>
      </div>`;
    errorBtn.textContent='🔗 在B站搜索此动作';
    errorBtn.onclick=()=>window.open(searchUrl,'_blank');
    errorBtn.style.cssText='background:#00a0e0;color:#fff';
    errorLink.href=searchUrl; errorLink.textContent='打开B站搜索页 →'; errorLink.style.color='#00a0e0';
  } else {
    loading.classList.remove('hidden'); errorDiv.classList.remove('show');
    errorDiv.style.background=''; errorBtn.style.cssText='';
    const openLink=`https://www.youtube.com/watch?v=${currentEx.youtubeId}`;
    errorBtn.textContent='切换到哔哩哔哩'; errorBtn.onclick=()=>switchPlatform('bili');
    errorLink.href=openLink; errorLink.textContent='在新标签页打开 YouTube →'; errorLink.style.color='';
    iframe.src=getYoutubeUrl(currentEx.youtubeId); iframe.title=currentEx.name+' 教程';
    iframe.onload=()=>{ if(iframeLoadTimer)clearTimeout(iframeLoadTimer); loading.classList.add('hidden'); iframe.style.opacity='1'; };
    iframeLoadTimer=setTimeout(()=>{ if(iframe.style.opacity==='0'){loading.classList.add('hidden');errorDiv.classList.add('show');document.getElementById('error-msg').innerHTML='YouTube 视频加载超时，请切换平台或检查网络';} },8000);
  }
}
function switchPlatform(platform) {
  currentPlatform=platform;
  document.getElementById('auto-tag').textContent=platform==='bili'?'📺 B站优先':'🌍 YouTube优先';
  loadVideo(platform);
}
function openModal(exId,muscleKey) {
  const data=muscleDB[muscleKey]; const ex=data.exercises.find(e=>e.id===exId); if (!ex) return;
  currentEx=ex;
  document.getElementById('modal-title').textContent=`${ex.icon} ${ex.name} — ${ex.en}`;
  let platform=currentPlatform;
  if (platform==='auto') { platform=detectPreferredPlatform(); document.getElementById('auto-tag').textContent=platform==='bili'?'🌐 自动→B站':'🌐 自动→YouTube'; }
  loadVideo(platform);
  const level=userProfile.level;
  document.getElementById('modal-steps').innerHTML=`
    <div style="font-size:12px;color:var(--muted);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border)">
      <strong style="color:var(--accent)">初学者提示：</strong>${ex.desc}
    </div>
    ${ex.steps.map((s,i)=>`
      <div class="inst-step">
        <div class="inst-num">${i+1}</div>
        <div class="inst-text">${s.text}${s.tip?`<div class="inst-warn">⚠️ 常见错误：${s.tip}</div>`:''}</div>
      </div>`).join('')}
    <div style="display:flex;gap:10px;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--accent)">${ex.sets[level]||ex.sets.beginner}</div>
        <div style="font-size:10px;color:var(--muted)">组数×次数</div>
      </div>
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--accent)">${ex.rest[level]||ex.rest.beginner}</div>
        <div style="font-size:10px;color:var(--muted)">组间休息</div>
      </div>
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:12px;font-weight:600;color:var(--accent)">${ex.weight[level]||ex.weight.beginner}</div>
        <div style="font-size:10px;color:var(--muted)">建议重量</div>
      </div>
    </div>`;
  document.getElementById('video-modal').classList.add('open');
}
function closeModal() {
  const iframe=document.getElementById('video-iframe');
  iframe.src=''; iframe.style.opacity='0';
  if (iframeLoadTimer) clearTimeout(iframeLoadTimer);
  document.getElementById('video-loading').classList.remove('hidden');
  document.getElementById('video-error').classList.remove('show');
  document.getElementById('video-modal').classList.remove('open');
}
document.getElementById('video-modal').addEventListener('click',function(e){ if(e.target===this)closeModal(); });

/* ═══════════════════════════════════════════════════════════
   MUSCLE DATABASE（从原文件完整复制，保持不变）
═══════════════════════════════════════════════════════════ */
const muscleDB = {
  chest: {
    name:'胸肌', en:'PECTORALIS MAJOR',
    bodyTypeTips: {
      ectomorph:'外胚层体型建议大重量低次数（6-8次），以卧推为主，减少飞鸟等孤立动作，刺激肌肉生长。',
      mesomorph:'中胚层体型可以混合训练，复合+孤立结合，8-12次范围，1-2周换一次动作变化刺激。',
      endomorph:'内胚层体型建议多组多次（12-15次），缩短组间休息（45秒），加入超级组提升消耗。'
    },
    exercises:[
      { id:'bench-press', name:'杠铃卧推', en:'Barbell Bench Press', type:'复合',
        diff:{ beginner:'初级', intermediate:'中级', advanced:'中级' },
        icon:'🏋️',
        desc:'胸部训练之王。平躺于卧推凳，将杠铃从胸口推起，是增加胸肌体积最有效的动作。',
        animation:'bench',
        youtubeId:'rT7DgCr-3pg',
        tencentId:'g3159pkzhhg',
        steps:[
          { text:'仰卧卧推凳，双脚踩实地面，腰部保持自然弧度', tip:'脚不要悬空，要踩实地面提供稳定支撑' },
          { text:'宽握距抓杠铃，握距略宽于肩膀（约1.5倍肩宽）', tip:'握距太窄变成三头训练，太宽会伤肩膀' },
          { text:'将杠铃卸下，垂直置于胸部上方，深吸一口气收腹', tip:null },
          { text:'下放杠铃至乳头位置，感受胸肌完全拉伸，手肘约45°', tip:'手肘不要完全外展90°，否则肩膀容易受伤' },
          { text:'以胸肌发力将杠铃推起，呼气，在顶端停顿1秒收缩', tip:'想象要把两块胸肌挤在一起，而不是只推杠铃' }
        ],
        sets:{ beginner:'3×10-12', intermediate:'4×8-10', advanced:'5×5-8' },
        rest:{ beginner:'90秒', intermediate:'120秒', advanced:'180秒' },
        weight:{ beginner:'体重30-40%', intermediate:'体重50-70%', advanced:'体重80%+' }
      },
      { id:'dumbbell-fly', name:'哑铃飞鸟', en:'Dumbbell Fly', type:'孤立',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'🦅',
        desc:'孤立刺激胸肌，拉伸幅度远大于卧推，有助于扩展胸肌宽度，增加分离度。',
        animation:'fly',
        youtubeId:'eozdVDA78K0',
        tencentId:'x0826kbumik',
        steps:[
          { text:'仰卧哑铃凳，双手持哑铃置于胸部上方，掌心相对', tip:null },
          { text:'保持手肘微弯（10-15°），这个角度全程保持不变', tip:'手肘一定要保持微弯！伸直会损伤肘关节' },
          { text:'向两侧缓慢展开，下放至感受胸肌充分拉伸', tip:'不要下放超过肩膀水平线，避免肩关节受伤' },
          { text:'以胸肌收缩的力量，按弧线轨迹回合，就像拥抱一棵树', tip:null },
          { text:'顶端收缩，停顿感受胸肌的挤压感，再重复', tip:null }
        ],
        sets:{ beginner:'3×12-15', intermediate:'3×12-15', advanced:'4×12-15' },
        rest:{ beginner:'60秒', intermediate:'60秒', advanced:'60秒' },
        weight:{ beginner:'轻重量/5-10kg', intermediate:'10-20kg', advanced:'20-30kg' }
      },
      { id:'pushup', name:'俯卧撑', en:'Push-Up', type:'徒手',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'🤸',
        desc:'无需器械随时可做。通过手部位置变化可以针对不同区域，是居家训练的核心动作。',
        animation:'pushup',
        youtubeId:'IODxDxX7oi4',
        tencentId:'d330662jy7m',
        steps:[
          { text:'双手略宽于肩撑地，手指朝前，身体从头到脚成一直线', tip:null },
          { text:'核心用力（肚子收紧），臀部不要翘起也不要下沉', tip:'最常见的错误是臀部上翘，核心要全程收紧' },
          { text:'屈肘下沉，胸部贴近地面（不用触地），手肘45°外展', tip:'不要让手肘完全外展90°' },
          { text:'以胸肌发力撑起，呼气，顶端时试着用力收紧胸肌', tip:null },
          { text:'变式：跪姿（降低难度）| 宽距（外胸）| 窄距（三头）| 斜向（上下胸）', tip:null }
        ],
        sets:{ beginner:'4×8-12', intermediate:'4×15-20', advanced:'4×20-30' },
        rest:{ beginner:'60秒', intermediate:'45秒', advanced:'30秒' },
        weight:{ beginner:'自重', intermediate:'自重/加重背心', advanced:'加重背心/脚放高处' }
      },
      { id:'incline-press', name:'上斜卧推', en:'Incline Bench Press', type:'复合',
        diff:{ beginner:'中级', intermediate:'中级', advanced:'中级' },
        icon:'📐',
        desc:'30-45°斜角重点刺激上胸肌，打造饱满的上胸线条，让胸肌看起来更立体。',
        animation:'incline',
        youtubeId:'DbFgADa2PL8',
        tencentId:'j0550ou7jon',
        steps:[
          { text:'调整卧推凳至30-45度（不要超过45度，否则变成肩部训练）', tip:'30度是刺激上胸的最佳角度' },
          { text:'仰卧，双手持哑铃或杠铃置于上胸部上方', tip:null },
          { text:'缓慢下放至上胸，感受上胸拉伸', tip:'下放位置在锁骨偏下，不是乳头位置' },
          { text:'发力推起，顶端收缩时试图让哑铃靠近（增加内侧收缩）', tip:null },
          { text:'全程保持肩胛骨后缩，背部贴紧凳子', tip:null }
        ],
        sets:{ beginner:'3×10-12', intermediate:'4×8-12', advanced:'4×8-12' },
        rest:{ beginner:'90秒', intermediate:'120秒', advanced:'120秒' },
        weight:{ beginner:'体重25-35%', intermediate:'体重40-60%', advanced:'体重60-80%' }
      }
    ]
  },
  shoulders: {
    name:'三角肌', en:'DELTOID',
    bodyTypeTips:{
      ectomorph:'外胚层体型肩部较窄，侧平举是必练动作，建议每周2次肩训，超级组效果佳。',
      mesomorph:'中胚层可以均衡发展三个头，注意后束往往较弱，要专门加强后束训练。',
      endomorph:'内胚层肩部通常较宽，重点做侧平举和面拉，减少前举避免肩膀前倾加剧。'
    },
    exercises:[
      { id:'db-press', name:'哑铃推肩', en:'Dumbbell Shoulder Press', type:'复合',
        diff:{ beginner:'初级', intermediate:'中级', advanced:'中级' },
        icon:'🏋️',
        desc:'最全面的肩部训练，同时激活前束和中束，增加肩部体积的核心动作。',
        animation:'shoulder-press',
        youtubeId:'qEwKCR5JCog',
        tencentId:'p3329qf8bi3',
        steps:[
          { text:'坐姿或站姿，双手持哑铃在耳朵两侧，手肘90°弯曲', tip:'坐姿更孤立，站姿可以用更大重量' },
          { text:'掌心朝前（或朝内-弧线推举），核心收紧，腰背挺直', tip:null },
          { text:'向上推举，双臂接近伸直（不要完全锁死），在顶端收缩肩膀', tip:'在顶端不要将哑铃相碰，保持张力' },
          { text:'缓慢下放回耳侧，感受肩膀的拉伸', tip:'下放速度要控制，不要直接落下' },
          { text:'进阶变式：阿诺德推举（增加旋转）可更全面刺激三个头', tip:null }
        ],
        sets:{ beginner:'3×10-12', intermediate:'4×8-12', advanced:'4×8-12' },
        rest:{ beginner:'75秒', intermediate:'90秒', advanced:'120秒' },
        weight:{ beginner:'5-12kg/侧', intermediate:'15-25kg/侧', advanced:'25kg+/侧' }
      },
      { id:'lateral-raise', name:'侧平举', en:'Lateral Raise', type:'孤立',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'↔️',
        desc:'专门训练三角肌中束，是打造宽肩、让肩膀视觉变宽的核心动作，任何水平都必练。',
        animation:'lateral',
        youtubeId:'3VcKaXpzqRo',
        tencentId:'z3333e9j6vi',
        steps:[
          { text:'站立，双手持哑铃垂于体侧，身体微微前倾约10-15°', tip:'微微前倾能让动作更孤立中束，减少前束参与' },
          { text:'手肘保持微弯（约15°），这个角度全程维持', tip:'手肘弯太多变成弯举，必须保持微弯' },
          { text:'向两侧缓慢举起，举至肩膀水平时小指侧略高（倒水姿势）', tip:'小指侧比拇指侧略高，这样中束刺激更好' },
          { text:'到肩膀高度停止，感受中束的收缩，不要借助惯性甩动', tip:'重量宁轻勿重，动作形式比重量更重要' },
          { text:'缓慢控制下放，不要让重力带着哑铃直接落下', tip:null }
        ],
        sets:{ beginner:'4×12-15', intermediate:'4×15-20', advanced:'5×15-20' },
        rest:{ beginner:'45秒', intermediate:'45秒', advanced:'30-45秒' },
        weight:{ beginner:'3-8kg/侧', intermediate:'8-15kg/侧', advanced:'15-25kg/侧' }
      },
      { id:'face-pull', name:'面拉', en:'Face Pull', type:'复合',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'🎯',
        desc:'训练三角肌后束和外旋肌群，改善圆肩体态，是所有健身者都应该做的预防性动作。',
        animation:'face-pull',
        youtubeId:'rep-qVOkqgk',
        tencentId:'s3544i3t67e',
        steps:[
          { text:'绳索或弹力带调至头部高度，双手抓住把手，掌心向下', tip:null },
          { text:'后退几步保持绳索张紧，身体保持直立', tip:null },
          { text:'将绳索拉向面部，双手分开拉向耳朵两侧，肘关节外展上扬', tip:'肘关节要高于肩膀，向外向上展开' },
          { text:'到达最内侧时外旋手腕，感受肩后部和上背部的收缩', tip:'这个外旋动作是关键，能改善肩袖健康' },
          { text:'缓慢放回，保持全程有张力', tip:null }
        ],
        sets:{ beginner:'3×15-20', intermediate:'3×15-20', advanced:'4×15-20' },
        rest:{ beginner:'45秒', intermediate:'45秒', advanced:'45秒' },
        weight:{ beginner:'轻重量', intermediate:'中等重量', advanced:'中等重量' }
      }
    ]
  },
  biceps:{
    name:'肱二头肌', en:'BICEPS BRACHII',
    bodyTypeTips:{
      ectomorph:'外胚层体型建议做重量偏大的弯举（6-8次），配合牧师凳减少借力，专注峰值收缩。',
      mesomorph:'中胚层可以使用多样化训练，结合正握、反握、锤式等变化全面刺激。',
      endomorph:'内胚层建议高次数超级组（12-15次+12-15次无间歇），提升代谢同时增肌。'
    },
    exercises:[
      { id:'db-curl', name:'哑铃弯举', en:'Dumbbell Bicep Curl', type:'孤立',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'💪',
        desc:'二头肌训练的基础动作，简单有效。交替进行有助于更大的幅度和专注度。',
        animation:'curl',
        youtubeId:'ykJmrZ5v0Oo',
        tencentId:'j0838rgc7tg',
        steps:[
          { text:'站立或坐姿，双手持哑铃垂于体侧，掌心朝前', tip:null },
          { text:'固定上臂贴紧体侧，仅通过肘关节弯曲发力', tip:'最常见错误：借助身体摇晃，上臂不固定' },
          { text:'弯举至手腕与肩膀同高，顶端时手腕轻微内旋（小指朝外）', tip:'顶端轻微的手腕旋转能增加二头肌的峰值收缩' },
          { text:'收缩1秒，感受二头肌的紧绷感', tip:null },
          { text:'缓慢下放，完全伸展，不要急着做下一次', tip:'离心阶段（下放）同样重要，要控制住' }
        ],
        sets:{ beginner:'3×10-12', intermediate:'4×10-12', advanced:'4×10-12' },
        rest:{ beginner:'60秒', intermediate:'60秒', advanced:'60秒' },
        weight:{ beginner:'5-12kg/侧', intermediate:'12-20kg/侧', advanced:'20-30kg/侧' }
      },
      { id:'hammer-curl', name:'锤式弯举', en:'Hammer Curl', type:'孤立',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'🔨',
        desc:'中立握姿训练肱肌和肱桡肌，增加手臂厚度，是二头肌弯举的绝佳补充动作。',
        animation:'hammer',
        youtubeId:'TwD-YGVP4Bk',
        tencentId:'c0390h04o81',
        steps:[
          { text:'双手持哑铃，采用锤子握法（拇指朝上，掌心面向身体）', tip:null },
          { text:'固定上臂，弯曲肘关节举起哑铃', tip:'与标准弯举的区别只在于握姿，不旋转手腕' },
          { text:'举至与肩同高，停顿收缩', tip:null },
          { text:'缓慢下放完全伸展', tip:'锤式弯举可以用比标准弯举更大的重量' },
          { text:'可以交替进行也可双手同时进行', tip:null }
        ],
        sets:{ beginner:'3×12', intermediate:'3×12', advanced:'3×12' },
        rest:{ beginner:'60秒', intermediate:'60秒', advanced:'60秒' },
        weight:{ beginner:'6-14kg/侧', intermediate:'14-22kg/侧', advanced:'22-32kg/侧' }
      }
    ]
  },
  triceps:{
    name:'肱三头肌', en:'TRICEPS BRACHII',
    bodyTypeTips:{
      ectomorph:'三头肌占上臂的2/3！外胚层体型应重视三头训练，大重量窄距卧推是首选。',
      mesomorph:'复合动作（窄距卧推、双杠）配合孤立动作（绳索下压）全面发展三个头。',
      endomorph:'多组数超级组训练，绳索下压+颅骨破碎者连续做，提升燃脂效果。'
    },
    exercises:[
      { id:'cable-push', name:'绳索下压', en:'Cable Pushdown', type:'孤立',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'⬇️',
        desc:'最经典的三头肌孤立动作，安全高效，适合作为三头训练的第一个或最后一个动作。',
        animation:'pushdown',
        youtubeId:'2-LAMcpzODU',
        tencentId:'j0503ucie4w',
        steps:[
          { text:'抓住绳索或直杆，双脚与肩同宽站立，身体略微前倾', tip:null },
          { text:'将上臂固定在体侧，这是最重要的！不要让上臂前后摆动', tip:'上臂前后移动意味着在借力，失去了孤立效果' },
          { text:'从肘关节弯曲位开始，向下压至手臂完全伸展', tip:null },
          { text:'完全伸展时手腕可以轻微弯曲（增加三头收缩感）', tip:null },
          { text:'缓慢回放，直到前臂与地面约成45°，感受拉伸后再下压', tip:null }
        ],
        sets:{ beginner:'4×12-15', intermediate:'4×12-15', advanced:'4×15-20' },
        rest:{ beginner:'60秒', intermediate:'45秒', advanced:'30秒' },
        weight:{ beginner:'轻-中等', intermediate:'中等', advanced:'中-重' }
      },
      { id:'skull-crusher', name:'颅骨破碎者', en:'Skull Crusher', type:'孤立',
        diff:{ beginner:'中级', intermediate:'中级', advanced:'中级' },
        icon:'💀',
        desc:'充分拉伸三头肌长头，是三头肌体积增长最有效的孤立动作之一。',
        animation:'skull',
        youtubeId:'d_KZxkY_5cM',
        tencentId:'e03998sekbc',
        steps:[
          { text:'仰卧，持EZ杆或哑铃于胸口上方，掌心朝前', tip:null },
          { text:'上臂垂直地面，固定上臂不动，只让肘关节弯曲', tip:null },
          { text:'弯曲肘关节，将重物下放到额头上方（不是额头！）', tip:'一定要控制好，不要真的砸到头部！' },
          { text:'感受三头肌的充分拉伸后，以三头肌发力伸直手臂', tip:null },
          { text:'顶端收缩停顿，再缓慢下放', tip:'建议先用较轻重量熟悉动作，再加重量' }
        ],
        sets:{ beginner:'3×10-12', intermediate:'3×10-12', advanced:'4×10-12' },
        rest:{ beginner:'75秒', intermediate:'75秒', advanced:'75秒' },
        weight:{ beginner:'轻重量', intermediate:'中等', advanced:'中-重' }
      }
    ]
  },
  abs:{
    name:'腹直肌', en:'RECTUS ABDOMINIS',
    bodyTypeTips:{
      ectomorph:'外胚层体型体脂低，腹肌更容易显现，但要注重功能性核心训练，平板支撑是基础。',
      mesomorph:'中胚层可以做各种腹部动作，但记住：腹肌显现主要靠饮食，训练只是辅助。',
      endomorph:'内胚层体型腹部减脂最关键，以有氧+饮食为主，腹肌训练为辅，不要迷信卷腹燃脂。'
    },
    exercises:[
      { id:'crunch', name:'卷腹', en:'Crunch', type:'孤立',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'🔄',
        desc:'腹部训练最基础的动作，专注腹直肌上部。正确发力比次数更重要。',
        animation:'crunch',
        youtubeId:'Xyd_fa5zoEU',
        tencentId:'g3251kgox81',
        steps:[
          { text:'仰卧，屈膝90°，双脚平踩地面，双手轻放耳后（不要扣住头）', tip:'手不要用力拉头，会导致颈部受伤' },
          { text:'深呼吸，准备时先将下背部贴紧地面', tip:null },
          { text:'呼气同时卷起上背，下背始终贴地，不是坐起来！', tip:'仿卧起坐会让腰大肌参与，减少腹肌刺激' },
          { text:'卷起幅度约30-45°，感受腹肌收缩，停顿1秒', tip:null },
          { text:'缓慢下放，不要完全落下，保持腹肌张力后再做下一次', tip:null }
        ],
        sets:{ beginner:'4×15-20', intermediate:'4×20-25', advanced:'4×25-30' },
        rest:{ beginner:'45秒', intermediate:'30秒', advanced:'20秒' },
        weight:{ beginner:'自重', intermediate:'自重/抱重物', advanced:'抱重物' }
      },
      { id:'plank', name:'平板支撑', en:'Plank', type:'等长',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'📏',
        desc:'激活深层核心肌群（腹横肌），改善体态，预防腰痛。质量比时长更重要。',
        animation:'plank',
        youtubeId:'pSHjTRCQxIw',
        tencentId:'o03984n6hgi',
        steps:[
          { text:'前臂撑地，肘关节在肩膀正下方，双脚分开与肩同宽', tip:null },
          { text:'从头到脚踝保持一条直线，不要塌腰或翘臀', tip:'最常见错误是臀部上翘，这样腹肌完全不用力' },
          { text:'收腹（想象要把肚脐拉向脊柱），臀部夹紧，全身绷紧', tip:'用"收腹"而不是"吸气"，感受腹肌的主动收缩' },
          { text:'均匀呼吸，不要憋气', tip:'憋气会导致血压升高，保持正常呼吸' },
          { text:'从30秒开始，逐渐增加到60-90秒，质量比时长重要', tip:null }
        ],
        sets:{ beginner:'3×30-45秒', intermediate:'3×60秒', advanced:'4×90秒' },
        rest:{ beginner:'60秒', intermediate:'45秒', advanced:'30秒' },
        weight:{ beginner:'自重', intermediate:'自重', advanced:'背部加重物' }
      },
      { id:'leg-raise', name:'悬挂举腿', en:'Hanging Leg Raise', type:'复合',
        diff:{ beginner:'高级', intermediate:'中级', advanced:'初级' },
        icon:'🏗️',
        desc:'最有效的下腹训练，同时锻炼握力和核心稳定，是腹部训练中级进阶的必选动作。',
        animation:'leg-raise',
        youtubeId:'JB2oyawG9KI',
        tencentId:'k3365jfgwq4',
        steps:[
          { text:'双手正握单杠，握距略宽于肩，自然悬挂', tip:'新手可以先从仰卧举腿开始练习' },
          { text:'核心收紧，稳定身体，减少摆荡', tip:null },
          { text:'屈髋将腿抬起，至腿与地面平行或更高（弯腿降低难度）', tip:'不要用惯性甩腿，要用腹肌主动发力' },
          { text:'顶端停顿1秒，感受下腹收缩', tip:null },
          { text:'缓慢下放，不要让腿直接落下摆荡', tip:'进阶：直腿举腿，最终可以举腿触杠（前折叠）' }
        ],
        sets:{ beginner:'3×8-10', intermediate:'3×12-15', advanced:'4×15-20' },
        rest:{ beginner:'75秒', intermediate:'60秒', advanced:'45秒' },
        weight:{ beginner:'自重', intermediate:'自重', advanced:'脚踝负重' }
      }
    ]
  },
  quads:{
    name:'股四头肌', en:'QUADRICEPS',
    bodyTypeTips:{
      ectomorph:'外胚层体型腿部最难增长！深蹲是必须的，建议以增肌为主，高蛋白饮食配合。',
      mesomorph:'中胚层腿部训练反应好，深蹲+腿举+腿屈伸三合一效果显著。',
      endomorph:'内胚层腿部训练燃脂效果最强！高强度深蹲超级组，组间休息不超过60秒。'
    },
    exercises:[
      { id:'squat', name:'深蹲', en:'Back Squat', type:'复合',
        diff:{ beginner:'中级', intermediate:'中级', advanced:'初级' },
        icon:'🏆',
        desc:'训练之王！全面发展大腿、臀部，刺激全身合成激素分泌，是增肌和力量的基础。',
        animation:'squat',
        youtubeId:'ultWZbUMPL8',
        tencentId:'l0933u998xt',
        steps:[
          { text:'杠铃置于斜方肌上（低杠放更低），站距与肩同宽，脚尖略朝外30°', tip:'新手可先做徒手深蹲或高脚杯深蹲练习动作模式' },
          { text:'深吸气，收腹（Valsalva呼吸法），保持全程脊柱中立', tip:'腰椎不要过度前弓也不要弓背，保持自然弧度' },
          { text:'推髋向后，同时屈膝，让膝盖跟随脚尖方向移动', tip:'膝盖方向必须与脚尖一致，不要内扣！' },
          { text:'下蹲至大腿平行或低于平行，深蹲越深臀部参与越多', tip:'深度取决于柔韧性，不要强行下蹲导致骨盆后倾' },
          { text:'发力起身，以脚跟驱动，保持膝盖不内扣，出气', tip:null }
        ],
        sets:{ beginner:'3×8-10', intermediate:'4×6-8', advanced:'5×5' },
        rest:{ beginner:'120秒', intermediate:'150秒', advanced:'180-240秒' },
        weight:{ beginner:'徒手/轻杠铃', intermediate:'体重60-80%', advanced:'体重100%+' }
      },
      { id:'leg-press', name:'腿举', en:'Leg Press', type:'复合',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'📱',
        desc:'比深蹲更安全，适合腰背有问题的人，可以使用比深蹲更大的重量刺激股四头肌。',
        animation:'leg-press',
        youtubeId:'IZxyjW7MPJQ',
        tencentId:'h0935sh1b6q',
        steps:[
          { text:'调整座椅，坐入腿举机，腰背贴紧靠背，双脚与肩同宽置于踏板中部', tip:null },
          { text:'双手握住两侧扶手，解锁安全销', tip:'一定要先解锁安全销，否则无法进行动作' },
          { text:'弯曲膝关节，缓慢下放，至膝关节接近90°', tip:'不要下放过深让臀部离开靠背（会压迫腰椎）' },
          { text:'以脚跟发力伸展膝关节，将踏板推起', tip:'不要锁死膝盖关节，保持一点点弯曲' },
          { text:'完成后记得锁上安全销再移除腿部支撑', tip:'忘记锁销是健身房最危险的错误之一！' }
        ],
        sets:{ beginner:'4×10-15', intermediate:'4×10-12', advanced:'4×8-12' },
        rest:{ beginner:'90秒', intermediate:'90秒', advanced:'90秒' },
        weight:{ beginner:'轻重量', intermediate:'中重量', advanced:'大重量' }
      }
    ]
  },
  hamstrings:{
    name:'腘绳肌', en:'HAMSTRINGS',
    bodyTypeTips:{
      ectomorph:'外胚层腘绳肌往往较弱，罗马尼亚硬拉是首选，专注于充分拉伸和慢速离心。',
      mesomorph:'中胚层可以全面训练，硬拉+腿弯举的组合非常有效。',
      endomorph:'内胚层体型腘绳肌通常较有力，增加训练强度和密度，复合动作为主。'
    },
    exercises:[
      { id:'rdl', name:'罗马尼亚硬拉', en:'Romanian Deadlift', type:'复合',
        diff:{ beginner:'中级', intermediate:'初级', advanced:'初级' },
        icon:'🔱',
        desc:'腘绳肌训练的最佳选择，通过髋关节铰链动作完美拉伸和收缩后腿肌群。',
        animation:'rdl',
        youtubeId:'7j-2w6tqjdI',
        tencentId:'a35036n41hk',
        steps:[
          { text:'站立持杠铃（或哑铃）于髋部，双脚与肩同宽', tip:null },
          { text:'膝关节保持微弯（约10-15°），这个角度全程不变', tip:'很多人会随着重量增加而弯曲膝盖，这样就变成了传统硬拉' },
          { text:'推髋向后，让杠铃沿腿部轨迹缓慢下滑', tip:'全程保持杠铃贴近腿部，背部完全平直' },
          { text:'下放至感受腘绳肌充分拉伸（通常到小腿中段）', tip:'柔韧性好的人可以下放到脚背，但不要因此弓背' },
          { text:'以腘绳肌收缩的力量推髋前进回到站立位', tip:'想象在髋部夹一张纸，用夹住它的力量来起身' }
        ],
        sets:{ beginner:'3×8-10', intermediate:'4×8-10', advanced:'4×8-12' },
        rest:{ beginner:'90秒', intermediate:'120秒', advanced:'120秒' },
        weight:{ beginner:'轻重量学习动作', intermediate:'中等重量', advanced:'大重量' }
      }
    ]
  },
  glutes:{
    name:'臀大肌', en:'GLUTEUS MAXIMUS',
    bodyTypeTips:{
      ectomorph:'外胚层臀部往往扁平，臀推是增加臀部体积的最直接方法，要专注顶端收缩。',
      mesomorph:'中胚层臀部训练效果好，深蹲+臀推+保加利亚分腿蹲是完美三件套。',
      endomorph:'内胚层臀部往往有更多脂肪，注重收缩感和饮食，大重量训练是有效手段。'
    },
    exercises:[
      { id:'hip-thrust', name:'臀推', en:'Barbell Hip Thrust', type:'复合',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'🍑',
        desc:'臀肌激活效率最高的动作，科学研究证明其臀大肌激活程度远超深蹲和硬拉。',
        animation:'hip-thrust',
        youtubeId:'SEdqd1n0cvg',
        tencentId:'g0817zkr5vb',
        steps:[
          { text:'肩膀上部（肩胛骨下角处）靠在卧推凳边缘，确保凳子稳固', tip:'靠太高（颈部位置）会导致颈部不适' },
          { text:'杠铃置于髋部正上方（可以用杠铃垫防止不适），双脚踩地', tip:'双脚距臀部距离：以膝盖弯曲90°为标准调整' },
          { text:'以脚跟发力推髋向上，直到躯干与地面平行', tip:null },
          { text:'顶端用力夹紧臀部（想象夹钱包），停顿2秒', tip:'很多人顶端不收缩，直接下放，这样效果差很多！' },
          { text:'缓慢下放，不要让杠铃或臀部触地，保持张力后再推', tip:null }
        ],
        sets:{ beginner:'4×12-15', intermediate:'4×10-12', advanced:'4×8-12' },
        rest:{ beginner:'75秒', intermediate:'90秒', advanced:'120秒' },
        weight:{ beginner:'徒手/空杆', intermediate:'中等重量', advanced:'大重量' }
      }
    ]
  },
  calves:{
    name:'小腿肌群', en:'GASTROCNEMIUS & SOLEUS',
    bodyTypeTips:{
      ectomorph:'外胚层小腿最难增长！需要高频率（每周3-4次）和大量组数，忍受疼痛后恢复。',
      mesomorph:'中胚层小腿训练反应一般，每周2-3次，充分拉伸和收缩最重要。',
      endomorph:'内胚层小腿肌肉容易有基础，可以大重量训练，注意与体脂降低配合。'
    },
    exercises:[
      { id:'standing-raise', name:'站姿提踵', en:'Standing Calf Raise', type:'孤立',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'⬆️',
        desc:'最基础的小腿训练，全程幅度和顶端收缩是关键，不要弹跳式借力。',
        animation:'calf-raise',
        youtubeId:'gwLzBJYoWlI',
        tencentId:'w3530cu28tk',
        steps:[
          { text:'站在台阶或踏板边缘，脚掌前1/3踩住，脚跟悬空', tip:'一定要踩台阶，地面上无法充分拉伸' },
          { text:'脚跟缓慢下沉到最低点，感受小腿充分拉伸，停顿1秒', tip:'这个拉伸阶段大多数人都会跳过，但它非常重要' },
          { text:'以踮脚发力，缓慢提踵到最高点，感受小腿收缩', tip:null },
          { text:'顶端停顿2秒，收紧小腿肌肉', tip:'小腿肌肉快肌纤维较多，需要更慢的节奏和更长的停顿' },
          { text:'缓慢回到最低点，不要弹跳，完全控制', tip:'弹跳式做法是最常见的错误，完全无效' }
        ],
        sets:{ beginner:'4×15-20', intermediate:'5×15-20', advanced:'5×20-25' },
        rest:{ beginner:'45秒', intermediate:'30秒', advanced:'30秒' },
        weight:{ beginner:'自重', intermediate:'持哑铃', advanced:'史密斯机/大重量' }
      }
    ]
  },
  traps:{
    name:'斜方肌', en:'TRAPEZIUS',
    bodyTypeTips:{
      ectomorph:'外胚层建议大重量耸肩（6-8次），硬拉是增加斜方肌最有效的方式。',
      mesomorph:'均衡发展三个区域（上中下斜方），耸肩、俯身哑铃划船、面拉各有侧重。',
      endomorph:'内胚层通常斜方肌基础较好，注重中下斜方肌训练，避免上斜方肌过于发达影响比例。'
    },
    exercises:[
      { id:'shrug', name:'杠铃耸肩', en:'Barbell Shrug', type:'孤立',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'⬆️',
        desc:'直接训练斜方肌上束，增加颈部到肩部的厚度，打造强壮的上背视觉效果。',
        animation:'shrug',
        youtubeId:'g6qbq4Lf1FI',
        tencentId:'x0517q4cq2i',
        steps:[
          { text:'双手持哑铃或杠铃垂于体侧，保持直立姿势', tip:null },
          { text:'肩膀向上耸起，方向是垂直向上（不是向前旋转）', tip:'只是向上耸，不要转圈，转圈可能损伤颈椎' },
          { text:'耸到最高点，停顿1-2秒，感受斜方肌的最大收缩', tip:null },
          { text:'缓慢下放，完全放松后再做下一次', tip:'很多人会连续快速耸，失去了效果' },
          { text:'注意：下巴不要前突，颈部保持放松', tip:null }
        ],
        sets:{ beginner:'3×12-15', intermediate:'4×10-12', advanced:'4×8-12' },
        rest:{ beginner:'60秒', intermediate:'75秒', advanced:'90秒' },
        weight:{ beginner:'轻-中', intermediate:'中-重', advanced:'大重量' }
      }
    ]
  },
  lats:{
    name:'背阔肌', en:'LATISSIMUS DORSI',
    bodyTypeTips:{
      ectomorph:'外胚层需要专注增宽背部，引体向上+高位下拉是核心，注重充分拉伸。',
      mesomorph:'中胚层天生V形背潜力大，宽握引体和窄握划船结合，兼顾宽度和厚度。',
      endomorph:'内胚层背部训练是提升代谢的好方法，大肌群复合动作为主，多变化。'
    },
    exercises:[
      { id:'pullup', name:'引体向上', en:'Pull-Up', type:'复合',
        diff:{ beginner:'高级', intermediate:'中级', advanced:'初级' },
        icon:'🏗️',
        desc:'背部训练之王！宽握引体直接拉宽背阔肌，是打造V形背的最有效单一动作。',
        animation:'pullup',
        youtubeId:'eGo4IYlbE5g',
        tencentId:'t3201bp8b09',
        steps:[
          { text:'正握单杠，握距宽于肩约1.5倍，完全悬挂', tip:'新手可以用引体辅助机或弹力带辅助' },
          { text:'先做一个肩胛骨下沉（把肩膀往口袋里放的感觉），激活背部', tip:'这个准备动作是初学者最容易忽略的，非常重要' },
          { text:'弯曲肘关节，以背阔肌的力量将胸口拉向横杆', tip:'想象把手肘向后向下插入裤袋，而不是用手拉杆' },
          { text:'将下巴或胸口拉过横杆，顶端停顿1秒', tip:null },
          { text:'缓慢伸展手臂下放，完全伸展到底，感受背阔肌拉伸', tip:'离心阶段（下放）要控制，不要直接落下' }
        ],
        sets:{ beginner:'3×能做多少做多少', intermediate:'4×6-10', advanced:'4×8-12' },
        rest:{ beginner:'120秒', intermediate:'120秒', advanced:'90秒' },
        weight:{ beginner:'弹力带辅助', intermediate:'自重', advanced:'加重腰带' }
      },
      { id:'lat-pulldown', name:'高位下拉', en:'Lat Pulldown', type:'复合',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'📉',
        desc:'引体向上的替代方案，适合初学者或提升引体数量的辅助训练，可以精确控制重量。',
        animation:'lat-pulldown',
        youtubeId:'CAwf7n6Luuc',
        tencentId:'f301540rl80',
        steps:[
          { text:'坐下，大腿固定于腿垫下（调好使大腿贴紧），宽握横杆', tip:null },
          { text:'身体微微后仰约15°，胸口朝向横杆', tip:null },
          { text:'将横杆拉向下巴/锁骨位置，想象把手肘拉向地面', tip:'很多人只用手臂拉，要用背阔肌发力，想象把手肘拉下来' },
          { text:'顶端时感受背阔肌的充分收缩，肩胛骨后缩下沉', tip:null },
          { text:'缓慢放回，充分伸展背阔肌后再做下一次', tip:null }
        ],
        sets:{ beginner:'4×10-12', intermediate:'4×10-12', advanced:'4×8-12' },
        rest:{ beginner:'90秒', intermediate:'90秒', advanced:'90秒' },
        weight:{ beginner:'体重50-60%', intermediate:'体重60-75%', advanced:'体重80%+' }
      }
    ]
  },
  'lower-back':{
    name:'下背/竖脊肌', en:'ERECTOR SPINAE',
    bodyTypeTips:{
      ectomorph:'外胚层下背肌肉单薄，硬拉是首选，配合山羊挺身强化，预防腰伤。',
      mesomorph:'中胚层均衡发展，大重量硬拉+辅助的山羊挺身是完美组合。',
      endomorph:'内胚层腹部较重会增加腰椎负担，先强化核心后再加大下背训练强度。'
    },
    exercises:[
      { id:'deadlift', name:'传统硬拉', en:'Conventional Deadlift', type:'复合',
        diff:{ beginner:'高级', intermediate:'中级', advanced:'初级' },
        icon:'⚡',
        desc:'全身性训练动作之王。没有任何其他单一动作能像硬拉一样同时激活这么多肌肉。',
        animation:'deadlift',
        youtubeId:'op9kVnSso6Q',
        tencentId:'e35466gtzzf',
        steps:[
          { text:'站于杠铃前，脚距与髋同宽，杠铃在脚背正中（贴近小腿）', tip:'脚距与髋同宽，不是肩宽，初学者常犯的错误' },
          { text:'俯身抓住杠铃，采用双正握（或交叉握），握距与脚同宽', tip:null },
          { text:'深吸气，收腹（360°核心）；臀部下沉至胫骨垂直地面', tip:'硬拉不是深蹲！臀部不需要蹲那么低，胫骨垂直即可' },
          { text:'眼睛平视或稍低，脊柱中立（不弓背、不过度前凸）', tip:'弓背硬拉是最危险的训练错误，宁可减重也要背直' },
          { text:'以腿推地的感觉发力，杠铃贴近腿部上升，到站直后伸髋锁臀', tip:'杠铃必须全程贴腿，离开腿部会大幅增加腰椎压力' }
        ],
        sets:{ beginner:'3×5（轻重量学习）', intermediate:'4×5-6', advanced:'5×3-5' },
        rest:{ beginner:'180秒', intermediate:'180-240秒', advanced:'240-300秒' },
        weight:{ beginner:'空杆/轻重量', intermediate:'体重80-100%', advanced:'体重120%+' }
      }
    ]
  },
  obliques:{
    name:'腹斜肌', en:'OBLIQUES',
    bodyTypeTips:{
      ectomorph:'外胚层体脂低，腰腹线条容易显现，可以做专项腹斜肌训练增加腰部肌肉。',
      mesomorph:'均衡训练，俄罗斯转体和侧平板支撑是不错的选择。',
      endomorph:'内胚层体型不建议过度训练腹斜肌（会让腰围看起来更宽），以核心稳定训练为主。'
    },
    exercises:[
      { id:'russian-twist', name:'俄罗斯转体', en:'Russian Twist', type:'复合',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'🌀',
        desc:'经典的腹斜肌旋转训练，持哑铃或药球增加强度，腰部旋转力量的核心动作。',
        animation:'russian-twist',
        youtubeId:'JyUqwkVpsi8',
        tencentId:'s3045efc5ul',
        steps:[
          { text:'坐姿，身体后仰45°，屈膝，脚跟可以踩地（降难度）或悬空', tip:null },
          { text:'双手持哑铃或药球置于胸前', tip:null },
          { text:'保持核心收紧和背部姿势，向一侧旋转上体', tip:'旋转应该来自腰椎旋转，而不是单纯地摆手' },
          { text:'触碰地面后换方向，两侧算一次', tip:null },
          { text:'控制速度，不要靠惯性甩动', tip:null }
        ],
        sets:{ beginner:'3×20次(每侧)', intermediate:'4×20次(每侧)', advanced:'4×30次(每侧)' },
        rest:{ beginner:'45秒', intermediate:'30秒', advanced:'30秒' },
        weight:{ beginner:'无重量/轻', intermediate:'中等', advanced:'重量' }
      }
    ]
  },
  forearms:{
    name:'前臂肌群', en:'FOREARM MUSCLES',
    bodyTypeTips:{
      ectomorph:'外胚层前臂通常纤细，硬拉和高位下拉是最佳练前臂的方式（功能性握力）。',
      mesomorph:'均衡发展，握力训练配合腕弯举即可。',
      endomorph:'内胚层通常握力较强，可以专注改善前臂肌肉线条。'
    },
    exercises:[
      { id:'wrist-curl', name:'腕部弯举', en:'Wrist Curl', type:'孤立',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'✊',
        desc:'直接训练前臂屈肌群，改善握力，增加前臂视觉厚度。',
        animation:'wrist-curl',
        youtubeId:'7HXdFuUMzgI',
        tencentId:'y3312rep1n0',
        steps:[
          { text:'坐姿，前臂放在大腿上，手腕和手悬出大腿边缘', tip:null },
          { text:'正握哑铃（掌心向上），手腕向下弯曲到最低位', tip:null },
          { text:'以手腕屈曲的动作向上卷起，到最高点', tip:null },
          { text:'停顿1秒，感受前臂肌群收缩', tip:null },
          { text:'变式：反握做腕部伸展，训练前臂伸肌', tip:'屈腕和伸腕都要训练，保持平衡避免网球肘' }
        ],
        sets:{ beginner:'3×15-20', intermediate:'3×15-20', advanced:'4×15-20' },
        rest:{ beginner:'30秒', intermediate:'30秒', advanced:'30秒' },
        weight:{ beginner:'轻重量', intermediate:'中等', advanced:'中-重' }
      }
    ]
  },
  hips:{
    name:'髋屈肌群', en:'HIP FLEXORS',
    bodyTypeTips:{
      ectomorph:'外胚层骨盆往往偏前倾，拉伸髋屈肌比训练更重要，建议每天拉伸。',
      mesomorph:'均衡训练和拉伸，复合动作（深蹲、硬拉）已足够刺激髋屈肌。',
      endomorph:'内胚层体型久坐导致髋屈肌紧张，重点以拉伸为主，配合臀肌激活训练。'
    },
    exercises:[
      { id:'hip-flexor-stretch', name:'髋屈肌拉伸', en:'Hip Flexor Stretch', type:'拉伸',
        diff:{ beginner:'初级', intermediate:'初级', advanced:'初级' },
        icon:'🧘',
        desc:'改善久坐导致的髋屈肌紧张，减少腰痛风险，提升深蹲和跑步表现。',
        animation:'hip-stretch',
        youtubeId:'RsAcHZKOXOs',
        tencentId:'g3251kgox81',
        steps:[
          { text:'呈弓步跪姿，右脚向前，左膝跪地', tip:'可以在跪地膝盖下垫一块垫子' },
          { text:'重心向前移，感受左侧髋部前面被拉伸', tip:'腰部不要过度前弓，应该感受到髋前侧的拉伸' },
          { text:'右手可以放在右膝上，左手叉腰或向上伸直强化拉伸', tip:null },
          { text:'保持30-45秒，均匀呼吸，不要憋气', tip:null },
          { text:'换腿重复，每侧进行2-3组', tip:'每天进行，尤其是久坐后一定要做' }
        ],
        sets:{ beginner:'2×30秒(每侧)', intermediate:'3×45秒(每侧)', advanced:'3×60秒(每侧)' },
        rest:{ beginner:'30秒', intermediate:'20秒', advanced:'15秒' },
        weight:{ beginner:'自重', intermediate:'自重', advanced:'可加弹力带' }
      }
    ]
  }
};

/* ── If profile was restored from localStorage, init now ── */
if (window._skipOnboarding) { initApp(); }

/* ── 补充缺失函数 ── */
function applyPrefsAndRegen() {
  if (_nutrState && _nutrState.goal) {
    buildMealPlan(_nutrState, getActivePrefs());
    // 滚动到方案区域
    document.getElementById('meal-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ── 将所有 HTML onclick 使用的函数挂载到全局 window ── */
window.switchPage         = switchPage;
window.mobileTab          = mobileTab;
window.selectBodyType     = selectBodyType;
window.selectGoal         = selectGoal;
window.selectLevel        = selectLevel;
window.nextStep           = nextStep;
window.startApp           = startApp;
window.resetProfile       = resetProfile;
window.onBadgeClick       = onBadgeClick;
window.showAuthOverlay    = showAuthOverlay;
window.hideAuthOverlay    = hideAuthOverlay;
window.connectSyncCode    = connectSyncCode;
window.copySyncCode       = copySyncCode;
window.setView            = setView;
window.toggleMuscle       = toggleMuscle;
window.selectFeel         = selectFeel;
window.submitCheckin      = submitCheckin;
window.deleteLog          = deleteLog;
window.clearAllLogs       = clearAllLogs;
window.filterEx           = filterEx;
window.toggleSteps        = toggleSteps;
window.openModal          = openModal;
window.closeModal         = closeModal;
window.switchPlatform     = switchPlatform;
window.togglePref         = togglePref;
window.calcNutrition      = calcNutrition;
/* ── 过往挑战归档渲染 ── */
function renderArchive() {
  const el = document.getElementById('archive-list');
  const countEl = document.getElementById('archive-count');
  if (!el) return;
  const arr = loadArchive();
  if (countEl) countEl.textContent = arr.length ? `${arr.length} 条` : '';
  if (!arr.length) {
    el.innerHTML = `<div style="text-align:center;color:var(--muted);font-size:12px;padding:16px 0">还没有归档的挑战记录</div>`;
    return;
  }
  const goalColors = { cut:'#3b8fff', bulk:'#f0c040', 'bulk-lean':'#2ecc71', maintain:'#a78bfa' };
  const goalIcons  = { cut:'🔥', bulk:'💪', 'bulk-lean':'⚡', maintain:'⚖️' };
  el.innerHTML = arr.map(a => {
    const color = goalColors[a.goal] || 'var(--accent)';
    const icon  = goalIcons[a.goal]  || '🎯';
    const dur   = Math.round((new Date(a.archivedAt) - new Date(a.goalSetAt)) / 864e5);
    const pct   = Math.min(100, a.progressPct || 0);
    return `
    <div class="archive-item">
      <div class="archive-item-top">
        <div class="archive-goal-badge" style="border-color:${color};color:${color}">
          ${icon} ${a.goalName}
        </div>
        <div class="archive-dates">${a.goalSetAt} → ${a.archivedAt} · ${dur}天</div>
        <button class="archive-del-btn" onclick="deleteArchiveEntry(${a.id})" title="删除">✕</button>
      </div>
      <div class="archive-progress-bar-wrap">
        <div class="archive-progress-bar" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="archive-item-stats">
        <span style="color:${color};font-weight:700">${pct}% 完成</span>
        <span>目标 ${a.target} kcal</span>
        <span>蛋白 ${a.protG}g</span>
        <span>脂肪 ${a.fatG}g</span>
        <span>碳水 ${a.carbG}g</span>
      </div>
    </div>`;
  }).join('');
}

function toggleArchive() {
  const body = document.getElementById('archive-body');
  const icon = document.getElementById('archive-toggle-icon');
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  if (icon) icon.textContent = open ? '▸' : '▾';
  if (!open) renderArchive();
}


window.closeCheckinForm    = closeCheckinForm;
window.openCheckinForm     = openCheckinForm;
window.closeCelebration    = closeCelebration;
window.renderForest        = renderForest;
window.toggleArchive       = toggleArchive;
window.deleteArchiveEntry  = deleteArchiveEntry;
window.applyPrefsAndRegen = applyPrefsAndRegen;
window.calNavMonth         = calNavMonth;

/* ══════════════════════════════════════════════════════════
   🌳  训练森林系统  v3  ——  像素扁平风 + 远近景深 + 天空动态
   阶段：0种子 → 1-2嫩芽 → 3-5幼苗 → 6-10生长 →
         11-20茁壮 → 21-35森林 → 36-50茂密 → 51+参天
═══════════════════════════════════════════════════════════ */

function getForestStage(total) {
  if (total === 0)  return { stage:0, name:'种子期',   desc:'等待第一次打卡' };
  if (total <= 2)   return { stage:1, name:'嫩芽期',   desc:`已打卡 ${total} 次，小芽破土` };
  if (total <= 5)   return { stage:2, name:'幼苗期',   desc:`已打卡 ${total} 次，幼树扎根` };
  if (total <= 10)  return { stage:3, name:'生长期',   desc:`已打卡 ${total} 次，枝叶渐茂` };
  if (total <= 20)  return { stage:4, name:'茁壮期',   desc:`已打卡 ${total} 次，大树成形` };
  if (total <= 35)  return { stage:5, name:'森林期',   desc:`已打卡 ${total} 次，森林初现` };
  if (total <= 50)  return { stage:6, name:'茂密森林', desc:`已打卡 ${total} 次，绿意盎然` };
  return             { stage:7, name:'参天森林', desc:`已打卡 ${total} 次，郁郁葱葱` };
}

/* ── 伪随机（稳定，不每次刷新都变） ── */
function _rng(seed) {
  let s = seed & 0xffffffff;
  return function() {
    s = (s ^ (s << 13)) & 0xffffffff;
    s = (s ^ (s >>> 17)) & 0xffffffff;
    s = (s ^ (s << 5))  & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/* ── 像素扁平树（圆角矩形组合） ──
   层次：树干 → 阴影块 → 主冠（大圆角矩形）→ 高光块 → 亮点
   远景树：颜色更蓝更暗，尺寸更小，无高光细节
*/
function drawFlatTree(cx, groundY, size, idx, isBg, animDelay) {
  // 调色板：4种色调，轻微差异增加多样感
  const palettes = [
    { trunk:'#3d2b1f', shadow:'#1a4a20', base:'#2d7a35', mid:'#3d9e47', hi:'#5dc466', dot:'#8ae08f' },
    { trunk:'#3a2518', shadow:'#164520', base:'#28723a', mid:'#389a4c', hi:'#55c060', dot:'#84dc8a' },
    { trunk:'#402d22', shadow:'#1c4f24', base:'#317f38', mid:'#42a84b', hi:'#60c96a', dot:'#90e596' },
    { trunk:'#382618', shadow:'#1e5228', base:'#2c763c', mid:'#3ca24f', hi:'#58c265', dot:'#86de8c' },
  ];
  const c = isBg
    ? { trunk:'#2a1f16', shadow:'#0f3016', base:'#1d5225', mid:'#285e2e', hi:'#2e6a34', dot:'#356040' }
    : palettes[idx % 4];

  const R   = Math.round;  // 像素取整，扁平感
  const tw  = R(size * 0.13);
  const th  = R(size * 0.42);
  const tx  = R(cx - tw/2);
  const ty  = R(groundY - th);
  const cr  = R(tw * 0.5);  // 树干圆角

  // 树冠尺寸（宽扁圆角矩形，像素风）
  const cw  = R(size * 0.88);
  const ch  = R(size * 0.72);
  const cy  = R(ty - ch * 0.55);
  const ccr = R(size * 0.22);  // 树冠圆角

  if (size < 7) {
    // 种子芽：单个小圆
    return `<g style="animation-delay:${animDelay}ms" class="tree-group">
      <rect x="${R(cx-size*0.06)}" y="${R(groundY - size*0.18)}" width="${R(size*0.12)}" height="${R(size*0.18)}" rx="2" fill="${c.trunk}"/>
      <circle cx="${R(cx)}" cy="${R(groundY - size*0.28)}" r="${R(size*0.22)}" fill="${c.mid}"/>
    </g>`;
  }

  if (size < 16) {
    // 幼苗：细干 + 单层小圆冠
    const sr = R(size * 0.42);
    return `<g style="animation-delay:${animDelay}ms" class="tree-group">
      <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${cr}" fill="${c.trunk}"/>
      <rect x="${R(cx - cw*0.38)}" y="${R(cy - ch*0.22)}" width="${R(cw*0.76)}" height="${R(ch*0.76)}" rx="${ccr}" fill="${c.shadow}" opacity="0.5"/>
      <rect x="${R(cx - cw*0.4)}" y="${R(cy - ch*0.25)}" width="${R(cw*0.8)}" height="${R(ch*0.8)}" rx="${ccr}" fill="${c.base}"/>
      <rect x="${R(cx - cw*0.18)}" y="${R(cy - ch*0.42)}" width="${R(cw*0.36)}" height="${R(ch*0.28)}" rx="${R(ccr*0.6)}" fill="${c.hi}" opacity="0.7"/>
    </g>`;
  }

  // 成熟树：3层结构（阴影偏移 + 主冠 + 高光 + 亮点）
  const layers = isBg ? 2 : (size > 38 ? 3 : size > 24 ? 2 : 2);

  let svg = `<g style="animation-delay:${animDelay}ms" class="tree-group">`;

  // 树干（带纹理感：两个矩形）
  svg += `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${cr}" fill="${c.trunk}"/>`;
  if (!isBg && size > 20) {
    svg += `<rect x="${R(tx + tw*0.55)}" y="${R(ty + th*0.15)}" width="${R(tw*0.2)}" height="${R(th*0.55)}" rx="1" fill="rgba(255,255,255,0.06)"/>`;
  }

  // 树冠阴影（向右下偏移，增加立体感）
  const so = R(size * 0.04);
  svg += `<rect x="${R(cx - cw*0.44 + so)}" y="${R(cy - ch*0.3 + so)}" width="${R(cw*0.88)}" height="${R(ch*0.86)}" rx="${ccr}" fill="${c.shadow}" opacity="${isBg?0.6:0.45}"/>`;

  // 主冠层（扁平大块）
  svg += `<rect x="${R(cx - cw*0.44)}" y="${R(cy - ch*0.3)}" width="${R(cw*0.88)}" height="${R(ch*0.86)}" rx="${ccr}" fill="${c.base}"/>`;

  // 中层高光（稍小，略亮）
  if (layers >= 2) {
    svg += `<rect x="${R(cx - cw*0.3)}" y="${R(cy - ch*0.5)}" width="${R(cw*0.58)}" height="${R(ch*0.5)}" rx="${R(ccr*0.8)}" fill="${c.mid}"/>`;
  }

  // 顶部高光条（像素风关键细节）
  if (!isBg) {
    svg += `<rect x="${R(cx - cw*0.18)}" y="${R(cy - ch*0.66)}" width="${R(cw*0.34)}" height="${R(ch*0.2)}" rx="${R(ccr*0.6)}" fill="${c.hi}" opacity="0.85"/>`;
    // 亮点（左上角小方块，像素感）
    svg += `<rect x="${R(cx - cw*0.26)}" y="${R(cy - ch*0.72)}" width="${R(size*0.09)}" height="${R(size*0.09)}" rx="2" fill="${c.dot}" opacity="0.7"/>`;
  }

  if (layers >= 3) {
    // 第三层：顶部小块（参天大树专属）
    const t3w = R(cw*0.44), t3h = R(ch*0.36);
    svg += `<rect x="${R(cx - t3w*0.5)}" y="${R(cy - ch*0.82)}" width="${t3w}" height="${t3h}" rx="${R(ccr*0.7)}" fill="${c.mid}"/>`;
    svg += `<rect x="${R(cx - t3w*0.22)}" y="${R(cy - ch*0.98)}" width="${R(t3w*0.42)}" height="${R(t3h*0.5)}" rx="${R(ccr*0.5)}" fill="${c.hi}" opacity="0.75"/>`;
  }

  svg += `</g>`;
  return svg;
}

/* ── 天空元素：云 / 星星 / 小鸟 ── */
function drawSkyElements(stage, seed) {
  const rng = _rng(seed + 9999);
  let sky = '';

  // 星星（低阶段可见，高阶段被云遮）
  if (stage <= 3) {
    const starCount = 8 + stage * 4;
    for (let i = 0; i < starCount; i++) {
      const sx = rng() * 580 + 10;
      const sy = rng() * 60 + 8;
      const sr = rng() * 1.2 + 0.6;
      const op = 0.4 + rng() * 0.5;
      sky += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sr.toFixed(1)}" fill="#c8e6c9" opacity="${op.toFixed(2)}" class="star-twinkle" style="animation-delay:${(rng()*3).toFixed(1)}s"/>`;
    }
  }

  // 像素风扁平云（圆角矩形叠加）
  const cloudCount = Math.min(4, 1 + Math.floor(stage / 2));
  for (let i = 0; i < cloudCount; i++) {
    const cx  = 60 + rng() * 480;
    const cy  = 18 + rng() * 55;
    const cw  = 40 + rng() * 50;
    const ch  = 14 + rng() * 12;
    const cr  = ch * 0.5;
    const op  = 0.12 + rng() * 0.14;
    const col = stage >= 4 ? '#a5d6a7' : '#b2dfdb';
    // 云体：3个叠加圆角矩形（像素扁平风）
    sky += `<g opacity="${op.toFixed(2)}" class="cloud-drift" style="animation-delay:${(rng()*8).toFixed(1)}s">
      <rect x="${(cx-cw*0.5).toFixed(1)}" y="${(cy-ch*0.3).toFixed(1)}" width="${(cw).toFixed(1)}" height="${(ch*0.7).toFixed(1)}" rx="${(cr*0.6).toFixed(1)}" fill="${col}"/>
      <rect x="${(cx-cw*0.3).toFixed(1)}" y="${(cy-ch*0.7).toFixed(1)}" width="${(cw*0.55).toFixed(1)}" height="${(ch*0.65).toFixed(1)}" rx="${(cr*0.5).toFixed(1)}" fill="${col}"/>
      <rect x="${(cx+cw*0.05).toFixed(1)}" y="${(cy-ch*0.5).toFixed(1)}" width="${(cw*0.38).toFixed(1)}" height="${(ch*0.55).toFixed(1)}" rx="${(cr*0.45).toFixed(1)}" fill="${col}"/>
    </g>`;
  }

  // 小鸟（V形折线，stage>=3出现）
  if (stage >= 3) {
    const birdCount = Math.min(5, Math.floor(stage / 2));
    for (let i = 0; i < birdCount; i++) {
      const bx = 50 + rng() * 500;
      const by = 15 + rng() * 50;
      const bs = 3 + rng() * 3;
      const op = 0.35 + rng() * 0.35;
      sky += `<g opacity="${op.toFixed(2)}" class="bird-fly" style="animation-delay:${(rng()*6).toFixed(1)}s">
        <polyline points="${(bx-bs).toFixed(1)},${(by+bs*0.4).toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)} ${(bx+bs).toFixed(1)},${(by+bs*0.4).toFixed(1)}" fill="none" stroke="#81c784" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`;
    }
  }

  return sky;
}

/* ── 地面装饰：草丛 + 落叶（像素感小矩形） ── */
function drawGroundDecor(total, stage) {
  const rng  = _rng(total * 13);
  let decor  = '';
  const grassCount = Math.min(30, 6 + total);

  for (let i = 0; i < grassCount; i++) {
    const x  = rng() * 580 + 10;
    const h  = 4 + rng() * 6;
    const w  = 1.5 + rng() * 1;
    const cr = 1;
    const col = rng() > 0.5 ? '#3d9e47' : '#2d7a35';
    const lean = (rng() - 0.5) * 3;
    decor += `<rect x="${(x+lean).toFixed(1)}" y="${(192-h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${cr}" fill="${col}" opacity="${(0.5+rng()*0.4).toFixed(2)}"/>`;
  }

  // 落叶（小圆角正方形，stage>=4出现）
  if (stage >= 4) {
    const leafCount = Math.min(15, (stage - 3) * 4);
    for (let i = 0; i < leafCount; i++) {
      const lx  = rng() * 560 + 20;
      const ly  = 186 + rng() * 8;
      const ls  = 2 + rng() * 3;
      const col = ['#66bb6a','#4caf50','#43a047','#81c784','#a5d6a7'][Math.floor(rng()*5)];
      decor += `<rect x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="${ls.toFixed(1)}" height="${ls.toFixed(1)}" rx="1" fill="${col}" opacity="${(0.4+rng()*0.4).toFixed(2)}" transform="rotate(${(rng()*45).toFixed(0)},${lx.toFixed(1)},${ly.toFixed(1)})"/>`;
    }
  }

  return decor;
}

/* ── 树位置分布（黄金角，稳定不抖） ── */
function computeTreePositions(n, W) {
  if (n === 1) return [W / 2];
  const margin = 44;
  const usable = W - margin * 2;
  const rng    = _rng(n * 31 + 7);
  return Array.from({length: n}, (_, i) => {
    const base   = margin + (i / (n - 1)) * usable;
    const jitter = (rng() - 0.5) * Math.min(22, usable / n * 0.4);
    return Math.round(Math.max(margin, Math.min(W - margin, base + jitter)));
  });
}

/* ── 主渲染函数 ── */
function renderForest(logs) {
  const svgEl   = document.getElementById('forest-svg');
  const treesEl = document.getElementById('trees-layer');
  const grassEl = document.getElementById('grass-layer');
  const emptyEl = document.getElementById('forest-empty');
  const labelEl = document.getElementById('forest-stage-label');
  const subEl   = document.getElementById('forest-subtitle');
  const countEl = document.getElementById('forest-tree-count');
  if (!svgEl || !treesEl) return;

  const validLogs    = (logs||[]).filter(l => l && typeof l.date==='string' && l.date.length===10);
  const totalSessions= validLogs.length;
  const uniqueDays   = [...new Set(validLogs.map(l=>l.date))];
  const total        = totalSessions;
  const { stage, name, desc } = getForestStage(total);

  if (labelEl) labelEl.textContent = `${name} · ${desc}`;
  if (subEl)   subEl.textContent   = total===0
    ? '每次打卡都在浇水，森林随你成长'
    : `共打卡 ${total} 次 · ${uniqueDays.length} 个训练日`;

  // 注入CSS动画（只注一次）
  if (!document.getElementById('forest-anim-style')) {
    const st = document.createElement('style');
    st.id = 'forest-anim-style';
    st.textContent = `
      .tree-group { animation: treePopIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
      @keyframes treePopIn { from{opacity:0;transform:scaleY(0.2) translateY(10px)} to{opacity:1;transform:none} }
      .star-twinkle { animation: starPulse 3s ease-in-out infinite alternate; }
      @keyframes starPulse { from{opacity:0.2} to{opacity:0.9} }
      .cloud-drift  { animation: cloudMove 12s ease-in-out infinite alternate; }
      @keyframes cloudMove { from{transform:translateX(-6px)} to{transform:translateX(6px)} }
      .bird-fly     { animation: birdFloat 5s ease-in-out infinite alternate; }
      @keyframes birdFloat { from{transform:translate(-4px,1px)} to{transform:translate(4px,-2px)} }
    `;
    document.head.appendChild(st);
  }

  if (total === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    treesEl.innerHTML = '';
    grassEl.innerHTML = '';
    // 空地：只画天空
    const skyLayer = document.getElementById('sky-deco-layer');
    if (skyLayer) skyLayer.innerHTML = drawSkyElements(0, 0);
    if (countEl) countEl.textContent = '0';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  // 树数量
  const treeCount = stage<=2 ? 1
    : stage===3 ? Math.min(3,  Math.floor(total/3))
    : stage===4 ? Math.min(5,  Math.floor(total/4))
    : stage===5 ? Math.min(9,  Math.floor(total/4))
    : stage===6 ? Math.min(13, Math.floor(total/3.5))
    : Math.min(18, Math.floor(total/3));
  if (countEl) countEl.textContent = treeCount;

  const baseSize = stage<=1?7 : stage===2?14 : stage===3?24
    : stage===4?36 : stage===5?46 : stage===6?54 : 62;

  const W = 600, groundY = 192;
  const positions = computeTreePositions(treeCount, W);

  // ── 后排小树（远景，颜色更暗更蓝）──
  let bgTrees = '';
  if (stage >= 4) {
    const bgCount = Math.min(6, Math.floor(treeCount * 0.6));
    const bgRng   = _rng(total * 17);
    const bgPositions = computeTreePositions(bgCount, W);
    for (let i = 0; i < bgCount; i++) {
      const bgSize  = baseSize * (0.38 + bgRng() * 0.18);
      const bgGround= groundY - baseSize * 0.08; // 后排稍高（透视）
      bgTrees += drawFlatTree(bgPositions[i], bgGround, bgSize, i, true, i * 60 + 200);
    }
  }

  // ── 前排主树 ──
  let trees = '';
  for (let i = 0; i < treeCount; i++) {
    const age  = treeCount - i;
    const sz   = Math.round(Math.min(baseSize, baseSize * (0.55 + age/treeCount*0.5)));
    trees += drawFlatTree(positions[i], groundY, sz, i, false, i * 75);
  }

  // ── 天空 + 地面 ──
  const skyLayer = document.getElementById('sky-deco-layer');
  if (skyLayer) skyLayer.innerHTML = drawSkyElements(stage, total);

  grassEl.innerHTML = drawGroundDecor(total, stage);
  // 先渲染后排，再渲染前排（z-order）
  treesEl.innerHTML = bgTrees + trees;
}


/* 浇水动画（打卡后触发） */
function playWaterAnimation(logs) {
  const waterEl = document.getElementById('water-layer');
  if (!waterEl) return;

  const total    = logs.length;  // 总打卡次数
  const treeCount= Math.max(1, getForestStage(total).stage <= 2 ? 1 : Math.min(total, 8));
  const positions= computeTreePositions(treeCount, 600);
  const targetX  = positions[positions.length - 1] || 300;

  // 升级水滴：圆角矩形（像素风），颜色更鲜亮
  let drops = '';
  const colors = ['#64b5f6','#81d4fa','#4fc3f7','#29b6f6','#80deea','#4dd0e1'];
  for (let i = 0; i < 8; i++) {
    const dx    = targetX - 16 + i * 5 + (i%2)*2;
    const delay = i * 65;
    const col   = colors[i % colors.length];
    drops += `<rect x="${dx}" y="55" width="3" height="5" rx="1.5" fill="${col}" opacity="0.92"
      style="animation: wfall_${i} 0.75s ease-in ${delay}ms forwards"/>`;
  }
  // 着地涟漪圆
  drops += `<circle cx="${targetX}" cy="188" r="0" fill="none" stroke="#64b5f6" stroke-width="1.5" opacity="0"
    style="animation: ripple 0.6s ease-out 500ms forwards"/>`;
  waterEl.innerHTML = drops;

  const styleId = 'water-keyframes';
  let s = document.getElementById(styleId);
  if (!s) { s = document.createElement('style'); s.id = styleId; document.head.appendChild(s); }
  let kf = '@keyframes ripple { 0%{r:0;opacity:0.7} 100%{r:18;opacity:0} }\n';
  for (let i = 0; i < 8; i++) {
    const endY = 182 + (i % 3) * 4;
    kf += `@keyframes wfall_${i} {
      0%   { transform:translateY(0);   opacity:0.92; }
      75%  { transform:translateY(${endY - 55}px); opacity:0.6; }
      100% { transform:translateY(${endY - 55 + 8}px); opacity:0; }
    }\n`;
  }
  s.textContent = kf;
  setTimeout(() => { waterEl.innerHTML = ''; }, 1400);
}


/* ═══════════════════════════════════════════════════════════
   目标达成预测图  —  完整实现
   算法考虑：性别、体重、BMI、体脂率、活动水平、训练目标、
            打卡强度（MET × 体重 × 时长）、打卡频率
═══════════════════════════════════════════════════════════ */

let _forecastChart = null;  // Chart.js 实例

/* ── A. 每次打卡的实际训练量得分 ── */
function calcSessionScore(log, s, level) {
  const w      = s?.w || 70;
  const feelMET = { great: 7.8, good: 5.5, tired: 3.8 }[log.feel] || 5.5;

  // 部位系数：覆盖越多肌群，代谢消耗越大
  const mc = log.muscles?.length || 1;
  const hasCardio  = log.muscles?.some(m => ['有氧','腿部'].includes(m));
  const muscleMult = mc >= 6 ? 1.35 : mc >= 4 ? 1.15 : mc >= 2 ? 1.0 : 0.8;
  const cardioMult = hasCardio ? 1.1 : 1.0;
  const MET = feelMET * muscleMult * cardioMult;

  // 时长：有填用真实值，没填按组数估算（每组约3.5分钟含休息）
  const defSets = level === 'advanced' ? 5 : level === 'intermediate' ? 4 : 3;
  const sets = log.sets || defSets;
  const durationMin = log.duration || Math.round(sets * 3.5 + 10);
  const durationH   = durationMin / 60;

  // 实际消耗热量（MET公式，体重修正）
  const kcalBurned = MET * w * durationH;
  return { kcalBurned, MET, durationMin, mc };
}

/* ── B. 目标轨迹计算（每天应达到的进度%） ── */
function calcIdealTrajectory(s, planDays) {
  // 不再是简单匀速——前期慢（适应期）、中期快、后期稳
  const pts = [];
  for (let d = 0; d <= planDays; d++) {
    const t = d / planDays;
    // S型曲线：更真实的生理进度
    const pct = 100 / (1 + Math.exp(-10 * (t - 0.5)));
    pts.push(Math.min(100, pct));
  }
  return pts;
}

/* ── C. 目标总量计算（考虑全部生理参数） ── */
function calcGoalTarget(s) {
  if (!s || !s.goal) return null;
  const { w=70, h=170, a=30, sex='male', act=1.55, bmi=22, bf=null, goal, freq=3, tdee=2000, target=1700 } = s;
  const level = userProfile?.level || 'beginner';

  // ── BMI修正系数
  const bmiNum = parseFloat(bmi) || (w / ((h/100)**2));
  const bmiMod = bmiNum > 30 ? 1.25
               : bmiNum > 27 ? 1.10
               : bmiNum > 24 ? 1.00
               : bmiNum > 20 ? 0.90 : 0.82;

  // ── 性别修正
  const sexMod = sex === 'male' ? 1.08 : 0.93;

  // ── 活动水平修正（act 范围 1.2~1.9）
  const actMod = 1 + (act - 1.2) / 0.7 * 0.18; // 1.0 ~ 1.18

  // ── 体脂修正（体脂越高，减脂效率越高；增肌效率越低）
  const bfNum = bf && bf > 5 ? bf : (sex === 'male' ? 18 : 25);
  const bfModCut  = Math.min(1.3, 1 + (bfNum - 15) * 0.02);
  const bfModBulk = Math.max(0.65, 1 - (bfNum - 12) * 0.015);

  if (goal === 'cut') {
    const deficit   = Math.max(100, (tdee || 2000) - (target || 1700));
    const kgPerWk   = Math.min(1.5, deficit * 7 / 7700);
    const effKgPerWk = kgPerWk * bmiMod * sexMod * actMod * bfModCut;
    const planWeeks  = 12;
    const totalKg    = effKgPerWk * planWeeks;
    return { goal, planWeeks, planDays: planWeeks*7, totalKg, effKgPerWk, unit:'kg', label:'减脂目标' };

  } else if (goal === 'bulk' || goal === 'bulk-lean') {
    const baseRateKgMo = level==='advanced' ? 0.3 : level==='intermediate' ? 0.6 : 0.9;
    // 体重越大，绝对增肌上限更高
    const weightMod = Math.min(1.4, w / 65);
    const effRate   = baseRateKgMo * sexMod * bfModBulk * weightMod * (goal==='bulk-lean'?0.7:1.0);
    const planWeeks  = 16;
    const totalKg    = effRate * (planWeeks / 4);
    return { goal, planWeeks, planDays: planWeeks*7, totalKg, effRate, unit:'kg', label:'增肌目标' };

  } else { // maintain
    const planWeeks = 12;
    return { goal, planWeeks, planDays: planWeeks*7, totalKg: null, unit:'%', label:'体型维持' };
  }
}

/* ── D. 实际轨迹
   设计原则：只反映「已发生」的真实情况
   - 每个打卡日计算累积进度，非打卡日不产生新点
   - 进度 = 累计有效训练量 / 完成目标所需总训练量
   - 不同目标类型的「有效训练量」定义不同
─────────────────────────────────────────── */
function calcActualTrajectory(logs, s, goalInfo) {
  if (!goalInfo) return [];
  const { goal, planDays, planWeeks, totalKg } = goalInfo;
  const level    = userProfile?.level || 'beginner';
  const startIso = s.goalSetAt || (logs.length
    ? [...logs].sort((a,b) => a.date < b.date ? -1 : 1)[0].date
    : localToday());
  const startMs = new Date(startIso + 'T00:00:00').getTime();

  const logsAfter = logs
    .filter(l => l.date >= startIso)
    .sort((a,b) => a.date < b.date ? -1 : 1);

  // 按日聚合
  const byDay = {};
  logsAfter.forEach(l => {
    if (!byDay[l.date]) byDay[l.date] = [];
    byDay[l.date].push(l);
  });

  // 「完成目标所需的计划总训练kcal」——作为进度分母
  // 用计划频率 × 计划周数 × 中等强度单次kcal 估算
  const planSessions    = (s.freq || 3) * (planWeeks || 12);
  const baseKcalPerSess = 380; // 中等强度基准（MET=5.5, 70kg, 50min）
  const planTotalKcal   = planSessions * baseKcalPerSess;

  const pts = [{ dayIdx: 0, pct: 0 }];
  let cumKcal      = 0;
  let sessionCount = 0;

  Object.entries(byDay).sort().forEach(([date, dayLogs]) => {
    const dayIdx = Math.round(
      (new Date(date + 'T00:00:00') - startMs) / 86400000
    );
    if (dayIdx < 0 || dayIdx > planDays + 30) return; // dayIdx=0(目标设定日当天)也计入

    const dayKcal = dayLogs.reduce(
      (sum, log) => sum + calcSessionScore(log, s, level).kcalBurned, 0
    );
    cumKcal += dayKcal;
    sessionCount += dayLogs.length;

    let pct = 0;

    if (goal === 'cut') {
      // 减脂：饮食赤字(主要) + 运动消耗(次要) → 折算减重
      const deficit   = Math.max(0, (s.tdee||2000) - (s.target||1700));
      const dietKcal  = deficit * dayIdx;
      const exerKcal  = cumKcal * 0.4;        // 运动消耗40%贡献净赤字
      const kgLost    = (dietKcal + exerKcal) / 7700;
      pct = Math.min(100, kgLost / (totalKg || 1) * 100);

    } else if (goal === 'bulk' || goal === 'bulk-lean') {
      // 增肌：训练容量累积（强度越高、覆盖越多肌群 → 进度越快）
      const avgKcal       = cumKcal / sessionCount;
      const intensityMod  = Math.min(1.4, avgKcal / baseKcalPerSess);
      pct = Math.min(100, (cumKcal * intensityMod) / planTotalKcal * 100);

    } else { // maintain
      // 维持：完成率 = 实际打卡次数 / 计划打卡次数
      pct = Math.min(100, sessionCount / planSessions * 100);
    }

    const prevPct = pts[pts.length - 1]?.pct || 0;
    // 进度只增不减
    pts.push({ dayIdx, pct: Math.max(prevPct, pct) });
  });

  return pts;
}

/* ── E. 预测轨迹
   设计原则：用「近期日均产出」从今天匀速外推
   - 与实际线的本质区别：
     · 实际线是跳跃的（只有打卡日才有新数据点）
     · 预测线是平滑的（假设未来每天都有稳定产出）
   - 如果最近打卡频繁 → 预测线斜率陡 → 可达标
   - 如果最近几乎不打卡 → 日均→0 → 预测线平 → 难达标
─────────────────────────────────────────── */
function calcPredictTrajectory(actualPts, logs, s, goalInfo) {
  if (!goalInfo || !actualPts.length) return [];
  const { goal, planDays, planWeeks, totalKg } = goalInfo;
  const level    = userProfile?.level || 'beginner';
  const startIso = s.goalSetAt || logs[0]?.date;
  if (!startIso) return [];

  // ── 统计近28天（或目标以来）的日均训练产出 ──
  const today   = localToday();
  const cutoff  = startIso > new Date(Date.now() - 28*86400000)
                    .toISOString().slice(0,10)
                  ? startIso
                  : nDaysAgo(28);

  const recentLogs = logs.filter(l => l.date >= cutoff && l.date <= today);
  const recentDays = Math.max(1,
    Math.round((new Date(today+'T23:59:59') - new Date(cutoff+'T00:00:00')) / 86400000)
  );
  const recentSessions = [...new Set(recentLogs.map(l => l.date))].length;

  const recentTotalKcal = recentLogs.reduce(
    (sum, l) => sum + calcSessionScore(l, s, level).kcalBurned, 0
  );
  // 日均：用观察天数做分母（不打卡的天也算），反映真实习惯密度
  const kcalPerDay     = recentTotalKcal / recentDays;
  const sessPerDay     = recentSessions  / recentDays;

  // ── 接续实际线的最后一点 ──
  const lastPt  = actualPts[actualPts.length - 1];
  const lastDay = lastPt?.dayIdx || 0;
  const lastPct = lastPt?.pct    || 0;

  // 取实际线终点对应的累计kcal（用于增肌/减脂的绝对量延续）
  const logsToNow = logs.filter(l => l.date >= startIso && l.date <= today);
  const cumKcalNow     = logsToNow.reduce(
    (sum, l) => sum + calcSessionScore(l, s, level).kcalBurned, 0
  );
  const sessCountNow   = [...new Set(logsToNow.map(l => l.date))].length;
  const planSessions   = (s.freq || 3) * (planWeeks || 12);
  const baseKcalPerSess = 380;
  const planTotalKcal  = planSessions * baseKcalPerSess;

  const pts = [{ dayIdx: lastDay, pct: lastPct }];

  for (let d = lastDay + 1; d <= planDays; d++) {
    const daysAhead = d - lastDay; // 从今天往后第几天
    let pct;

    if (goal === 'cut') {
      const deficit      = Math.max(0, (s.tdee||2000) - (s.target||1700));
      const dietKcal     = deficit * daysAhead;
      const exerKcalMore = kcalPerDay * 0.4 * daysAhead;
      const kgMore       = (dietKcal + exerKcalMore) / 7700;
      pct = Math.min(100, lastPct + kgMore / (totalKg || 1) * 100);

    } else if (goal === 'bulk' || goal === 'bulk-lean') {
      // 用同一套公式，但 cumKcal 是 今天已有 + 未来预计
      const futurKcal     = kcalPerDay * daysAhead;
      const totalKcalPred = cumKcalNow + futurKcal;
      // 强度系数用历史平均（保持一致）
      const avgKcal      = sessCountNow > 0 ? cumKcalNow / sessCountNow : baseKcalPerSess;
      const intensityMod = Math.min(1.4, avgKcal / baseKcalPerSess);
      pct = Math.min(100, totalKcalPred * intensityMod / planTotalKcal * 100);

    } else { // maintain
      const sessMore  = sessPerDay * daysAhead;
      const totalSess = sessCountNow + sessMore;
      pct = Math.min(100, totalSess / planSessions * 100);
    }

    pts.push({ dayIdx: d, pct: Math.max(lastPct, pct) });
  }

  return pts;
}

/* ── F. 主渲染函数 ── */
function renderForecastChart(logs) {
  const s = _nutrState;
  const noGoalEl = document.getElementById('forecast-no-goal');
  const badgeEl  = document.getElementById('forecast-badge');
  const metaEl   = document.getElementById('forecast-meta');
  const statsEl  = document.getElementById('forecast-stats');
  const canvas   = document.getElementById('forecast-canvas');
  if (!canvas) return;

  if (!s || !s.goal) {
    if (noGoalEl) noGoalEl.style.display = 'flex';
    if (badgeEl)  badgeEl.textContent = '未设目标';
    return;
  }
  if (noGoalEl) noGoalEl.style.display = 'none';

  const goalInfo  = calcGoalTarget(s);
  if (!goalInfo) return;

  const { planDays, planWeeks, label } = goalInfo;
  const startIso  = s.goalSetAt || localToday();
  const startMs   = new Date(startIso+'T00:00:00').getTime();
  const today     = localToday();
  const daysElapsed = Math.max(0, Math.round((Date.now() - startMs) / 86400000));

  // 计算三条轨迹
  const idealPts  = calcIdealTrajectory(s, planDays);   // 数组长度 planDays+1
  const actualPts = calcActualTrajectory(logs, s, goalInfo);
  const predictPts= calcPredictTrajectory(actualPts, logs, s, goalInfo);

  // 预测终点进度 → 决定徽章颜色
  const predictEnd = predictPts[predictPts.length-1]?.pct || 0;
  const actualNow  = actualPts[actualPts.length-1]?.pct   || 0;
  const idealNow   = idealPts[Math.min(daysElapsed, planDays)] || 0;

  let badgeText, badgeCls, metaText;
  if (!logs.length || daysElapsed === 0) {
    badgeText = '待开始'; badgeCls = '';
    metaText  = `目标：${label}，计划 ${planWeeks} 周完成`;
  } else if (predictEnd >= 95) {
    badgeText = '✓ 可达标'; badgeCls = 'on-track';
    // 提前天数：预测线斜率 × 剩余需要的天数 vs 计划剩余天数
    // 实际含义：按当前速度，还需多少天到100%，然后对比计划截止日
    const remainDays    = planDays - daysElapsed;           // 计划剩余天数
    const doneRatio     = actualNow / 100;                  // 已完成比例
    const remainRatio   = 1 - doneRatio;                    // 还需完成比例
    const dailyRate     = daysElapsed > 0 ? doneRatio / daysElapsed : 0; // 每天完成速率
    const daysNeeded    = dailyRate > 0 ? Math.ceil(remainRatio / dailyRate) : remainDays;
    const ahead         = Math.max(0, remainDays - daysNeeded);
    metaText = ahead >= 3
      ? `按当前节奏可提前约 ${ahead} 天完成${label} 🎉`
      : `按当前节奏，正好在计划周期内完成 ✓`;
  } else if (predictEnd >= 65) {
    badgeText = '⚠ 有风险'; badgeCls = 'at-risk';
    const gap  = Math.round((100 - predictEnd) / 100 * planDays);
    metaText   = `当前节奏约完成 ${Math.round(predictEnd)}%，还差约 ${gap} 天训练量`;
  } else {
    badgeText = '✗ 难达标'; badgeCls = 'off-track';
    const needMore = Math.ceil((s.freq||3) * (100-predictEnd)/100 * 1.5);
    metaText = `需要每周多训练 ${needMore} 次，或提高强度才能达标`;
  }
  if (badgeEl) { badgeEl.textContent = badgeText; badgeEl.className = 'forecast-badge ' + badgeCls; }
  if (metaEl)  metaEl.textContent = metaText;

  // ── 统计卡片 ──
  const level = userProfile?.level || 'beginner';
  const recent7 = logs.filter(l => {
    const d7 = nDaysAgo(7);
    return l.date >= d7;
  });
  const avgKcal = recent7.length
    ? Math.round(recent7.reduce((s,l)=>s+calcSessionScore(l,_nutrState,level).kcalBurned,0)/recent7.length)
    : 0;
  const daysLeft   = Math.max(0, planDays - daysElapsed);
  const endDateStr = (() => {
    const d = new Date(new Date(startIso+'T00:00:00').getTime() + planDays*86400000);
    return `${d.getMonth()+1}/${d.getDate()}`;
  })();
  // 实际进度：actualNow 应该是当前的真实完成百分比
  const actualPct  = Math.round(actualNow * 10) / 10; // 保留1位小数

  if (statsEl) statsEl.innerHTML = `
    <div class="fc-stat">
      <div class="fc-stat-val" style="color:${predictEnd>=95?'#2ecc71':predictEnd>=65?'#f0c040':'#ff5a36'}">${Math.round(predictEnd)}%</div>
      <div class="fc-stat-lbl">预测完成率</div>
    </div>
    <div class="fc-stat">
      <div class="fc-stat-val" style="color:#3b8fff">${actualPct > 0 ? actualPct+'%' : (avgKcal||'—')}</div>
      <div class="fc-stat-lbl">${actualPct > 0 ? '当前实际进度' : '近7天均消耗 kcal/次'}</div>
    </div>
    <div class="fc-stat">
      <div class="fc-stat-val">${daysLeft}</div>
      <div class="fc-stat-lbl">距截止剩余天数<br><span style="font-size:10px;color:var(--muted)">${endDateStr}截止</span></div>
    </div>
  `;

  // ── Chart.js 图表 ──
  if (typeof Chart === 'undefined') return;

  // X轴：按周采样（最多显示16个点）
  const step = Math.max(1, Math.floor(planDays / 12));
  const xLabels = [];
  for (let d = 0; d <= planDays; d += step) {
    xLabels.push(d === 0 ? '开始' : `第${Math.round(d/7)}周`);
  }
  const xIndices = xLabels.map((_, i) => i * step);

  const idealData   = xIndices.map(d => parseFloat((idealPts[Math.min(d,planDays)]||0).toFixed(1)));

  // 实际数据：按采样点插值
  const actualData = xIndices.map(d => {
    if (d > daysElapsed) return null;
    // 找最近一个不超过 d 的实际点
    const pt = [...actualPts].reverse().find(p => p.dayIdx <= d);
    return pt ? parseFloat(pt.pct.toFixed(1)) : 0;
  });

  // 预测数据：从当前点往后
  const predictData = xIndices.map(d => {
    if (d < daysElapsed) return null;
    const pt = predictPts.find(p => p.dayIdx >= d);
    return pt ? parseFloat(pt.pct.toFixed(1)) : null;
  });
  // 让预测线从实际线末端开始（保证连续）
  const lastActualIdx = actualData.reduce((li,v,i)=>v!==null?i:li, -1);
  if (lastActualIdx >= 0 && predictData[lastActualIdx] === null) {
    predictData[lastActualIdx] = actualData[lastActualIdx];
  }

  // 预测线颜色：和实际线(金色)完全区分
  // on-track=蓝绿, at-risk=橙色(不是金), off-track=红
  const predictColor = predictEnd >= 95 ? '#2ecc71' : predictEnd >= 65 ? '#3b8fff' : '#ff5a36';

  if (_forecastChart) { _forecastChart.destroy(); _forecastChart = null; }

  const ctx = canvas.getContext('2d');
  _forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xLabels,
      datasets: [
        {
          label: '理想进度',
          data: idealData,
          borderColor: 'rgba(255,255,255,0.22)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0.4,
          order: 3,
        },
        {
          label: '实际进度',
          data: actualData,
          borderColor: '#f0c040',
          borderWidth: 2.5,
          pointRadius: (ctx) => {
            const v = ctx.dataset.data[ctx.dataIndex];
            return v !== null ? 3 : 0;
          },
          pointBackgroundColor: '#f0c040',
          pointBorderColor: '#0f1218',
          pointBorderWidth: 1.5,
          fill: false,
          tension: 0.35,
          spanGaps: false,
          order: 2,
        },
        {
          label: '预测轨迹',
          data: predictData,
          borderColor: predictColor,
          borderWidth: 2.5,
          borderDash: [8, 4],
          pointRadius: (ctx) => {
            if (ctx.dataIndex === predictData.length - 1) return 5;
            const v = predictData[ctx.dataIndex];
            const prev = predictData[ctx.dataIndex - 1];
            if (prev === null && v !== null) return 4; // 起点
            return 0;
          },
          pointBackgroundColor: predictColor,
          pointBorderColor: '#0f1218',
          pointBorderWidth: 1.5,
          fill: false,
          tension: 0.35,
          spanGaps: false,
          order: 1,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,18,24,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: 'rgba(255,255,255,0.6)',
          bodyColor: '#fff',
          padding: 10,
          callbacks: {
            label(ctx) {
              if (ctx.parsed.y === null) return null;
              return ` ${ctx.dataset.label}：${ctx.parsed.y.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
          ticks: {
            color: 'rgba(255,255,255,0.3)',
            font: { size: 10 },
            maxRotation: 0,
          }
        },
        y: {
          min: 0, max: 100,
          grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
          ticks: {
            color: 'rgba(255,255,255,0.3)',
            font: { size: 10 },
            callback: v => v + '%',
            stepSize: 25,
          }
        }
      }
    }
  });
}
