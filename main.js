// ==================== 화면 관리 ====================

const nextButton = document.getElementById("nextButton");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const sceneElement = document.getElementById("scene");
const event3AdLink = document.getElementById("event3AdLink");
let currentScene = "start";

// 수정 포인트: 두 질문 화면과 마지막 생년월일 화면의 내용을 여기서 변경합니다.
const scene2Content = {
    first: {
        gif: "Resource/event1/1.gif",
        text: "잠깐.\n당신 생일이 오늘이 맞습니까...?",
        nextLabel: "네!!",
        wrongLabel: "아닌데요?"
    },
    second: {
        gif: "Resource/event1/2.gif",
        text: "정말인가요......?",
        nextLabel: "정말이예요!",
        wrongLabel: "뭘 계속 물어봐"
    },
    birthday: {
        gif: "Resource/event1/3.gif",
        text: "그렇다면 생년월일을 입력해보세요"
    }
};

// ==================== scene3: 수정할 연출 설정 ====================
// 시간은 ms 단위 (1000 = 1초). 배열 순서대로 실행됩니다.
// src는 PNG, JPG, GIF 모두 가능. text에서 \n은 줄바꿈입니다.
// motion은 등장 후 유지 시간 동안 적용되는 효과: rotation(도), scale(배율), x/y(그룹 크기 대비 %).

const scene3Content = [
    {
        src: "Resource/event3/1.gif",
        text: "당신의 생일을 축!하!합!니!다!",

        // 첫 번째 사진 등장 전 3초 대기
        startDelayMs: 3000,

        // 페이드 인
        enterType: "fade",
        enterMs: 2000,

        holdMs: 3000,
        exitMs: 500,

        motion: {
            rotation: 0,
            scale: 1,
            x: 0,
            y: 0
        }
    },
    {
        src: "Resource/event3/2.gif",
        text: "오늘 만큼은 남 눈치 보지 않고 뇌 빠지듯이 노세요",

        // 왼쪽에서 등장
        enterType: "slide",
        enterMs: 1000,

        holdMs: 2500,
        exitMs: 500,

        motion: {
            rotation: 12,
            scale: 1.1,
            x: 0,
            y: 0
        }
    },
    {
        src: "Resource/event3/3.gif",
        text: "저희가 안 세월이 벌써 9년이 넘어가네요....(중1 ~ NOW)",

        // 튀어 오르듯 확대
        enterType: "zoom",
        enterMs: 1200,

        holdMs: 3500,
        exitMs: 500,

        motion: {
            rotation: -12,
            scale: 0.9,
            x: 0,
            y: 0
        }
    },
    {
        src: "Resource/event3/4.gif",
        text: "왜 아직도 친구라는 나쁜말은 ㄴㄴㄴ",

        // 회전하면서 등장
        enterType: "spin",
        enterMs: 1500,

        holdMs: 2500,
        exitMs: 500,

        motion: {
            rotation: 0,
            scale: 1.1,
            x: 5,
            y: -5
        }
    },
    {
        src: "Resource/event3/5.gif",
        text: "암튼 생일 축하해요,\n너가 짱이야",

        // 좌우로 뒤집히며 등장
        enterType: "flip",
        enterMs: 1200,

        holdMs: 3500,
        exitMs: 500,

        motion: {
            rotation: 0,
            scale: 1,
            x: 0,
            y: 0
        }
    },
    {
        src: "Resource/event3/6.gif",
        text: "여기서 우셔야 합니다",

        enterType: "fade",
        enterMs: 1200,

        holdMs: 3000,
        exitMs: 500,

        motion: {
            rotation: 0,
            scale: 1,
            x: 0,
            y: 0
        }
    }
];


// 베이지색 화면 밖의 GIF. 목록에 추가하거나 삭제해도 됩니다.

const outerGifConfig = {
    files: [
        "Resource/event3/outer/1.gif",
        "Resource/event3/outer/2.gif",
        "Resource/event3/outer/3.gif",
        "Resource/event3/outer/4.gif",
        "Resource/event3/outer/5.gif",
        "Resource/event3/outer/6.gif"
    ],

    minDelayMs: 600,
    maxDelayMs: 2000,

    minSize: 48,
    maxSize: 220,

    gap: 12
};


const innerGifConfig = {
    files: [
        "Resource/event3/inner/1.gif",
        "Resource/event3/inner/2.gif"
    ],

    // GIF 크기
    size: 130,

    // 이동 속도
    minSpeed: 90,
    maxSpeed: 180,

    // 회전 속도
    rotationSpeed: 120,

    // 새롭게 추가할 설정
    fadeInMs: 2000,  // 서서히 등장하는 시간 (2초)
    staggerMs: 400   // GIF 사이의 등장 간격 (0.4초)
};



// ==================== scene99: 오답 연출 설정 ====================
// 필요한 작은 이미지를 Resource/event99/small 폴더에 추가한 뒤 경로를 입력하세요.
const event99Config = {
    backgroundGif: "Resource/event99/wrong.gif",
    overlayImage: "Resource/event99/overlay.png",
    smallImages: [
        "Resource/event99/small/1.png",
        "Resource/event99/small/2.png",
        "Resource/event99/small/3.png",
        "Resource/event99/small/4.png"
    ],
    message: "왜 들어옴????\n나가나가나간가나나가나가",
    returnLabel: "죄송해요 ㅠㅠㅠㅠㅠ", // event99 버튼에만 표시

    overlayDelayMs: 3000,  // wrong.gif 표시 후 overlay.png까지 약 3초
    buttonDelayMs: 3000,   // overlay.png 표시 후 버튼까지 약 3초
    pulseMs: 900,          // PNG 확대·축소·흔들림 한 주기의 길이 (빠르게)
    miniSizePercent: 22,   // 작은 이미지 너비 (%: overlayGroup 기준)
    miniRadiusPercent: 19  // PNG 중앙에서 작은 이미지가 떨어진 거리 (%)
};


