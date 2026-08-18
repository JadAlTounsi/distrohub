(() => {
    const header = document.querySelector("header");
    const threshold = 10;
    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
        const currentY = window.scrollY;

        if (Math.abs(currentY - lastY) > threshold) {
            if (currentY > lastY && currentY > header.offsetHeight) {
                header.classList.add("header-hidden");
            } else {
                header.classList.remove("header-hidden");
            }
            lastY = currentY;
        }

        ticking = false;
    }

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    });
})();
