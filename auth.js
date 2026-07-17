document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) throw new Error('Not authenticated');
        const { user } = await response.json();
        const name = document.getElementById('currentUserName');
        if (name) name.textContent = user.fullName;
    } catch {
        window.location.replace('/');
    }

    const signOut = document.getElementById('signOut');
    if (signOut) signOut.addEventListener('click', async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        window.location.replace('/');
    });
});