// 현재 이미지/GIF/버튼/음성을 정리합니다.
function resetScene() {
    // 장면이 바뀌면 이전 BGM과 예약된 효과음/반복 감시를 정리
    audioManager.stopScene();
    stopOuterGifs();
    stopInnerGifs();

    // 오답 장면을 떠날 때 경보 색상과 깜빡임을 즉시 해제합니다.
    document.body.classList.remove("event99-alarm");
    document.querySelector(".main-screen").classList.remove("event99-alarm");

    const scene = document.getElementById("scene");
    scene.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    scene.replaceChildren();
    // 다른 장면으로 이동하면 event3 전용 광고 이미지 버튼을 숨깁니다.
    event3AdLink.hidden = true;
    nextButton.hidden = true;
    nextButton.disabled = false;

    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

// 공통 버튼 표시 (scene99, scene3에서 사용)
function showButton(text) {
    nextButton.textContent = text;
    nextButton.hidden = false;
}

// ==================== 시작 화면 (아직 event0 실행 전) ====================
function showStartScreen() {
    currentScene = "start";
    resetScene();
    audioManager.stopAll();
    sceneElement.hidden = true;
    startScreen.hidden = false;
    startButton.disabled = false;
}

// ==================== scene0: 미쿠 찾기 ====================
async function scene0() {
    currentScene = 0;
    resetScene();
    startScreen.hidden = true;
    sceneElement.hidden = false;

    // 처음 버튼을 누르고 미쿠 찾기 화면에 진입하는 효과음
    audioManager.playSfx("enterMiku");

    // 일부러 어색하게 줄바꿈을 넣은 제목
    const answer = await event0(
        "본인확인절\n차 : 다음 중\n진짜 미쿠를\n고르세요"
    );

    if (answer === "correct") {
        await scene2();
    } else {
        await scene99();
    }
}

// ==================== scene2: 3단계 질문 ====================
async function scene2() {
    currentScene = 2;
    resetScene();

    // 1단계: 첫 번째 GIF + 문단 + 버튼 2개
    // event1()이 화면에 GIF를 붙인 직후, 첫 번째 효과음을 재생합니다.
    const firstAnswerPromise = event1(scene2Content.first);
    audioManager.playSfx("scene2Gif", 0);
    const firstAnswer = await firstAnswerPromise;
    if (firstAnswer === "wrong") {
        await scene99();
        return;
    }

    // 2단계: 두 번째 GIF + 문단 + 버튼 2개
    resetScene();
    const secondAnswerPromise = event1(scene2Content.second);
    audioManager.playSfx("scene2Gif", 1);
    const secondAnswer = await secondAnswerPromise;
    if (secondAnswer === "wrong") {
        await scene99();
        return;
    }

    // 3단계: 세 번째 GIF + 생년월일 + 제출하기
    resetScene();
    const birthdatePromise = event2(scene2Content.birthday);
    audioManager.playSfx("scene2Gif", 2);
    const birthdate = await birthdatePromise;

    const correctBirthdate = "2005-11-29";

    if (birthdate === correctBirthdate) {
        await scene3();
    }
    else {
        await scene99();
    }
}

// ==================== scene3: 생일 연출 ====================
async function scene3() {
    currentScene = 3;
    resetScene();

    // event3 진입과 동시에 BGM 시작
    audioManager.playBgm("event3");
    await event3(scene3Content, outerGifConfig, innerGifConfig);

    // 다섯 번째 GIF의 등장 + 유지 연출까지 끝난 후에만 표시합니다.
    if (currentScene !== 3) return;
    showButton("처음으로 돌아가기");
    event3AdLink.hidden = false;
}

// ==================== scene99: 오답 ====================
async function scene99() {
    currentScene = 99;
    resetScene();
    // event99 진입 즉시 BGM + 효과음 동시 재생
    audioManager.playBgm("event99");
    audioManager.playSfx("event99Enter");
    await event99(event99Config);
    showButton(event99Config.returnLabel ?? "처음으로 돌아가기");
}

// 시작하기 버튼: 이 버튼을 클릭할 때만 event0이 실행됩니다.
startButton.addEventListener("click", () => {
    startButton.disabled = true;
    scene0().catch(console.error);
});

// 오답/완료 화면에서는 처음의 베이지색 시작 화면으로 돌아갑니다.
nextButton.addEventListener("click", () => {
    if (currentScene !== 99 && currentScene !== 3) return;
    nextButton.disabled = true;
    showStartScreen();
});

// 이미지 버튼 클릭 시 가능한 경우 새 팝업 창을 엽니다.
// 팝업이 차단된 브라우저에서는 <a target="_blank">의 기본 새 탭 동작으로 대체됩니다.
event3AdLink.addEventListener("click", event => {
    const popup = window.open(event3AdLink.href, "_blank", "popup=yes,width=720,height=840");
    if (popup) {
        popup.opener = null;
        event.preventDefault();
    }
});

// 웹사이트 접속 직후에는 이벤트를 자동 실행하지 않습니다.
showStartScreen();
