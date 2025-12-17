document.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById("terminalText");
    const text = el.textContent;
    el.textContent = "";

    let idx = 0;
    let skipping = false;

    // Skip typing on click
    el.addEventListener("click", () => {
        skipping = true;
        el.textContent = text;
    });

    function getDelay(char, nextChars) {
        if (skipping) return 0;
        if (nextChars.startsWith("...")) return 250;
        if (nextChars.trim().startsWith("Done!")) return 180;
        return 20 + Math.random() * 40;
    }

    function type() {
        if (idx < text.length && !skipping) {
            const nextSlice = text.slice(idx, idx + 10); // look ahead for patterns
            el.textContent += text[idx];

            const delay = getDelay(text[idx], nextSlice);

            idx++;
            setTimeout(type, delay);
        }
    }

    type();
    const scrollSpeed = 1;
    let scrollInterval;

    function setupCarousels(containerSelector, direction = 1) {
        const containers = document.querySelectorAll(containerSelector);
        return Array.from(containers).map(container => {
        const carousel = container.querySelector('.carousel');
        carousel.innerHTML += carousel.innerHTML;
        const halfWidth = carousel.scrollWidth / 2;
        if (direction === -1) {
            container.scrollLeft = halfWidth;
        }
        return { container, halfWidth, direction };
        });
    }

    function startAutoScroll() {
        const rightCarousels = setupCarousels('.lazy-scrolling-container.right', 1);
        const leftCarousels  = setupCarousels('.lazy-scrolling-container.left', -1);

        scrollInterval = setInterval(() => {
        rightCarousels.forEach(c => {
            c.container.scrollLeft += scrollSpeed;
            if (c.container.scrollLeft >= c.halfWidth) {
            c.container.scrollLeft = 0;
            }
        });
        leftCarousels.forEach(c => {
            c.container.scrollLeft -= scrollSpeed;
            if (c.container.scrollLeft <= 0) {
            c.container.scrollLeft = c.halfWidth;
            }
        });
        }, 16);
    }
    startAutoScroll();
});
