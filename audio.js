// ============================================================
// audio.js — 효과음 / BGM 관리 (이 파일에서 소리 경로를 변경하세요)
// ============================================================
// 아직 파일이 준비되지 않았다면 src: "" 로 두세요. 소리가 재생되지 않습니다.
// src에 Resource/audio/... 경로를 입력하면 해당 장면에서 자동 재생됩니다.
// 각 배열의 순서는 main.js에 있는 GIF 배열 순서와 동일합니다.
// volume: 0.0 ~ 1.0 / masterVolume: 전체 볼륨
// restart: true → 이전 효과음이 끝나지 않았어도 새 소리로 재시작

const audioConfig = {
    masterVolume: 1.0,

    bgm: {
        // event3 진입 즉시 재생 / 장면을 떠나면 자동 정지
        event3: { src: "Resource/audio/bgm/happyBirthday.mp3", volume: 0.8, loop: true },

        // event99 진입 즉시 재생 / 장면을 떠나면 자동 정지
        event99: { src: "Resource/audio/bgm/punch.mp3", volume: 0.8, loop: true }
    },

    sfx: {
        // 시작 버튼을 누르고 미쿠 찾기 화면으로 이동할 때
        enterMiku: { src: "Resource/audio/sfx/ack.mp3", volume: 0.5 },

        // 정답 미쿠를 클릭했을 때 (오답 클릭에는 재생하지 않음)
        mikuFound: { src: "", volume: 0.8 },

        // scene2의 3개 GIF: 첫 번째 질문 → 두 번째 질문 → 생년월일 입력
        // src에 원하는 MP3/WAV 경로를 입력하세요. 빈 문자열이면 소리 없이 진행됩니다.
        scene2Gif: [
            { src: "Resource/audio/sfx/fahh.mp3", volume: 0.8 },  // Resource/event1/1.gif
            { src: "Resource/audio/sfx/hmm.mp3", volume: 0.8 },  // Resource/event1/2.gif
            { src: "Resource/audio/sfx/um.mp3", volume: 0.8 }   // Resource/event1/3.gif
        ],

        // event3 내부에서 움직이는 GIF (innerGifConfig.files 순서)
        // 첫 번째, 두 번째 GIF가 페이드 인을 시작할 때 각각 재생
        event3Inner: [
            { src: "Resource/audio/sfx/bry.mp3", volume: 0.8 },  // inner/1.gif
            { src: "Resource/audio/sfx/bry.mp3", volume: 0.8 }   // inner/2.gif
        ],

        // event3 중앙 GIF (scene3Content 배열 순서)
        // 페이드/슬라이드 등의 등장 애니메이션이 시작될 때 각각 재생
        event3Gif: [
            { src: "Resource/audio/sfx/yeppi.mp3", volume: 0.8 },  // event3/1.gif
            { src: "Resource/audio/sfx/brain.mp3", volume: 0.8 },  // event3/2.gif
            { src: "Resource/audio/sfx/shock.mp3", volume: 0.8 },  // event3/3.gif
            { src: "Resource/audio/sfx/slap.mp3", volume: 0.8 },  // event3/4.gif
            { src: "Resource/audio/sfx/ok.mp3", volume: 5.0 },  // event3/5.gif
            { src: "Resource/audio/sfx/cry.mp3", volume: 0.8 }   
        ],

        // event99 진입 즉시 BGM과 함께 효과음 재생
        event99Enter: { src: "Resource/audio/sfx/omg.mp3", volume: 0.9 },

        // overlay.png가 가장 커질 때마다 효과음 재생
        // 짧은 효과음을 추천. 이전 재생과 겹치지 않도록 restart 사용.
        event99Peak: { src: "Resource/audio/sfx/punch.mp3", volume: 0.8, restart: true }
    }
};

