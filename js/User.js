class User {
    constructor() {
        this.init();
        this.storageKey = 'user';
        this.load();
    }

    init(){
        this.idx = null;
        this.name = null;
        this.email = null;
        this.nickname = null;
        this.picture = null;
        this.level = 1;
        this.score = 0;
    }

    set(idx, name, email, nickname, picture, level = 1, score = 0) {
        this.idx = idx;
        this.name = name;
        this.email = email;
        this.nickname = nickname;
        this.picture = picture;
        this.level = level;
        this.score = score;
    }

    get() {
        return {
            idx: this.idx,
            name: this.name,
            email: this.email,
            nickname: this.nickname,
            picture: this.picture,
            level: this.level,
            score: this.score
        };
    }

    isLogin() {
        return this.email !== null && this.name !== null;
    }

    load() {
        const userStr = localStorage.getItem(this.storageKey);
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                this.set(user.idx || null, user.name, user.email, user.nickname, user.picture, user.level || 1, user.score || 0);
            } catch (error) {
                console.error('Error loading user from storage:', error);
                localStorage.removeItem(this.storageKey);
                this.init();
            }
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.get()));
    }

    logout() {
        // Clear user data
        this.init();
        // Clear localStorage
        localStorage.removeItem(this.storageKey);
        // Disable auto login
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        // Update UI
        const userMenu = document.querySelector('.user-menu');
        const loginButton = document.getElementById('google-login-button');
        
        if (userMenu) {
            userMenu.style.display = 'none';
        }
        if (loginButton) {
            loginButton.style.display = 'block';
        }
        
        // Reload page to update UI
        window.location.reload();
    }
}

const g_pUser = new User();

