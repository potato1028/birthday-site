// ==================== 공통 기능 ====================

// 원본 배열을 변경하지 않고 순서를 무작위로 섞습니다.
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 파일 경로가 잘못되었을 때 화면에서 확인할 수 있도록 이미지 생성.
function createMedia(src, className, altText) {
    const frame = document.createElement("div");
    frame.className = "media-frame";

    const image = document.createElement("img");
    image.className = className;
    image.alt = altText;
    image.src = src;

    image.addEventListener("error", () => {
        image.hidden = true;
        const warning = document.createElement("p");
        warning.className = "file-error";
        warning.textContent = `이미지를 찾지 못했습니다: ${src}`;
        frame.appendChild(warning);
    }, { once: true });

    frame.appendChild(image);
    return frame;
}

// 요소가 부드럽게 나타나도록 합니다. 애니메이션이 끝난 뒤 반환합니다.
async function reveal(element, duration = 650) {
    const animation = element.animate([
        { opacity: 0, transform: "translate(-50%, -48%) scale(.96)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }
    ], { duration, easing: "ease-out", fill: "forwards" });

    await animation.finished;
}

// 추후 TTS를 사용할 때 호출할 수 있는 공통 함수.
function speakText(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "ko-KR";
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
}

// ==================== event0: 진짜 미쿠 찾기 ====================
// 반환값: "correct" 또는 "wrong"
async function event0(titleText = "본인확인절\n차 : 다음 중\n진짜 미쿠를\n고르세요") {
    const scene = document.getElementById("scene");
    const wrapper = document.createElement("section");
    wrapper.className = "event0-wrapper";

    // 제목 중 '잠깐!!'과 '미쿠'에 다른 스타일 적용.
    const title = document.createElement("div");
    title.className = "event0-title";
    titleText.split(/(잠깐!!|미쿠)/g).forEach(part => {
        const span = document.createElement("span");
        span.textContent = part;
        if (part === "잠깐!!") span.className = "event0-title-alert";
        if (part === "미쿠") span.className = "event0-title-miku";
        title.appendChild(span);
    });

    const wrongImages = Array.from({ length: 8 }, (_, i) => `Resource/event0/${i}.png`);
    const correctImage = "Resource/event0/Miku.png";

    // 오답 8장 + 정답 1장 => 3×3 총 9장.
    const images = shuffleArray([
        ...shuffleArray(wrongImages).slice(0, 8),
        correctImage
    ]);

    const grid = document.createElement("div");
    grid.className = "event0-grid";
    let answered = false;

    // 사용자가 정답/오답 이미지를 클릭하기 전까지 완료되지 않는 Promise.
    let resolveAnswer;
    const answerPromise = new Promise(resolve => { resolveAnswer = resolve; });

    images.forEach((src, index) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "event0-cell";
        cell.setAttribute("aria-label", `${index + 1}번째 이미지 선택`);

        const img = document.createElement("img");
        img.className = "event0-image";
        img.src = src;
        img.alt = `선택 이미지 ${index + 1}`;
        cell.appendChild(img);
        grid.appendChild(cell);

        cell.addEventListener("click", () => {
            if (answered) return;
            answered = true;
            grid.querySelectorAll("button").forEach(button => { button.disabled = true; });
            // 정답 미쿠를 실제로 찾았을 때 효과음 1회 재생
            if (src === correctImage) audioManager.playSfx("mikuFound");
            resolveAnswer(src === correctImage ? "correct" : "wrong");
        });
    });

    wrapper.append(title, grid);
    scene.appendChild(wrapper);
    await reveal(wrapper, 700);
    return answerPromise;
}

