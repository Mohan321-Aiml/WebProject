document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const message = document.getElementById('authMessage');
    const tabs = document.querySelectorAll('.auth-tab');
    const nameField = document.getElementById('nameField');
    const confirmPasswordField = document.getElementById('confirmPasswordField');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const submitButton = document.getElementById('authSubmit');
    const demoCredentials = document.getElementById('demoCredentials');
    let mode = 'signin';

    const showMessage = (text, type = 'error') => {
        message.textContent = text;
        message.className = `min-h-[1.5rem] text-sm ${type === 'success' ? 'text-emerald-400' : 'text-red-400'}`;
    };

    const showConnectionError = () => {
        showMessage('Cannot reach the backend. Start the app with "npm start", then open http://localhost:3000.');
    };

    const setMode = (nextMode) => {
        mode = nextMode;
        const signingUp = mode === 'signup';
        nameField.classList.toggle('hidden', !signingUp);
        confirmPasswordField.classList.toggle('hidden', !signingUp);
        title.textContent = signingUp ? 'Create your account' : 'Welcome Back';
        subtitle.textContent = signingUp ? 'Register for access to the monitoring dashboard.' : 'Sign in to access the AI Smart Industrial Monitoring Dashboard.';
        submitButton.textContent = signingUp ? 'Create Account' : 'Sign In';
        demoCredentials.classList.toggle('hidden', signingUp);
        document.getElementById('password').autocomplete = signingUp ? 'new-password' : 'current-password';
        tabs.forEach((tab) => {
            const active = tab.dataset.mode === mode;
            tab.setAttribute('aria-selected', active);
            tab.className = `auth-tab rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`;
        });
        showMessage('');
    };

    tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
    setMode(mode);

    if (window.location.protocol === 'file:') {
        showConnectionError();
    }

    authForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const fullName = document.getElementById('fullName').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (!username || !password) {
            showMessage('Please enter both username and password.');
            return;
        }

        if (mode === 'signup') {
            if (!fullName) {
                showMessage('Please enter your full name.');
                return;
            }
            if (password.length < 8) {
                showMessage('Your password must contain at least 8 characters.');
                return;
            }
            if (password !== confirmPassword) {
                showMessage('Passwords do not match.');
                return;
            }
            submitButton.disabled = true;
            submitButton.classList.add('opacity-60', 'cursor-not-allowed');
            fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName, username, password }) })
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error);
                    window.location.href = 'dashboard.html';
                })
                .catch((error) => {
                    if (error instanceof TypeError) showConnectionError();
                    else showMessage(error.message);
                })
                .finally(() => {
                    submitButton.disabled = false;
                    submitButton.classList.remove('opacity-60', 'cursor-not-allowed');
                });
            return;
        }

        submitButton.disabled = true;
        submitButton.classList.add('opacity-60', 'cursor-not-allowed');
        fetch('/api/auth/signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                if (error instanceof TypeError) showConnectionError();
                else showMessage(error.message);
            })
            .finally(() => {
                submitButton.disabled = false;
                submitButton.classList.remove('opacity-60', 'cursor-not-allowed');
            });
    });
});
