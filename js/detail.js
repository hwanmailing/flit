// Detail 페이지 JavaScript
let isGameStarted = false;
let isGamePaused = false;
let isFullscreen = false;
let gameResolution = ""; // HTML에서 동적으로 설정됨
let gameWidth = 0; // 게임 해상도 너비
let gameHeight = 0; // 게임 해상도 높이
let gameFrame = null; // iframe 참조 저장

// 게임 해상도 파싱 함수
function parseGameResolution(resolution) {
    if (!resolution) return { width: 0, height: 0 };
    
    const parts = resolution.split('x');
    if (parts.length !== 2) return { width: 0, height: 0 };
    
    return {
        width: parseInt(parts[0], 10) || 0,
        height: parseInt(parts[1], 10) || 0
    };
}

// 모바일 크기인지 확인하는 함수
function isMobileSize() {
    return window.innerWidth <= 768;
}

// DOM 생성 함수
function createPlayerContainer() {
    const playerContainer = document.getElementById('playerContainer');
    
    // HTML data 속성에서 템플릿 데이터 가져오기
    const gameData = {
        thumbnail: playerContainer.getAttribute('data-thumbnail'),
        name: playerContainer.getAttribute('data-name'),
        gameUrl: playerContainer.getAttribute('data-game-url'),
        resolution: playerContainer.getAttribute('data-resolution')
    };
    
    // 전역 변수 설정
    gameResolution = gameData.resolution;
    
    // 해상도 파싱
    const resolution = parseGameResolution(gameData.resolution);
    gameWidth = resolution.width;
    gameHeight = resolution.height;
    
    playerContainer.innerHTML = `
        <div class="player-with-controls">
            <div class="player">
                <div class="thumbnail" id="thumbnail">
                    <img id="thumbnailImg" alt="">
                    <button class="playButton" id="playButton"></button>
                </div>
                <iframe id="gameFrame"></iframe>
            </div>
        </div>
         <div class="controls" id="controls">
             <div class="controls-top">
                 <button class="control-button narrow" id="normalBtn" title="Toggle View"></button>
             </div>
             <div class="controls-bottom">
                 <button class="control-button fullscreen" id="fullscreenBtn" title="Full Screen"></button>
             </div>
         </div>
    `;
    
    // 동적으로 값 설정
    document.getElementById('thumbnailImg').src = gameData.thumbnail;
    document.getElementById('thumbnailImg').alt = gameData.name;
    gameFrame = document.getElementById('gameFrame');
    
    // 게임 URL을 저장해두고, play 버튼 클릭 시 로드
    gameFrame.dataset.gameUrl = gameData.gameUrl;
    
    
    // 이벤트 리스너 추가
    document.getElementById('playButton').addEventListener('click', startGame);
    document.getElementById('normalBtn').addEventListener('click', toggleViewMode);
    document.getElementById('fullscreenBtn').addEventListener('click', () => setViewMode('fullscreen'));
    gameFrame.addEventListener('load', onGameLoad);
    
    // iframe 키보드 이벤트 전달 핸들러 설정
    setupKeyboardEventHandlers();
}

function startGame() {
    //console.log('startGame called');
    if (isGameStarted) return;
    
    const thumbnail = document.getElementById('thumbnail');
    const gameFrame = document.getElementById('gameFrame');
    const controls = document.getElementById('controls');
    
    //console.log('Elements found:', { thumbnail, gameFrame, controls });
    
    // 썸네일 숨기기
    thumbnail.classList.add('hidden');
    
    // 게임 프레임 표시
    gameFrame.classList.add('active');
    
    gameFrame.src = gameFrame.dataset.gameUrl;
    // 게임 로드 (iframe이 정착한 후)
    // if (gameFrame.dataset.gameUrl && !gameFrame.src) {
    //     setTimeout(() => {
            
    //     }, 100); // 짧은 지연으로 iframe 정착 대기
    // }
    
    // iframe 로드 완료 후 크기 조정
    // gameFrame.onload = function() {
    //     // iframe 내부가 완전히 로드된 후 크기 조정
    //     setTimeout(() => {
    //         resizeIframe();
    //     }, 100);
    // };
    
    // 보안 스크립트는 이미 게임의 index.html에 주입되어 있음
    //console.log('Security script already injected into game during build');
    
    // 컨트롤은 항상 표시됨
    
    
    isGameStarted = true;
}