// ==================== event1: GIF + 문단 + 버튼 2개 ====================
// scene2에서 서로 다른 설정으로 2번 재사용합니다.
// 반환값: "next" 또는 "wrong"
async function event1({ gif, text, nextLabel = "다음으로", wrongLabel = "틀린 선택" }) {
    const scene = document.getElementById("scene");
    const card = document.createElement("section");
    card.className = "dialog-card";

    card.appendChild(createMedia(gif, "dialog-gif", "질문 GIF"));

    const paragraph = document.createElement("p");
    paragraph.className = "dialog-text";
    paragraph.textContent = text;
    card.appendChild(paragraph);

    const buttons = document.createElement("div");
    buttons.className = "dialog-buttons";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "dialog-button primary";
    next.textContent = nextLabel;

    const wrong = document.createElement("button");
    wrong.type = "button";
    wrong.className = "dialog-button danger";
    wrong.textContent = wrongLabel;

    buttons.append(next, wrong);
    card.appendChild(buttons);
    scene.appendChild(card);

    let selected = false;
    let resolveChoice;
    const choicePromise = new Promise(resolve => { resolveChoice = resolve; });

    function choose(result) {
        if (selected) return;
        selected = true;
        next.disabled = true;
        wrong.disabled = true;
        resolveChoice(result);
    }
    next.addEventListener("click", () => choose("next"));
    wrong.addEventListener("click", () => choose("wrong"));

    await reveal(card);
    return choicePromise;
}

// ==================== event2: GIF + 문단 + 생년월일 입력 ====================
// 반환값: 제출한 생년월일 문자열 (예: "2000-01-01")
async function event2({ gif, text }) {
    const scene = document.getElementById("scene");
    const card = document.createElement("section");
    card.className = "dialog-card";

    card.appendChild(createMedia(gif, "dialog-gif", "생년월일 안내 GIF"));

    const paragraph = document.createElement("p");
    paragraph.className = "dialog-text";
    paragraph.textContent = text;
    card.appendChild(paragraph);

    const form = document.createElement("form");
    form.className = "birth-form";

    const label = document.createElement("label");
    label.className = "birth-label";
    label.htmlFor = "birthdate";
    label.textContent = "생년월일";

    const input = document.createElement("input");
    input.id = "birthdate";
    input.name = "birthdate";
    input.type = "date";
    input.className = "birth-input";
    input.required = true;

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "dialog-button primary";
    submit.textContent = "제출하기";

    form.append(label, input, submit);
    card.appendChild(form);
    scene.appendChild(card);

    const submitPromise = new Promise(resolve => {
        form.addEventListener("submit", event => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            submit.disabled = true;
            resolve(input.value);
        }, { once: true });
    });

    await reveal(card);
    return submitPromise;
}

// ==================== event99: 오답 경보 + 확대/축소 + 작은 사진 ====================
// event99Config에서 이미지 경로, 문단, 등장 시간, 움직임을 변경할 수 있습니다.
async function event99(config = {}) {
    const scene = document.getElementById("scene");
    const mainScreen = document.querySelector(".main-screen");

    // event99 시작과 동시에 화면 전체의 빨간 경보 효과 활성화.
    document.body.classList.add("event99-alarm");
    mainScreen.classList.add("event99-alarm");

    // 오답 문단은 event99 진입 순간부터 표시
    const message = document.createElement("p");
    message.className = "event99-message";
    message.textContent = config.message ?? "왜 들어옴????\n나가나가나간가나나가나가";
    scene.appendChild(message);

    const wrapper = document.createElement("section");
    wrapper.className = "event99-wrapper";

    // 1. 가장 먼저 표시되며 계속 재생되는 배경 GIF.
    const gif = document.createElement("img");
    gif.src = config.backgroundGif ?? "Resource/event99/wrong.gif";
    gif.alt = "오답 배경 GIF";
    gif.className = "event99-gif";
    wrapper.appendChild(gif);
    scene.appendChild(wrapper);

    // GIF를 읽은 뒤 약 3초 후 PNG 등장.
    await waitForMedia(gif);
    await waitMs(config.overlayDelayMs ?? 3000);

    // 2. 중앙 PNG + 작은 이미지들: 한 그룹이 함께 커지고 좌우로 흔들립니다.
    const overlayGroup = document.createElement("div");
    overlayGroup.className = "event99-overlay-group";
    overlayGroup.style.setProperty(
        "--event99-pulse-duration", `${config.pulseMs ?? 1800}ms`
    );

    const photo = document.createElement("img");
    photo.src = config.overlayImage ?? "Resource/event99/overlay.png";
    photo.alt = "흔들리며 확대·축소되는 오답 사진";
    photo.className = "event99-photo";
    overlayGroup.appendChild(photo);

    const miniImages = config.smallImages ?? [];
    miniImages.forEach((src, index) => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.className = "event99-mini";
        img.style.width = `${config.miniSizePercent ?? 22}%`;

        // PNG 중앙 근처에 작은 이미지들을 둥글게 배치합니다.
        const angle = -Math.PI / 2 + (index * Math.PI * 2 / miniImages.length);
        const radius = config.miniRadiusPercent ?? 19;
        img.style.left = `${50 + Math.cos(angle) * radius}%`;
        img.style.top = `${50 + Math.sin(angle) * radius}%`;
        img.addEventListener("error", () => img.remove(), { once: true });
        overlayGroup.appendChild(img);
    });

    // PNG 이미지가 준비된 후 그룹을 붙여 애니메이션을 정확히 0%에서 시작
    await waitForMedia(photo);
    wrapper.appendChild(overlayGroup);

    // 확대·축소 애니메이션의 50%(가장 큰 시점)에 효과음
    audioManager.watchAnimationPeak(overlayGroup, "event99-pulse-rock", "event99Peak");

    // PNG 등장 후 지정된 시간만큼 기다렸다가 버튼을 표시 (main.js)
    await waitMs(config.buttonDelayMs ?? 3000);
}


