const headerUrl = new URL('./index.html', import.meta.url); 

fetch(headerUrl)
  .then(res => res.text())
  .then(html => {
    document.getElementById("navbar").innerHTML = html;

    // Now the DOM has the header
    const navbar = document.getElementById('navbar');
    const sentinel = document.getElementById('sentinel');

    if (navbar && sentinel) {
      new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) {
            navbar.classList.add('dock');
          } else {
            navbar.classList.remove('dock');
          }
        },
        { root: null, threshold: 0 }
      ).observe(sentinel);

      const hamburgerBtn = document.getElementById('hamburgerBtn');
      const navMenu = document.getElementById('navMenu');

      hamburgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('hidden');
      });
    }
  });