// ============================================================
// 재생 엔진 — 아래 코드는 원칙적으로 수정하지 않아도 됩니다.
// ============================================================
const audioManager = (() => {
    let bgmAudio = null;
    const activeSfx = new Set();
    const lastSfxByKey = new Map();
    const pendingTimers = new Set();
    const activeWatchers = new Set();

    const clampVolume = value =>
        Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 1));

    function soundEntry(kind, name, index = 0) {
        const source = audioConfig[kind]?.[name];
        const chosen = Array.isArray(source) ? source[index] : source;
        if (typeof chosen === "string") return { src: chosen };
        return chosen && typeof chosen === "object" ? chosen : null;
    }

    function volumeOf(entry) {
        return clampVolume(entry.volume ?? 1) * clampVolume(audioConfig.masterVolume);
    }

    function playSafely(audio, label) {
        audio.play().catch(error => {
            // 자동 재생 정책, 경로 오류, 지원하지 않는 코덱 등
            console.warn(`[audio.js] '${label}' 재생 실패:`, error);
        });
    }

    function stopAudio(audio) {
        if (!audio) return;
        audio.pause();
        try { audio.currentTime = 0; } catch (_) { /* 일부 로드 전 파일에서는 무시 */ }
    }

    function stopBgm() {
        stopAudio(bgmAudio);
        bgmAudio = null;
    }

    function playBgm(name) {
        stopBgm();
        const entry = soundEntry("bgm", name);
        if (!entry?.src?.trim()) return;

        const audio = new Audio(entry.src);
        audio.volume = volumeOf(entry);
        audio.loop = entry.loop ?? true;
        audio.preload = "auto";
        audio.addEventListener("error", () => {
            console.warn(`[audio.js] BGM 파일을 읽을 수 없습니다: ${entry.src}`);
        }, { once: true });

        bgmAudio = audio;
        playSafely(audio, `BGM:${name}`);
    }

    function playSfx(name, index = 0) {
        const entry = soundEntry("sfx", name, index);
        if (!entry?.src?.trim()) return;
        const key = `${name}:${index}`;

        if (entry.restart) {
            const last = lastSfxByKey.get(key);
            if (last) {
                stopAudio(last);
                activeSfx.delete(last);
            }
        }

        const audio = new Audio(entry.src);
        audio.volume = volumeOf(entry);
        audio.preload = "auto";
        const cleanup = () => {
            activeSfx.delete(audio);
            if (lastSfxByKey.get(key) === audio) lastSfxByKey.delete(key);
        };
        audio.addEventListener("ended", cleanup, { once: true });
        audio.addEventListener("error", () => {
            console.warn(`[audio.js] 효과음 파일을 읽을 수 없습니다: ${entry.src}`);
            cleanup();
        }, { once: true });

        activeSfx.add(audio);
        lastSfxByKey.set(key, audio);
        playSafely(audio, `SFX:${name}[${index}]`);
    }

    // fade-in 시작 시점 등 원하는 지연 시간 후 효과음을 재생합니다.
    function scheduleSfx(name, delayMs = 0, index = 0) {
        if (!soundEntry("sfx", name, index)?.src?.trim()) return;
        const timer = setTimeout(() => {
            pendingTimers.delete(timer);
            playSfx(name, index);
        }, Math.max(0, delayMs));
        pendingTimers.add(timer);
    }

    // 실제 CSS 애니메이션의 진행률을 읽어 50%(최대 크기)마다 재생.
    // 단순 setInterval보다 확대 타이밍에 밀착됩니다.
    function watchAnimationPeak(element, animationName, sfxName) {
        if (!soundEntry("sfx", sfxName)?.src?.trim()) return;
        // 접근성 옵션으로 CSS 애니메이션이 꺼진 경우 효과음도 반복하지 않음
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

        let requestId = null;
        let stopped = false;
        let animation = null;
        let lastIteration = -1;

        function stop() {
            if (stopped) return;
            stopped = true;
            if (requestId !== null) cancelAnimationFrame(requestId);
            activeWatchers.delete(stop);
        }
        function tick() {
            if (stopped || !element.isConnected) { stop(); return; }
            if (!animation) {
                animation = element.getAnimations().find(item =>
                    item.animationName === animationName
                ) ?? null;
            }
            if (animation?.effect) {
                const timing = animation.effect.getComputedTiming();
                const iteration = timing.currentIteration;
                const progress = timing.progress;
                if (typeof iteration === "number" &&
                    typeof progress === "number" &&
                    progress >= 0.5 && iteration !== lastIteration) {
                    lastIteration = iteration;
                    playSfx(sfxName);
                }
            }
            requestId = requestAnimationFrame(tick);
        }
        activeWatchers.add(stop);
        requestId = requestAnimationFrame(tick);
        return stop;
    }

    // 장면을 나갈 때 BGM/지연 예약/반복 감시는 멈추되,
    // 버튼 클릭 등 짧은 효과음은 자연스럽게 끝나도록 둡니다.
    function stopScene() {
        stopBgm();
        pendingTimers.forEach(clearTimeout);
        pendingTimers.clear();
        [...activeWatchers].forEach(stop => stop());
    }

    // 처음 화면으로 돌아갈 때는 모든 소리를 즉시 정리합니다.
    function stopAll() {
        stopScene();
        activeSfx.forEach(stopAudio);
        activeSfx.clear();
        lastSfxByKey.clear();
    }

    return { playBgm, playSfx, scheduleSfx, watchAnimationPeak, stopScene, stopAll };
})();
