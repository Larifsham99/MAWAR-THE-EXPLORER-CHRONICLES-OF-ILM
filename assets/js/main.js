// assets/js/main.js

let db = []; // Akan diisi melalui fetch API JSON

const badgesData = [
    { id: 'b1', name: 'Penuntut Ilmu', desc: 'Jawab 10 soalan pertama', icon: 'fa-book' },
    { id: 'b2', name: 'Ahli Fardhu Ain', desc: 'Selesaikan World I', icon: 'fa-kaaba' },
    { id: 'b3', name: 'Penakluk Jurumiyyah', desc: 'Selesaikan World II', icon: 'fa-book-reader' },
    { id: 'b4', name: 'Penjaga Tajwid', desc: 'Selesaikan World III', icon: 'fa-moon' },
    { id: 'b5', name: 'Survivor', desc: 'Skor 10 dalam Survival', icon: 'fa-fire' },
    { id: 'b6', name: 'Master of Ilm', desc: 'Capai Level 10', icon: 'fa-crown' }
];

const defaultSave = {
    level: 1, xp: 0, totalQuestions: 0, correctAnswers: 0,
    bestStreak: 0, currentStreak: 0, survivalHighscore: 0,
    worldProgress: { fardhu_ain: 1, jurumiyyah: 0, tajwid: 0 },
    badges: [],
    settings: { audio: true }
};

let gameData = JSON.parse(localStorage.getItem('mawarSave')) || JSON.parse(JSON.stringify(defaultSave));
MawarAudio.enabled = gameData.settings.audio;

let state = {
    mode: '', activeQuestions: [], currentIndex: 0, 
    score: 0, hp: 3, timer: null, timeLeft: 0,
    bossHP: 10, playerHP: 5
};

// 1. Initialization & Data Fetching
async function initGame() {
    try {
        const response = await fetch('./data/questions.json');
        if(!response.ok) throw new Error("Gagal memuat turun data.");
        db = await response.json();
        document.getElementById('db-count').innerText = db.length;
    } catch (e) {
        console.error("Ralat JSON:", e);
        // Fallback jika dibuka terus tanpa server tempatan (CORS issue local file://)
        alert("Sila deploy ke GitHub Pages atau jalankan Local Server untuk memuatkan pangkalan data soalan dengan jayanya.");
    }
    updateUIStats();
}

window.onload = initGame;

// 2. Core Navigation & Saving
function saveGame() {
    localStorage.setItem('mawarSave', JSON.stringify(gameData));
    updateUIStats();
}

function nav(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const s = document.getElementById(`screen-${screenId}`);
    if(s) {
        s.style.display = 'flex';
        s.classList.add('active');
    }
    if(screenId === 'menu') updateUIStats();
    if(screenId === 'profile') renderProfile();
}

function toggleAudio() {
    gameData.settings.audio = !gameData.settings.audio;
    MawarAudio.enabled = gameData.settings.audio;
    MawarAudio.play('click');
    saveGame();
}

// 3. UI Progression
function getLevelData() {
    const req = gameData.level * 100;
    return { required: req, percentage: Math.min((gameData.xp / req) * 100, 100) };
}

function updateUIStats() {
    document.getElementById('ui-level').innerText = gameData.level;
    let title = gameData.level < 3 ? "Novice" : gameData.level < 6 ? "Apprentice" : gameData.level < 10 ? "Scholar" : "Master";
    document.getElementById('ui-title').innerText = title;
    
    const lData = getLevelData();
    document.getElementById('ui-xp-text').innerText = `${gameData.xp} / ${lData.required}`;
    document.getElementById('ui-xp-bar').style.width = `${lData.percentage}%`;
    
    document.getElementById('audio-icon').className = gameData.settings.audio ? 'fas fa-volume-up' : 'fas fa-volume-mute text-gray-500';
}

