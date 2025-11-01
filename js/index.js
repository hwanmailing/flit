// Index 페이지 JavaScript

// 게임 데이터 (서버에서 전달받은 데이터)
const allGames = JSON.parse(document.body.getAttribute('data-game-data'));

function openGame(gameUrl) {
    window.location.href = gameUrl;
}

function filterGamesByCategory(category) {
    const gamesGrid = document.getElementById('gamesGrid');
    let filteredGames = allGames;
    
    if (category && category !== 'all') {
        filteredGames = allGames.filter(game => game.category === category);
    }
    
    // 게임 카드 HTML 생성
    const gameCards = filteredGames.map(game => `
        <div class="game-card" data-game-url="${game.game_url}">
            <img src="games/${game.thumbnail_url}" alt="${game.name}" class="game-thumbnail">
            <h3 class="game-title">${game.name}</h3>
            <p class="game-category">${game.category}</p>
        </div>
    `).join('');
    
    gamesGrid.innerHTML = gameCards;
    
    // 게임 카드에 이벤트 리스너 추가
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function() {
            const gameUrl = this.getAttribute('data-game-url');
            openGame(gameUrl);
        });
    });
    
    // 애니메이션 적용
    const cards = document.querySelectorAll('.game-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            
            // 애니메이션 완료 후 inline style 제거하여 CSS hover가 작동하도록
            setTimeout(() => {
                card.style.transform = '';
            }, 500);
        }, index * 100);
    });
}

function setActiveCategory(category) {
    // 모든 카테고리 링크에서 active 클래스 제거
    document.querySelectorAll('.category-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.category === category || (!category && link.dataset.category === 'all')) {
            link.classList.add('active');
        }
    });
    
    // 모바일 카테고리 링크도 active 클래스 업데이트
    document.querySelectorAll('.category-link-mobile').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.category === category || (!category && link.dataset.category === 'all')) {
            link.classList.add('active');
        }
    });
}

// 검색 기능
function filterGamesBySearch(searchTerm) {
    const gamesGrid = document.getElementById('gamesGrid');
    
    if (!searchTerm || searchTerm.trim() === '') {
        // 검색어가 없으면 현재 카테고리 필터 적용
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('cat');
        filterGamesByCategory(category);
        return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filteredGames = allGames.filter(game => {
        const name = (game.name || '').toLowerCase();
        const category = (game.category || '').toLowerCase();
        const description = (game.description || '').toLowerCase();
        
        return name.includes(term) || 
               category.includes(term) || 
               description.includes(term);
    });
    
    // 게임 카드 HTML 생성
    const gameCards = filteredGames.map(game => `
        <div class="game-card" data-game-url="${game.game_url}">
            <img src="games/${game.thumbnail_url}" alt="${game.name}" class="game-thumbnail">
            <h3 class="game-title">${escapeHtml(game.name)}</h3>
            <p class="game-category">${escapeHtml(game.category)}</p>
        </div>
    `).join('');
    
    gamesGrid.innerHTML = gameCards || '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(0,0,0,0.5);">검색 결과가 없습니다</div>';
    
    // 게임 카드에 이벤트 리스너 추가
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function() {
            const gameUrl = this.getAttribute('data-game-url');
            if (gameUrl) {
                openGame(gameUrl);
            }
        });
    });
    
    // 애니메이션 적용
    const cards = document.querySelectorAll('.game-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            
            setTimeout(() => {
                card.style.transform = '';
            }, 500);
        }, index * 100);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // URL 파라미터에서 카테고리 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');
    
    // 카테고리별 게임 필터링
    filterGamesByCategory(category);
    
    // 활성 카테고리 설정
    setActiveCategory(category);
    
    // 데스크톱 카테고리 링크에 클릭 이벤트 추가
    document.querySelectorAll('.category-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const categoryFromHref = href.split('cat=')[1];
            setActiveCategory(categoryFromHref);
            filterGamesByCategory(categoryFromHref);
            
            // URL 업데이트 (히스토리 추가)
            const newUrl = categoryFromHref ? `index.html?cat=${categoryFromHref}` : 'index.html';
            window.history.pushState({}, '', newUrl);
        });
    });
    
    // 모바일 카테고리 링크에 클릭 이벤트 추가
    document.querySelectorAll('.category-link-mobile').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const categoryFromHref = href.split('cat=')[1];
            setActiveCategory(categoryFromHref);
            filterGamesByCategory(categoryFromHref);
            
            // URL 업데이트 (히스토리 추가)
            const newUrl = categoryFromHref ? `index.html?cat=${categoryFromHref}` : 'index.html';
            window.history.pushState({}, '', newUrl);
        });
    });
    
    // 페이지 애니메이션
    const elements = document.querySelectorAll('.header, .games-grid');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        setTimeout(() => {
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            // 애니메이션 완료 후 inline style 제거
            setTimeout(() => {
                element.style.transform = '';
            }, 500);
        }, index * 200);
    });
});