// ==================== event3: 사진과 문단 순차 연출 ====================
const waitMs = ms => new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));

// 느린 연결에서도 사진이 뜨기 전에 표시 시간이 끝나지 않게 기다립니다.
// 단, 파일이 없거나 응답이 오래 걸려도 전체 진행은 멈추지 않습니다.
function waitForMedia(image, timeoutMs = 5000) {
    if (!image || image.complete) return Promise.resolve();
    return new Promise(resolve => {
        const finish = () => {
            clearTimeout(timer);
            image.removeEventListener("load", finish);
            image.removeEventListener("error", finish);
            resolve();
        };
        const timer = setTimeout(finish, timeoutMs);
        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", finish, { once: true });
        if (image.complete) finish();
    });
}

// 이미지가 아니라 그룹 전체에 transform을 적용합니다.
function groupTransform({ rotation = 0, scale = 1, x = 0, y = 0 } = {}) {
    return `translate(-50%, -50%) translate(${x}%, ${y}%) rotate(${rotation}deg) scale(${scale})`;
}

async function animateGroup(group, frames, duration) {
    const animation = group.animate(frames, {
        duration: Math.max(0, duration), easing: "ease-in-out", fill: "forwards"
    });
    await animation.finished;
    // 마지막 모습을 인라인 스타일에 보존하고 쌓인 애니메이션 제거.
    Object.assign(group.style, frames[frames.length - 1]);
    animation.cancel();
}


// ==================== event3 등장 효과 ====================

function getEvent3EnterFrames(type, normal) {

    switch (type) {

        // 1. 투명도 증가
        case "fade":
            return [
                {
                    opacity: 0,
                    transform: normal
                },
                {
                    opacity: 1,
                    transform: normal
                }
            ];


        // 2. 왼쪽에서 오른쪽으로 등장
        case "slide":
            return [
                {
                    opacity: 0,
                    transform: groupTransform({
                        x: -110
                    })
                },
                {
                    opacity: 1,
                    transform: normal
                }
            ];


        // 3. 작게 등장 후 크게 튀어 오르기
        case "zoom":
            return [
                {
                    opacity: 0,
                    transform: groupTransform({
                        scale: 0.1
                    })
                },
                {
                    opacity: 1,
                    transform: groupTransform({
                        scale: 1.3
                    }),
                    offset: 0.7
                },
                {
                    opacity: 1,
                    transform: normal
                }
            ];


        // 4. 한 바퀴 회전하며 등장
        case "spin":
            return [
                {
                    opacity: 0,
                    transform: groupTransform({
                        rotation: -360,
                        scale: 0.5
                    })
                },
                {
                    opacity: 1,
                    transform: normal
                }
            ];


        // 5. 좌우로 뒤집히며 등장
        case "flip":
            return [
                {
                    opacity: 0,
                    transform:
                        "translate(-50%, -50%) rotateY(-90deg)"
                },
                {
                    opacity: 1,
                    transform: normal
                }
            ];


        // 지정하지 않았을 때 기본 등장 효과
        default:
            return [
                {
                    opacity: 0,
                    transform: groupTransform({
                        scale: 0.8
                    })
                },
                {
                    opacity: 1,
                    transform: normal
                }
            ];
    }
}

