// Remove any legacy WiraCalc PWA service worker/caches from this origin.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.getRegistrations()
            .then((regs) => regs.forEach((reg) => reg.unregister()))
            .catch(() => {});
        if ('caches' in window) {
            caches.keys()
                .then((keys) => keys.forEach((key) => caches.delete(key)))
                .catch(() => {});
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            const isFlex = navLinks.style.display === 'flex';
            navLinks.style.display = isFlex ? 'none' : 'flex';
            if (!isFlex) {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = '#09090b';
                navLinks.style.padding = '2rem';
                navLinks.style.borderBottom = '1px solid #27272a';
            }
        });
    }
});