function onGameLoad() {
    // 게임 로드 완료
}

// iframe 키보드 이벤트 전달 핸들러 설정
function setupKeyboardEventHandlers() {
    /* 
    부모의 키보드 이벤트를 iframe 게임으로 전달 
    iframe에 focus가 없어도 키 입력을 받을 수 있다.
    */
    // 부모 문서에서 키보드 이벤트를 캐치해서 iframe으로 전달
    window.addEventListener('keydown', (e) => {
        if (isGameStarted && gameFrame && gameFrame.contentWindow) {
            try {
                gameFrame.contentWindow.postMessage({ 
                    type: 'keydown', 
                    key: e.key, 
                    code: e.code,
                    // keyCode: e.keyCode,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey
                }, '*');
            } catch (error) {
                console.log('Cannot send keydown message to iframe:', error);
            }
        }
        
        // 키보드 이벤트가 발생할 때 iframe에 포커스 설정
        if (isGameStarted && gameFrame) {
            gameFrame.focus();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (isGameStarted && gameFrame && gameFrame.contentWindow) {
            try {
                gameFrame.contentWindow.postMessage({ 
                    type: 'keyup', 
                    key: e.key, 
                    code: e.code,
                    // keyCode: e.keyCode,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey
                }, '*');
            } catch (error) {
                console.log('Cannot send keyup message to iframe:', error);
            }
        }
    });
}

// 현재 뷰 모드 상태
let currentViewMode = 'normal';

// 뷰 모드 토글 함수
function toggleViewMode() {
    if (currentViewMode === 'normal') {
        setViewMode('landscape');
    } else {
        setViewMode('normal');
    }
}

function setViewMode(mode) {
    const gameInfo = document.querySelector('.game-info');
    const container = document.querySelector('.container');
    const player = document.querySelector('.player');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const normalBtn = document.getElementById('normalBtn');
    
    // 현재 뷰 모드 업데이트
    currentViewMode = mode;
    
    switch (mode) {
        case 'normal':
            // 일반 화면 모드 (기본)
            gameInfo.style.display = 'block';
            container.style.flexDirection = 'row';
            normalBtn.classList.remove('narrow');
            normalBtn.classList.add('wide');
            break;
            
        case 'landscape':
            // 모바일에서는 wide 모드 비활성화
            if (isMobileSize()) {
                setViewMode('normal');
                return;
            }
            
            // 가로 화면 모드 (정보 영역 숨김)
            gameInfo.style.display = 'none';
            container.style.flexDirection = 'row';
            normalBtn.classList.remove('wide');
            normalBtn.classList.add('narrow');
            break;
            
        case 'fullscreen':
            if (!isFullscreen) {
                // 전체화면 진입
                if (player.requestFullscreen) {
                    player.requestFullscreen();
                } else if (player.webkitRequestFullscreen) {
                    player.webkitRequestFullscreen();
                } else if (player.msRequestFullscreen) {
                    player.msRequestFullscreen();
                }
                isFullscreen = true;
                fullscreenBtn.title = '전체화면 종료';
            } else {
                // 전체화면 종료
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                isFullscreen = false;
                fullscreenBtn.title = 'Full Screen';
                // 전체화면 종료 시 기본 모드로 복원
                //setViewMode('normal');
                return;
            }
            break;
            
        default:
            console.log('Unknown view mode:', mode);
            return;
    }
    
    // 게임이 시작된 상태라면 크기 재조정을 위해 게임에 메시지 전송
    if (isGameStarted && gameFrame && gameFrame.contentWindow) {
        setTimeout(() => {
            try {
                gameFrame.contentWindow.postMessage({ 
                    type: 'resize', 
                    width: gameFrame.offsetWidth,
                    height: gameFrame.offsetHeight
                }, '*');
            } catch (error) {
                console.log('Cannot send resize message to iframe:', error);
            }
        }, 100);
    }
}


// 전체화면 상태 변경 감지
document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement) {
        isFullscreen = false;
        document.getElementById('fullscreenBtn').style.display = 'flex';
        document.getElementById('minimizeBtn').style.display = 'none';
    }
});