async function event3(items, outerConfig, innerConfig) {
    const scene = document.getElementById("scene");

    try {
        startOuterGifs(outerConfig);

        startInnerGifs(innerConfig);

        for (const [index, item] of items.entries()) {
            const group = document.createElement("div");
            group.className = "event3-group";
            group.style.opacity = "0";

            const media = createMedia(item.src, "event3-image", "생일 이미지");
            const paragraph = document.createElement("p");
            paragraph.className = "event3-text";
            paragraph.textContent = item.text ?? "";
            group.append(media, paragraph);
            scene.appendChild(group);

            await waitForMedia(media.querySelector("img"));

            // 사진 등장 전에 지정한 시간만큼 대기
            await waitMs(item.startDelayMs ?? 0);

            const normal = groupTransform();
            const end = groupTransform(item.motion);

            // 해당 중앙 GIF가 등장하기 시작하는 순간 효과음 재생
            audioManager.playSfx("event3Gif", index);

            // 1. 사진과 문단 등장 애니메이션
            const enterFrames = getEvent3EnterFrames(
                item.enterType,
                normal
            );

            await animateGroup(
                group,
                enterFrames,
                item.enterMs ?? 500
            );

            // 2. 유지 시간 동안 회전 / 크기 / 위치 변경 (사진 + 문단 함께)
            await animateGroup(group, [
                { opacity: 1, transform: normal },
                { opacity: 1, transform: end }
            ], item.holdMs ?? 3000);

            // 마지막 사진이라면 사라지지 않고 유지
            if (index === items.length - 1) {
                break;
            }

            // 3. 현재 상태 그대로 페이드아웃
            await animateGroup(group, [
                { opacity: 1, transform: end },
                { opacity: 0, transform: end }
            ], item.exitMs ?? 500);

            group.remove();
            await waitMs(item.gapMs ?? 0);
        }
    } catch(error) {
        stopOuterGifs();
        stopInnerGifs();
        throw error;
    }
}


// ==================== 바깥쪽 랜덤 GIF ====================

let outerSession = null;

const randomBetween = (min, max) =>
    min + Math.random() * (max - min);


// 베이지색 배경 바깥쪽 공간 계산
function getOuterAreas() {
    const layer = document.getElementById("outerGifLayer");
    const rect = document.querySelector(".main-screen")
        .getBoundingClientRect();

    const width = layer.clientWidth;
    const height = layer.clientHeight;

    const left = Math.max(0, Math.min(width, rect.left));
    const right = Math.max(0, Math.min(width, rect.right));
    const top = Math.max(0, Math.min(height, rect.top));
    const bottom = Math.max(0, Math.min(height, rect.bottom));

    return [
        // 왼쪽
        { x: 0, y: 0, w: left, h: height },

        // 오른쪽
        { x: right, y: 0, w: width - right, h: height },

        // 위쪽
        { x: left, y: 0, w: right - left, h: top },

        // 아래쪽
        { x: left, y: bottom, w: right - left, h: height - bottom }

    ].filter(area => Math.min(area.w, area.h) >= 32);
}


