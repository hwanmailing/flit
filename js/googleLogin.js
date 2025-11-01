class GoogleLogin {
    constructor(element) {
        // element가 null인 경우 처리
        if (!element) {
            console.log('GoogleLogin: No element provided, skipping initialization');
            return;
        }
        
        // 테스트 모드 감지 (localhost)
        this.isTestMode = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        
        // API 베이스 URL 설정 (테스트 모드면 localhost:8787, 아니면 배포 서버)
        this.apiBaseUrl = this.isTestMode 
            ? 'http://localhost:8787' 
            : 'https://molyserver.by4bit.workers.dev';
        
        this.sClientID = "926501929839-htrnem71i17j105iub5agesekp94rn4i.apps.googleusercontent.com";
        this.loginButton = element;
        this.userMenu = document.querySelector('.user-menu');
        this.userAvatar = document.querySelector('.user-avatar');
        this.logoutItem = document.querySelector('.logout-item');
        this.userButton = document.querySelector('.user-button');
        this.userDropdown = document.querySelector('.user-dropdown');
        
        // Nickname modal elements
        this.nicknameModal = document.getElementById('nickname-modal');
        this.nicknameInput = document.getElementById('nickname-input');
        this.nicknameError = document.getElementById('nickname-error');
        this.confirmNicknameBtn = document.getElementById('confirm-nickname');
        this.cancelNicknameBtn = document.getElementById('cancel-nickname');
        this.closeNicknameModalBtn = document.querySelector('.close-nickname-modal');
        
        this.setupEventListeners();
        
        const pGoogleLogin = this;
        
        // 테스트 모드 초기화
        if (this.isTestMode) {
            this.initTestMode();
        } else {
            // Google API 로드 대기
            const initGoogleLogin = () => {
                if (typeof google !== 'undefined' && google.accounts) {
                    google.accounts.id.initialize({
                        client_id: pGoogleLogin.sClientID,
                        'data-context': "signin",
                        callback: pGoogleLogin.onGoogleSignIn.bind(pGoogleLogin),
                        auto_select: true
                    });

                    /* 로그인 창에 있는 구글로 로그인 버튼 */
                    google.accounts.id.renderButton(
                        element,
                        { theme: "outline", size: "large" }
                    );
                    
                    // One Tap 프롬프트 표시
                    if( g_pUser && g_pUser.isLogin() ){
                        pGoogleLogin.updateUserMenu(g_pUser.get().picture);
                    } else{
                        google.accounts.id.prompt();
                    }
                } else {
                    setTimeout(initGoogleLogin, 100);
                }
            };
            
            // DOMContentLoaded 또는 Google API 로드 대기
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initGoogleLogin);
            } else {
                initGoogleLogin();
            }
        }
    }

    setupEventListeners() {
        // 사용자 버튼 클릭 핸들러
        if (this.userButton && this.userDropdown) {
            this.userButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.userDropdown.classList.toggle('show');
            });

            // 외부 클릭 핸들러
            document.addEventListener('click', (e) => {
                if (this.userMenu && !this.userMenu.contains(e.target)) {
                    this.userDropdown.classList.remove('show');
                }
            });
        }

        // Nickname modal event listeners
        if (this.confirmNicknameBtn) {
            this.confirmNicknameBtn.addEventListener('click', () => this.handleNicknameConfirm());
        }
        if (this.cancelNicknameBtn) {
            this.cancelNicknameBtn.addEventListener('click', () => this.hideNicknameModal());
        }
        if (this.closeNicknameModalBtn) {
            this.closeNicknameModalBtn.addEventListener('click', () => this.hideNicknameModal());
        }
        
        // Enter key in nickname input
        if (this.nicknameInput) {
            this.nicknameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleNicknameConfirm();
                }
            });
        }
    }

    showNicknameModal() {
        if (this.nicknameModal) {
            this.nicknameModal.classList.remove('hidden');
            if (this.nicknameInput) {
                this.nicknameInput.focus();
            }
        }
    }

    hideNicknameModal() {
        if (this.nicknameModal) {
            this.nicknameModal.classList.add('hidden');
            if (this.nicknameInput) {
                this.nicknameInput.value = '';
            }
            if (this.nicknameError) {
                this.nicknameError.classList.add('hidden');
            }
        }
    }

    showNicknameError(message) {
        if (this.nicknameError) {
            this.nicknameError.textContent = message;
            this.nicknameError.classList.remove('hidden');
        }
    }

    hideNicknameError() {
        if (this.nicknameError) {
            this.nicknameError.classList.add('hidden');
        }
    }

    async checkNicknameDuplicate(nickname) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/users/check-nickname?nickname=${encodeURIComponent(nickname)}`);
            const data = await response.json();
            return data.exists || false;
        } catch (error) {
            console.error('Error checking nickname:', error);
            return false;
        }
    }

    async handleNicknameConfirm() {
        const nickname = this.nicknameInput ? this.nicknameInput.value.trim() : '';
        
        if (!nickname) {
            this.showNicknameError('닉네임을 입력해주세요.');
            return;
        }

        // 기본 검증
        if (nickname.length < 2 || nickname.length > 20) {
            this.showNicknameError('닉네임은 2-20자 사이로 입력해주세요.');
            return;
        }
        
        // 닉네임 중복 확인
        const isDuplicate = await this.checkNicknameDuplicate(nickname);
        if (isDuplicate) {
            this.showNicknameError('이미 사용 중인 닉네임입니다.');
            return;
        }

        this.hideNicknameError();
        this.hideNicknameModal();
        
        // 닉네임이 확인되면 회원가입 진행
        await this.completeRegistration(nickname);
    }

    async completeRegistration(nickname) {
        try {
            if (!this.pendingUserData) {
                console.log('Registration already completed or data cleared');
                return;
            }

            if (!this.pendingGoogleResponse) {
                throw new Error('Google authentication data is missing. Please try logging in again.');
            }

            // 필수 데이터 검증
            if (!this.pendingUserData.name || !this.pendingUserData.id || !this.pendingUserData.email || !this.pendingUserData.picture) {
                throw new Error('Incomplete user data. Please try logging in again.');
            }

            const apiResponse = await fetch(`${this.apiBaseUrl}/api/users/post`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.pendingGoogleResponse.credential}`
                },
                body: JSON.stringify({
                    name: this.pendingUserData.name,
                    id: this.pendingUserData.id,
                    email: this.pendingUserData.email,
                    picture: this.pendingUserData.picture,
                    nickname: nickname
                })
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            const data = await apiResponse.json();
            
            if (!data.success) {
                throw new Error('Registration failed');
            }
            
            if (!data.user) {
                console.error('API response missing user field:', data);
                throw new Error('Invalid API response format');
            }

            // 사용자 정보를 localStorage에 저장 (score 필드는 제거됨)
            g_pUser.set(data.user.idx, this.pendingUserData.name, this.pendingUserData.email, nickname, this.pendingUserData.picture, data.user.level || 1, 0);
            g_pUser.save();
            
            // Update UI with user info
            this.updateUserMenu(this.pendingUserData.picture);
            
            // Clear pending data
            this.pendingGoogleResponse = null;
            this.pendingUserData = null;
            
            // 회원가입 축하 메시지
            alert(`🎉 환영합니다, ${nickname}님!\n\nMoly.win에 성공적으로 가입되었습니다.`);
            
            // 페이지 새로고침
            window.location.reload();
            
        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message || 'Registration failed. Please try again.');
        }
    }

    updateUserMenu(picture) {
        const loginButton = document.getElementById('google-login-button');
        const userMenu = document.querySelector('.user-menu');
        const userAvatar = document.querySelector('.user-avatar');
        
        if (loginButton) {
            loginButton.style.display = 'none';
        }
        
        if (userMenu) {
            userMenu.style.display = 'flex';
            if (userAvatar && picture) {
                userAvatar.src = picture;
                userAvatar.alt = g_pUser.get().nickname || g_pUser.get().name || 'User';
            }
        }
    }

    decodeJwtResponse(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('JWT format is invalid');
        }

        const base64UrlDecode = (str) => {
            const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            const jsonStr = atob(base64);
            return JSON.parse(jsonStr);
        };

        const payload = base64UrlDecode(parts[1]);
        return payload;
    }

    // 테스트 모드 초기화
    initTestMode() {
        // 테스트 로그인 버튼 생성
        this.loginButton.innerHTML = '';
        const testLoginBtn = document.createElement('button');
        testLoginBtn.textContent = '🔐 테스트 로그인';
        testLoginBtn.className = 'test-login-btn';
        testLoginBtn.style.cssText = `
            background: #4285f4;
            color: white;
            border: none;
            padding: 10px 25px;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        testLoginBtn.addEventListener('mouseenter', function() {
            this.style.background = '#3367d6';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });
        
        testLoginBtn.addEventListener('mouseleave', function() {
            this.style.background = '#4285f4';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        testLoginBtn.addEventListener('click', () => this.handleTestLogin());
        this.loginButton.appendChild(testLoginBtn);
        
        // 이미 로그인된 경우 사용자 메뉴 업데이트
        if (g_pUser && g_pUser.isLogin()) {
            this.updateUserMenu(g_pUser.get().picture);
        }
    }

    // 테스트 로그인 처리 (createTestUser.js로 생성된 유저로 로그인)
    async handleTestLogin() {
        try {
            // createTestUser.js로 생성된 테스트 관리자 정보
            const testUserData = {
                email: 'admin@localhost.com',
                name: '테스트 관리자',
                id: 'admin_user_1',
                picture: 'https://example.com/admin-avatar.jpg',
                nickname: 'admin'
            };

            // 테스트 토큰 생성 (usersHandler.js에서 localhost 테스트 로그인으로 인식되도록)
            const testToken = `test_token_${Date.now()}`;
            
            // 이메일 중복 확인
            const checkResponse = await fetch(`${this.apiBaseUrl}/api/users/check-email?email=${encodeURIComponent(testUserData.email)}`);
            const checkData = await checkResponse.json();
            
            if (checkData.exists) {
                // 기존 사용자 - 바로 로그인
                const loginResponse = await fetch(`${this.apiBaseUrl}/api/users/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${testToken}`
                    },
                    body: JSON.stringify({
                        email: testUserData.email
                    })
                });

                if (!loginResponse.ok) {
                    const errorData = await loginResponse.json();
                    throw new Error(errorData.message || 'Login failed');
                }

                const loginData = await loginResponse.json();
                if (!loginData.success) {
                    throw new Error('Login failed');
                }

                // 사용자 정보를 localStorage에 저장 (score 필드는 제거됨)
                g_pUser.set(
                    loginData.user.idx, 
                    loginData.user.name || testUserData.name, 
                    loginData.user.email, 
                    loginData.user.nickname || testUserData.nickname, 
                    loginData.user.picture || testUserData.picture, 
                    loginData.user.level || 1, 
                    0 // score는 더 이상 사용하지 않음
                );
                g_pUser.save();
                
                // Update UI with user info
                this.updateUserMenu(loginData.user.picture || testUserData.picture);
                
                // 페이지 새로고침
                window.location.reload();
                
            } else {
                // 사용자가 없는 경우 - createTestUser.js를 먼저 실행하도록 안내
                alert('테스트 사용자가 없습니다.\n\n먼저 createTestUser.js를 실행하여 테스트 사용자를 생성해주세요.\n\n생성된 사용자 정보:\n- email: admin@localhost.com\n- nickname: admin');
            }
            
        } catch (error) {
            console.error('Test login error:', error);
            alert(`테스트 로그인 실패: ${error.message}`);
        }
    }

    onGoogleSignIn = async (googleResponse) => {
        const oUser = this.decodeJwtResponse(googleResponse.credential);
        
        try {
            // 먼저 사용자가 이미 존재하는지 확인
            const checkResponse = await fetch(`${this.apiBaseUrl}/api/users/check-email?email=${encodeURIComponent(oUser.email)}`);
            const checkData = await checkResponse.json();
            
            if (checkData.exists) {
                // 기존 사용자 - 바로 로그인
                const loginResponse = await fetch(`${this.apiBaseUrl}/api/users/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${googleResponse.credential}`
                    },
                    body: JSON.stringify({
                        email: oUser.email
                    })
                });

                if (!loginResponse.ok) {
                    const errorData = await loginResponse.json();
                    throw new Error(errorData.message || 'Login failed');
                }

                const loginData = await loginResponse.json();
                if (!loginData.success) {
                    throw new Error('Login failed');
                }

                // 사용자 정보를 localStorage에 저장 (score 필드는 제거됨)
                g_pUser.set(loginData.user.idx, oUser.name, oUser.email, loginData.user.nickname, oUser.picture, loginData.user.level || 1, 0);
                g_pUser.save();
                
                // Update UI with user info
                this.updateUserMenu(oUser.picture);
                
                // 페이지 새로고침
                window.location.reload();
                
            } else {
                // 새 사용자 - 닉네임 입력 모달 표시
                this.pendingGoogleResponse = googleResponse;
                this.pendingUserData = {
                    name: oUser.name || (oUser.given_name ? oUser.given_name + ' ' + (oUser.family_name || '') : ''),
                    id: oUser.sub || oUser.id,
                    email: oUser.email,
                    picture: oUser.picture
                };
                this.showNicknameModal();
            }
            
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Login failed. Please try again.');
        }
    }
}

// DOM이 로드된 후 GoogleLogin 초기화
document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById("google-login-button");
    if (loginButton) {
        const g_pLogin = new GoogleLogin(loginButton);
    } else {
        console.log('Google login button not found, skipping GoogleLogin initialization');
    }
});