// 브라우저 크기 변경 감지 함수
function browserResized(func_mobile, func_tablet, func_pc) {
    // 미디어 쿼리 정의
    const mobileMediaQuery = window.matchMedia("(max-width: 768px)"); // 768px 이하
    const tabletMediaQuery = window.matchMedia("(min-width: 769px) and (max-width: 1024px)"); // 769px 이상 1024px 이하
    const pcMediaQuery = window.matchMedia("(min-width: 1025px)"); // 1025px 이상

    // 상태에 따라 적절한 함수를 호출하는 함수
    function checkMedia() {
        if (mobileMediaQuery.matches) {
            func_mobile();
        } else if (tabletMediaQuery.matches) {
            func_tablet();
        } else if (pcMediaQuery.matches) {
            func_pc();
        }
    }

    // 초기 상태 체크 및 함수 호출
    checkMedia();

    // 미디어 쿼리 상태 변경 시 호출
    function handleChange() {
        checkMedia();
    }

    // 각 미디어 쿼리의 상태 변경 시 handleChange를 호출하도록 설정
    mobileMediaQuery.addEventListener('change', handleChange);
    tabletMediaQuery.addEventListener('change', handleChange);
    pcMediaQuery.addEventListener('change', handleChange);
}

// Recently Visited에 게임 추가
function addToRecentlyVisited() {
    const playerContainer = document.getElementById('playerContainer');
    if (!playerContainer) return;
    
    const gameData = {
        name: playerContainer.getAttribute('data-name'),
        thumbnail: playerContainer.getAttribute('data-thumbnail'),
        url: window.location.href,
        category: playerContainer.getAttribute('data-category') || '',
        timestamp: Date.now()
    };
    
    // localStorage에서 기존 목록 가져오기
    const recentlyVisited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
    const MAX_ITEMS = 30;
    
    // 같은 URL이 이미 있는지 확인
    const existingIndex = recentlyVisited.findIndex(item => item.url === gameData.url);
    
    if (existingIndex !== -1) {
        // 이미 있으면 제거 (중복 방지)
        recentlyVisited.splice(existingIndex, 1);
    }
    
    // 최신 게임을 맨 앞에 추가
    recentlyVisited.unshift(gameData);
    
    // 30개까지만 유지
    if (recentlyVisited.length > MAX_ITEMS) {
        recentlyVisited.splice(MAX_ITEMS);
    }
    
    // localStorage에 저장
    localStorage.setItem('recentlyVisited', JSON.stringify(recentlyVisited));
}

// 페이지 로드 시 애니메이션
document.addEventListener('DOMContentLoaded', function() {
    // 플레이어 컨테이너 생성
    createPlayerContainer();
    
    // 게임 해상도에 따른 초기 뷰 모드 설정
    if (gameWidth >= 768 && !isMobileSize()) {
        setViewMode('landscape');
    } else {
        setViewMode('normal');
    }
    
    /* browserResized()는 초기에 한번 호출되고, 브라우저 크기변경시 호출된다. */
    browserResized(
        // 모바일 함수
        function() {
            const gameInfo = document.querySelector('.game-info');
            if (gameInfo && gameInfo.style.display === 'none') {
                setViewMode('normal');
            }
            // 모바일에서는 normalBtn 숨김
            const normalBtn = document.getElementById('normalBtn');
            if (normalBtn) {
                normalBtn.style.display = 'none';
            }
        },
        // 태블릿 함수
        function() {
            // 태블릿에서는 normalBtn 표시
            const normalBtn = document.getElementById('normalBtn');
            if (normalBtn) {
                normalBtn.style.display = 'flex';
            }
        },
        // PC 함수
        function() {
            // PC에서는 normalBtn 표시
            const normalBtn = document.getElementById('normalBtn');
            if (normalBtn) {
                normalBtn.style.display = 'flex';
            }
        }
    );
    
    // 현재 게임 카테고리 활성화
    const currentCategory = "{{category}}";
    if (currentCategory) {
        const categoryLink = document.querySelector(`a[href="/index.html?cat=${currentCategory}"]`);
        if (categoryLink) {
            categoryLink.classList.add('active');
        }
    }
    
    // Recently Visited에 추가
    addToRecentlyVisited();
    
    const elements = document.querySelectorAll('.header, .playerContainer');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        setTimeout(() => {
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });
});
