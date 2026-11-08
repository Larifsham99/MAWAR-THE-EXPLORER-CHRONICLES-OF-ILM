// assets/js/audio.js
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

window.MawarAudio = {
    enabled: true,
    playTone: function(freq, type, duration, vol=0.1) {
        if(!this.enabled) return;
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },
    play: function(sound) {
        if (!this.enabled) return;
        switch(sound) {
            case 'click': this.playTone(600, 'sine', 0.1, 0.05); break;
            case 'correct': 
                this.playTone(523.25, 'sine', 0.1); 
                setTimeout(() => this.playTone(659.25, 'sine', 0.2), 100); 
                break;
            case 'wrong': this.playTone(150, 'sawtooth', 0.3, 0.1); break;
            case 'bossHit': this.playTone(100, 'square', 0.2, 0.2); break;
            case 'win': 
                [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.2), i*150)); 
                break;
        }
    }
};