function openMap() {
    MawarAudio.play('click');
    nav('map');
    
    // Unlock Logic
    const w2 = document.getElementById('node-jurumiyyah');
    const w3 = document.getElementById('node-tajwid');
    
    if(gameData.worldProgress.jurumiyyah > 0) {
        w2.className = "map-node unlocked glow-effect";
        document.getElementById('line-2').className = "absolute w-1 h-32 bg-gold left-1/2 transform -translate-x-1/2 top-[50%] z-0";
        document.getElementById('text-jurumiyyah').className = "font-cinzel mt-2 text-sm text-gold text-center";
    }
    if(gameData.worldProgress.tajwid > 0) {
        w3.className = "map-node unlocked glow-effect";
        document.getElementById('text-tajwid').className = "font-cinzel mt-2 text-sm text-gold text-center";
    }
}

// 4. Game Modes
function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function startWorld(world) {
    if(db.length === 0) return alert("Sila tunggu data soalan dimuatkan.");
    if(world === 'jurumiyyah' && gameData.worldProgress.jurumiyyah === 0) return alert("Selesaikan Fardhu Ain dahulu!");
    if(world === 'tajwid' && gameData.worldProgress.tajwid === 0) return alert("Selesaikan Jurumiyyah dahulu!");
    
    MawarAudio.play('click');
    const p = gameData.worldProgress[world];
    if(p % 10 === 0 && p !== 0) {
        if(confirm("AWAS! Cabaran Boss menanti. Teruskan?")) startMode('boss', world);
    } else {
        startMode('campaign', world);
    }
}

function startMode(modeStr, category = null) {
    if(db.length === 0) return alert("Tiada data soalan. Semak JSON anda.");
    MawarAudio.play('click');
    state.mode = modeStr;
    state.score = 0;
    state.currentIndex = 0;
    
    let pool = db;
    if (category) {
        let catMap = {'fardhu_ain':'Fardhu Ain', 'jurumiyyah':'Jurumiyyah', 'tajwid':'Tajwid'};
        pool = pool.filter(q => q.category === catMap[category]);
    }
    if(pool.length === 0) return alert("Soalan kategori ini belum wujud di dalam JSON.");
    
    pool = shuffleArray(pool);

    document.getElementById('game-score').classList.add('hidden');
    document.getElementById('game-timer').classList.add('hidden');
    document.getElementById('game-hp').classList.add('hidden');
    document.getElementById('boss-ui').classList.add('hidden');
    clearInterval(state.timer);

    if (modeStr === 'campaign') {
        state.activeQuestions = pool.slice(0, 5); 
        document.getElementById('game-mode-title').innerText = "KAMPEN: " + pool[0].category.toUpperCase();
    } else if (modeStr === 'survival') {
        state.activeQuestions = pool; 
        state.hp = 3;
        document.getElementById('game-hp').classList.remove('hidden');
        document.getElementById('game-score').classList.remove('hidden');
        document.getElementById('game-mode-title').innerText = "SURVIVAL MODE";
        updateTopHUD();
    } else if (modeStr === 'timeattack') {
        state.activeQuestions = pool;
        state.timeLeft = 60;
        document.getElementById('game-timer').classList.remove('hidden');
        document.getElementById('game-score').classList.remove('hidden');
        document.getElementById('game-mode-title').innerText = "TIME ATTACK";
        state.timer = setInterval(timerTick, 1000);
        updateTopHUD();
    } else if (modeStr === 'boss') {
        state.activeQuestions = pool.slice(0, 15);
        state.bossHP = 10;
        state.playerHP = 5;
        document.getElementById('boss-ui').classList.remove('hidden');
        document.getElementById('game-mode-title').innerText = "BOSS BATTLE";
        updateBossHUD();
    }

    nav('game');
    renderQuestion();
}