// GIF가 서로 겹치지 않도록 위치를 미리 생성
function makeOuterSlots(config, count) {
    const areas = getOuterAreas();

    const gap = Math.max(0, config.gap ?? 12);
    const maxSize = Math.max(32, Math.floor(config.maxSize ?? 220));
    const minSize = Math.min(
        maxSize,
        Math.max(32, Math.floor(config.minSize ?? 48))
    );

    function slotsAt(size) {
        const slots = [];

        for (const area of areas) {
            const cols = Math.floor(
                (area.w + gap) / (size + gap)
            );

            const rows = Math.floor(
                (area.h + gap) / (size + gap)
            );

            if (cols < 1 || rows < 1) continue;

            // 위치에 무작위 여백 추가
            const offsetX = randomBetween(
                0,
                Math.max(0, area.w - (cols * size + (cols - 1) * gap))
            );

            const offsetY = randomBetween(
                0,
                Math.max(0, area.h - (rows * size + (rows - 1) * gap))
            );

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    slots.push({
                        x: area.x + offsetX + col * (size + gap),
                        y: area.y + offsetY + row * (size + gap),
                        size: size
                    });
                }
            }
        }

        return slots;
    }

    // 공간이 부족하면 GIF 크기를 조금씩 줄임
    let slots = [];

    for (let size = maxSize; size >= minSize; size--) {
        slots = slotsAt(size);

        if (slots.length >= count) break;
    }

    // 등장 위치도 랜덤으로 섞음
    return shuffleArray(slots).slice(0, count);
}


// GIF 위치 및 크기 적용
function placeOuterGif(image, slot) {
    image.style.width = `${slot.size}px`;
    image.style.height = `${slot.size}px`;

    image.style.left = `${slot.x}px`;
    image.style.top = `${slot.y}px`;

    image.hidden = false;
}


// 바깥쪽 GIF 전체 초기화
function stopOuterGifs() {
    if (outerSession) {
        clearTimeout(outerSession.spawnTimer);

        window.removeEventListener(
            "resize",
            outerSession.onResize
        );

        outerSession = null;
    }

    document.getElementById("outerGifLayer")
        .replaceChildren();
}


// 바깥쪽 GIF 순차 생성
function startOuterGifs(config) {
    stopOuterGifs();

    if (!config || !config.files?.length) return;

    const layer = document.getElementById("outerGifLayer");

    // 중복 경로 제거 후 전체 목록을 랜덤하게 섞음
    const files = shuffleArray([...new Set(config.files)]);

    const session = {
        files,
        slots: makeOuterSlots(config, files.length),
        images: [],
        spawnTimer: null,
        onResize: null
    };

    outerSession = session;


    // 다음 GIF의 등장 시간 설정
    function scheduleNext() {
        if (outerSession !== session) return;
        if (session.spawnTimer !== null) return;

        // 모든 GIF가 등장했다면 종료
        if (session.images.length >= files.length) return;

        // 남은 공간이 없다면 종료
        if (session.images.length >= session.slots.length) return;

        const delay = randomBetween(
            config.minDelayMs ?? 600,
            config.maxDelayMs ?? 2000
        );

        session.spawnTimer = setTimeout(
            spawn,
            Math.max(50, delay)
        );
    }


    // GIF 하나 생성
    function spawn() {
        session.spawnTimer = null;

        if (outerSession !== session) return;

        const index = session.images.length;

        if (index >= files.length) return;
        if (index >= session.slots.length) return;

        const image = document.createElement("img");

        image.className = "outer-gif";
        image.alt = "";

        image.addEventListener("error", () => {
            image.style.visibility = "hidden";

            console.warn(
                "바깥 GIF를 찾지 못했습니다:",
                files[index]
            );
        }, { once: true });

        image.src = files[index];

        // 미리 계산한 위치 적용
        placeOuterGif(image, session.slots[index]);

        session.images.push(image);
        layer.appendChild(image);

        // 다음 GIF 생성 예약
        scheduleNext();
    }


    // 브라우저 크기가 변경되면 위치 재계산
    session.onResize = () => {
        session.slots = makeOuterSlots(config, files.length);

        session.images.forEach((image, index) => {
            if (session.slots[index]) {
                placeOuterGif(image, session.slots[index]);
            } else {
                image.hidden = true;
            }
        });

        scheduleNext();
    };

    window.addEventListener("resize", session.onResize);

    // 첫 번째 GIF 생성 예약
    scheduleNext();
}


// ==================== 안쪽에서 움직이는 GIF ====================

let innerAnimationId = null;
let innerGifLayer = null;


