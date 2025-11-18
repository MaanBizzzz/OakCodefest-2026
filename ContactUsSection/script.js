document.addEventListener("DOMContentLoaded", () => {
    const fields = document.querySelectorAll(".field");

    const cursor = document.createElement("span");
    cursor.classList.add("cursor");
    cursor.textContent = "▌";
    cursor.style.fontSize = "20px";
    cursor.style.position = "fixed";
    document.body.appendChild(cursor);

    let delay = 0;

    fields.forEach(field => {
        const text = field.textContent.trim();
        field.textContent = "";

        const span = document.createElement("span");
        field.appendChild(span);

        const colonIndex = text.indexOf(":");

        [...text].forEach((char, i) => {
            setTimeout(() => {
                if (i <= colonIndex) {
                    span.innerHTML += `<span class="label">${char}</span>`;
                } else {
                    span.innerHTML += char;
                }
                const rect = field.getBoundingClientRect();
                cursor.style.left = (rect.left + span.offsetWidth + 6) + "px";
                cursor.style.top = rect.top + "px";

            }, delay + i * 30);
        });

        delay += text.length * 30 + 200;
    });
});