function renderQuestion() {
    if(state.currentIndex >= state.activeQuestions.length) return finishSession("Tahniah! Misi Selesai.");

    const q = state.activeQuestions[state.currentIndex];
    document.getElementById('q-category').innerText = q.subcategory;
    document.getElementById('q-difficulty').innerText = q.difficulty.toUpperCase();
    document.getElementById('q-counter').innerText = `${state.currentIndex + 1} / ${state.mode === 'survival' || state.mode === 'timeattack' ? '∞' : state.activeQuestions.length}`;
    
    const isArabic = /[\u0600-\u06FF]/.test(q.question);
    const qEl = document.getElementById('q-text');
    qEl.className = isArabic ? "text-lg md:text-xl mb-6 arab-text leading-relaxed" : "text-lg md:text-xl mb-6 font-inter leading-relaxed";
    qEl.innerText = q.question;

    const optContainer = document.getElementById('q-options');
    optContainer.innerHTML = '';
    
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left p-4 rounded-lg bg-deepteal hover:bg-teal-800 border border-gray-600 transition-colors font-inter text-sm flex gap-3 items-center";
        if(/[\u0600-\u06FF]/.test(opt)) btn.classList.add('arab-text');
        
        btn.innerHTML = `<span class="bg-midnight px-3 py-1 rounded text-gold border border-gold border-opacity-30">${String.fromCharCode(65+idx)}</span> <span>${opt}</span>`;
        btn.onclick = () => handleAnswer(idx);
        optContainer.appendChild(btn);
    });
}

function handleAnswer(selectedIdx) {
    const q = state.activeQuestions[state.currentIndex];
    const isCorrect = selectedIdx === q.answer;
    gameData.totalQuestions++;

    if(isCorrect) {
        MawarAudio.play('correct');
        gameData.correctAnswers++;
        gameData.currentStreak++;
        if(gameData.currentStreak > gameData.bestStreak) gameData.bestStreak = gameData.currentStreak;
        
        let xpGain = { novice: 10, apprentice: 15, scholar: 20, master: 30 }[q.difficulty] || 10;
        addXP(xpGain);
        
        if(state.mode === 'survival') state.score++;
        if(state.mode === 'timeattack') { state.score++; state.timeLeft += 2; }
        if(state.mode === 'boss') { state.bossHP--; MawarAudio.play('bossHit'); screenShake(); }
        if(state.mode === 'campaign') {
            let wl = {'Fardhu Ain': 'fardhu_ain', 'Jurumiyyah': 'jurumiyyah', 'Tajwid':'tajwid'}[q.category];
            if(wl) gameData.worldProgress[wl]++;
        }
        showFeedback(true, q, xpGain);
    } else {
        MawarAudio.play('wrong');
        gameData.currentStreak = 0;
        screenShake();
        if(state.mode === 'survival') state.hp--;
        if(state.mode === 'boss') state.playerHP--;
        showFeedback(false, q, 0);
    }
    
    updateTopHUD();
    if(state.mode === 'boss') updateBossHUD();
    saveGame();
}

function addXP(amount) {
    gameData.xp += amount;
    let lvReq = gameData.level * 100;
    if(gameData.xp >= lvReq) {
        gameData.xp -= lvReq;
        gameData.level++;
        MawarAudio.play('win');
        alert(`Tahniah! Mawar telah naik ke Level ${gameData.level}`);
    }
    checkBadges();
}

function checkBadges() {
    if(gameData.totalQuestions >= 10 && !gameData.badges.includes('b1')) grantBadge('b1');
    if(gameData.survivalHighscore >= 10 && !gameData.badges.includes('b5')) grantBadge('b5');
    if(gameData.level >= 10 && !gameData.badges.includes('b6')) grantBadge('b6');
}

function grantBadge(id) {
    gameData.badges.push(id);
    saveGame();
}

function updateTopHUD() {
    document.getElementById('val-score').innerText = state.score;
    document.getElementById('val-hp').innerText = state.hp;
    document.getElementById('val-timer').innerText = state.timeLeft;
}

function updateBossHUD() {
    document.getElementById('boss-hp-bar').style.width = `${(state.bossHP / 10) * 100}%`;
    document.getElementById('player-hp-bar').style.width = `${(state.playerHP / 5) * 100}%`;
}

function timerTick() {
    state.timeLeft--;
    updateTopHUD();
    if(state.timeLeft <= 0) {
        clearInterval(state.timer);
        finishSession(`Masa Tamat! Skor anda: ${state.score}`);
    }
}