// 움직이는 GIF 생성
function startInnerGifs(config) {
    stopInnerGifs();

    const scene = document.getElementById("scene");

    // GIF 전용 영역 생성
    innerGifLayer = document.createElement("div");
    innerGifLayer.className = "inner-gif-layer";

    scene.prepend(innerGifLayer);

    const layer = innerGifLayer;
    const sprites = [];

    // GIF 생성
    config.files.forEach((src, index) => {
        const img = document.createElement("img");

        img.src = src;
        img.alt = "";
        img.className = "inner-gif";

        img.style.width = `${config.size}px`;
        img.style.height = `${config.size}px`;

        layer.appendChild(img);

        // ====================================
        // 자연스럽게 등장하는 페이드 인
        // ====================================

        const enterDelayMs = index * (config.staggerMs ?? 400);
        img.animate(
            [
                { opacity: 0 },
                { opacity: 1 }
            ],
            {
                duration: config.fadeInMs ?? 2000,

                // GIF마다 약간의 등장 간격
                delay: enterDelayMs,

                easing: "ease-out",

                // 등장 전에는 투명하게, 종료 후에는 표시 상태 유지
                fill: "both"
            }
        );

        // 각 GIF의 페이드 인이 시작될 때 개별 효과음 재생
        audioManager.scheduleSfx("event3Inner", enterDelayMs, index);

        // 랜덤 이동 방향
        const angle = Math.random() * Math.PI * 2;

        // 랜덤 이동 속도
        const speed = randomBetween(
            config.minSpeed,
            config.maxSpeed
        );

        const maxX = Math.max(
            0, layer.clientWidth - img.offsetWidth
        );

        const maxY = Math.max(
            0, layer.clientHeight - img.offsetHeight
        );

        sprites.push({
            element: img,

            // 최초 위치
            x: Math.random() * maxX,
            y: Math.random() * maxY,

            // 이동 속도
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,

            // 최초 회전 각도
            rotation: Math.random() * 360,

            // 회전 방향 (시계 / 반시계 랜덤)
            rotationDirection: Math.random() < 0.5 ? -1 : 1
        });
    });


    let previousTime = null;

    // 매 프레임마다 위치 업데이트
    function update(currentTime) {
        if (innerGifLayer !== layer) return;

        const deltaTime = previousTime === null
            ? 0
            : Math.min(
                (currentTime - previousTime) / 1000,
                0.05
            );

        previousTime = currentTime;

        sprites.forEach(sprite => {
            const maxX = Math.max(
                0,
                layer.clientWidth - sprite.element.offsetWidth
            );

            const maxY = Math.max(
                0,
                layer.clientHeight - sprite.element.offsetHeight
            );

            // 위치 이동
            sprite.x += sprite.vx * deltaTime;
            sprite.y += sprite.vy * deltaTime;


            // 왼쪽 테두리 충돌
            if (sprite.x <= 0) {
                sprite.x = 0;
                sprite.vx = Math.abs(sprite.vx);
            }

            // 오른쪽 테두리 충돌
            else if (sprite.x >= maxX) {
                sprite.x = maxX;
                sprite.vx = -Math.abs(sprite.vx);
            }


            // 위쪽 테두리 충돌
            if (sprite.y <= 0) {
                sprite.y = 0;
                sprite.vy = Math.abs(sprite.vy);
            }

            // 아래쪽 테두리 충돌
            else if (sprite.y >= maxY) {
                sprite.y = maxY;
                sprite.vy = -Math.abs(sprite.vy);
            }


            // 실제 이미지 위치 적용
            
            // 실제 이미지 위치 적용
            sprite.element.style.left = `${sprite.x}px`;
            sprite.element.style.top = `${sprite.y}px`;

            // 회전 각도 업데이트
            sprite.rotation +=
                config.rotationSpeed *
                deltaTime *
                sprite.rotationDirection;

            // 회전 적용
            sprite.element.style.transform =
                `rotate(${sprite.rotation}deg)`;

        });

        innerAnimationId = requestAnimationFrame(update);
    }

    innerAnimationId = requestAnimationFrame(update);
}


// 움직이는 GIF 정지 및 제거
function stopInnerGifs() {
    if (innerAnimationId !== null) {
        cancelAnimationFrame(innerAnimationId);
        innerAnimationId = null;
    }

    if (innerGifLayer) {
        innerGifLayer.remove();
        innerGifLayer = null;
    }
}
