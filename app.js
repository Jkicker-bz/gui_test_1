const MOVIES = [
  {
    id: 1,
    title: "Inception",
    year: 2010,
    genre: "Sci-Fi",
    rating: 8.8,
    overview:
      "A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea.",
    tagline: "Your mind is the scene of the crime.",
  },
  {
    id: 2,
    title: "Interstellar",
    year: 2014,
    genre: "Sci-Fi",
    rating: 8.6,
    overview:
      "A team of explorers travel through a wormhole in space to ensure humanity's survival.",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
  },
  {
    id: 3,
    title: "In Bruges",
    year: 2008,
    genre: "Crime",
    rating: 7.9,
    overview:
      "Hitman Ray and his partner await orders in Bruges, Belgium after a job gone wrong.",
    tagline: "Shoot first. Sightsee later.",
  },
];

  const searchInput = document.getElementById('search-input');
  const resultList  = document.getElementById('result-list');
  const detailPanel = document.getElementById('detail-panel');
  const searchWrap  = document.getElementById('search-wrap');
  const template    = document.getElementById('result-template');

  let activeElement = null;
  let activeIndex   = -1;
  let debounceTimer = null;
  let controller = null;
  const cache       = new Map();

  function renderResults(movies, query = '') {
    const frag = new DocumentFragment;

    movies.forEach(movie => {
      const clone = template.content.cloneNode(true);
      clone.querySelector('.result-title').textContent = movie.title;
      clone.querySelector('.result-meta').textContent = `${movie.year} · ${movie.genre}`;
      clone.querySelector('.result-rating').textContent = `★ ${movie.rating}`;

      const item = clone.querySelector('.result-item');
      item.addEventListener('click', () => showDetail(movie, item));
      frag.appendChild(clone);
    });
    resultList.innerHTML = '';
    resultList.appendChild(frag);
  }
  
  function showDetail(movie, element) {
    if (activeElement) {
      activeElement.classList.remove('active');
    }
    activeElement = element;
    element.classList.add('active');

    detailPanel.innerHTML = `
    <h2>${movie.title}</h2>
    <p>${movie.tagline}</p>
    <p>${movie.overview}</p>
    `;
  }

  async function search(query) {
    if(controller) controller.abort();
    controller = new AbortController();  

  const API_KEY = "7ab7944f73f89f374b5e3acce87eae40";
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    searchWrap.dataset.loading = 'true';
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json();
    cache.set(query, data.results);
    renderResults(data.results, query);
  } catch (err) {
    if(err.name === 'AbortError') return;
    console.error('Fetch failed:', err);
  } finally {
    searchWrap.dataset.loading = 'false';
  }
}


  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      const query = searchInput.value.trim();

      if (!query) {
        renderResults(MOVIES);
        return;
      }

      if (cache.has(query)) {
        renderResults(cache.get(query));
        return;
      }

      search(query);
    }, 300);
  });

  renderResults(MOVIES);