function showFeedback(isCorrect, q, xp) {
    const modal = document.getElementById('modal-feedback');
    const card = document.getElementById('feedback-card');
    
    document.getElementById('fb-icon').innerHTML = isCorrect ? '<i class="fas fa-check-circle text-emerald-400"></i>' : '<i class="fas fa-times-circle text-red-500"></i>';
    document.getElementById('fb-title').innerText = isCorrect ? 'TEPAT!' : 'SALAH';
    document.getElementById('fb-title').className = isCorrect ? 'font-cinzel text-2xl font-bold mb-2 text-emerald-400' : 'font-cinzel text-2xl font-bold mb-2 text-red-500';
    document.getElementById('fb-xp').innerText = isCorrect ? `+${xp} XP` : '';
    
    document.getElementById('fb-correct-answer').innerText = q.options[q.answer];
    document.getElementById('fb-explanation').innerText = q.explanation;
    document.getElementById('fb-ref').innerText = q.reference;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => card.classList.remove('scale-95'), 10);
}

function nextQuestion() {
    MawarAudio.play('click');
    document.getElementById('modal-feedback').classList.add('hidden');
    document.getElementById('modal-feedback').classList.remove('flex');
    document.getElementById('feedback-card').classList.add('scale-95');

    if(state.mode === 'survival' && state.hp <= 0) {
        if(state.score > gameData.survivalHighscore) gameData.survivalHighscore = state.score;
        return finishSession(`Tewas! Anda berjaya menjawab ${state.score} soalan.`);
    }
    if(state.mode === 'boss' && state.playerHP <= 0) return finishSession("Mawar Tewas di tangan Ketua Ilusi...");
    if(state.mode === 'boss' && state.bossHP <= 0) {
         const p = state.activeQuestions[0].category;
         if(p === 'Fardhu Ain') { gameData.worldProgress.jurumiyyah = 1; grantBadge('b2'); }
         if(p === 'Jurumiyyah') { gameData.worldProgress.tajwid = 1; grantBadge('b3'); }
         if(p === 'Tajwid') { grantBadge('b4'); }
         return finishSession("Kemenangan Cemerlang! Boss Tewas.");
    }

    state.currentIndex++;
    if(state.mode !== 'timeattack' || state.timeLeft > 0) renderQuestion();
}

function finishSession(msg) {
    clearInterval(state.timer);
    alert(msg);
    saveGame();
    if(state.mode === 'campaign') openMap();
    else nav('menu');
}

function confirmExit() {
    MawarAudio.play('click');
    if(confirm("Berhenti sekarang? Progress pusingan ini akan hilang.")) {
        clearInterval(state.timer);
        nav('menu');
    }
}

function renderProfile() {
    document.getElementById('stat-total').innerText = gameData.totalQuestions;
    let acc = gameData.totalQuestions === 0 ? 0 : Math.round((gameData.correctAnswers / gameData.totalQuestions)*100);
    document.getElementById('stat-acc').innerText = acc + "%";
    document.getElementById('stat-streak').innerText = gameData.bestStreak;
    document.getElementById('stat-score').innerText = gameData.survivalHighscore;

    const bc = document.getElementById('badges-container');
    bc.innerHTML = '';
    badgesData.forEach(b => {
        const unlocked = gameData.badges.includes(b.id);
        bc.innerHTML += `
            <div class="glass-panel p-2 flex flex-col items-center justify-center text-center ${unlocked ? 'border-gold' : 'opacity-40 grayscale border-gray-700'}">
                <i class="fas ${b.icon} text-2xl ${unlocked ? 'text-gold' : 'text-gray-500'} mb-2"></i>
                <span class="text-[10px] font-bold text-gray-200 leading-tight">${b.name}</span>
            </div>
        `;
    });
}

function screenShake() {
    const sc = document.getElementById('screen-game');
    sc.classList.add('shake');
    setTimeout(() => sc.classList.remove('shake'), 300);
}

function resetData() {
    if(confirm("AWAS! Ini akan memadam semua level, XP dan progress anda. Pasti?")) {
        localStorage.removeItem('mawarSave');
        location.reload();
    }
}
