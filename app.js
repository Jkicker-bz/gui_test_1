const API_KEY = "7ab7944f73f89f374b5e3acce87eae40";

const GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  27: "Horror",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
};

const searchInput = document.getElementById("search-input");
const resultList = document.getElementById("result-list");
const detailPanel = document.getElementById("detail-panel");
const searchWrap = document.getElementById("search-wrap");
const template = document.getElementById("result-template");

let activeElement = null;
let activeIndex = -1;
let debounceTimer = null;
let controller = null;
const cache = new Map();

function renderResults(movies, query = "") {
  const frag = new DocumentFragment();

  movies.forEach((movie) => {
    const clone = template.content.cloneNode(true);

    const poster = clone.querySelector('.result-poster');
    if (movie.poster_path) {
      const img = document.createElement('img');
      img.src = `https://image.tmdb.org/t/p/w92${movie.poster_path}`;
      img.alt = movie.title;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '4px';
      poster.innerHTML = '';
      poster.appendChild(img);
    }

    const titleEl = clone.querySelector(".result-title");
    titleEl.appendChild(buildHighlightedTitle(movie.title, query));
    
    const genre = GENRES[movie.genre_ids?.[0]] ?? movie.genre ?? "N/A";
    clone.querySelector(".result-meta").textContent =
      `${movie.release_date?.slice(0, 4) ?? movie.year} · ${genre}`;
    clone.querySelector(".result-rating").textContent =
      `★ ${movie.vote_average?.toFixed(1) ?? movie.rating}`;

    const item = clone.querySelector(".result-item");
    item.addEventListener("click", () => showDetail(movie, item));
    frag.appendChild(clone);
  });
  resultList.innerHTML = "";
  resultList.appendChild(frag);

  document.getElementById('result-count').textContent = `${movies.length} found`;
}

function buildHighlightedTitle(title, query) {
  const container = document.createElement('span');
  if(!query) { container.textContent = title; return container; }
  const idx = title.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) { container.textContent = title; return container; }

  const before = document.createTextNode(title.slice(0, idx));
  const match = document.createElement('span');
  const after = document.createTextNode(title.slice(idx + query.length));
  match.className = 'highlight';
  match.textContent = title.slice(idx, idx + query.length);
  container.appendChild(before);
  container.appendChild(match);
  container.appendChild(after);
  return container;
}

async function showDetail(movie, element) {
  if (activeElement) {
    activeElement.classList.remove("active");
  }
  activeElement = element;
  element.classList.add("active");

  const id = movie.id;

  const [detailRes, creditsRes, videosRes] = await Promise.allSettled([
    fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`),
    fetch(
      `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}`,
    ),
    fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`),
  ]);

  const details =
    detailRes.status === "fulfilled" ? await detailRes.value.json() : null;
  const credits =
    creditsRes.status === "fulfilled" ? await creditsRes.value.json() : null;
  const videos =
    videosRes.status === "fulfilled" ? await videosRes.value.json() : null;

  detailPanel.innerHTML = "";

  if (details?.backdrop_path) {
    const backdrop = document.createElement("div");
    backdrop.className = "detail-backdrop";
    backdrop.style.backgroundImage = `url(https://image.tmdb.org/t/p/w1280${details.backdrop_path})`;
    detailPanel.appendChild(backdrop);
  }

  if (details) {
    const title = document.createElement("h2");
    title.textContent = details.title;

    const tagline = document.createElement("p");
    tagline.className = "tagline";
    tagline.textContent = details.tagline;

    const overview = document.createElement("p");
    overview.className = "overview";
    overview.textContent = details.overview;

    detailPanel.appendChild(title);
    detailPanel.appendChild(tagline);
    detailPanel.appendChild(overview);
  }

  if (credits) {
    const castTitle = document.createElement("h3");
    castTitle.textContent = "Cast";

    const cast = document.createElement("p");
    cast.textContent = credits.cast
      .slice(0, 5)
      .map((c) => c.name)
      .join(", ");

    detailPanel.appendChild(castTitle);
    detailPanel.appendChild(cast);
  }

  if (videos) {
    const trailer = videos.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube",
    );
    const videoTitle = document.createElement("h3");
    videoTitle.textContent = "Trailer";
    detailPanel.appendChild(videoTitle);

    if (trailer) {
      const btn = document.createElement("a");
      btn.href = `https://www.youtube.com/watch?v=${trailer.key}`;
      btn.target = "_blank";
      btn.textContent = "▶  Watch Trailer";
      btn.className = "trailer-btn";
      detailPanel.appendChild(btn);
    } else {
      const noTrailer = document.createElement("p");
      noTrailer.textContent = "No Trailer Available";
      detailPanel.appendChild(noTrailer);
    }
  }
}

async function search(query) {
  if (controller) controller.abort();
  controller = new AbortController();

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    searchWrap.dataset.loading = "true";
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json();
    cache.set(query, data.results);
    renderResults(data.results, query);
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error("Fetch failed:", err);
  } finally {
    searchWrap.dataset.loading = "false";
  }
}

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    activeIndex = -1;
    const query = searchInput.value.trim();

    if (!query) {
      activeIndex = -1;
      showEmptyState()
      return;
    }

    if (cache.has(query)) {
      renderResults(cache.get(query));
      return;
    }

    search(query);
  }, 300);
});

searchInput.addEventListener('keydown', e => {
  const items = resultList.querySelectorAll('.result-item');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = Math.min(activeIndex + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = Math.max(activeIndex -1, 0);
  } else if (e.key === 'Enter') {
    if (activeIndex >= 0) {
      items[activeIndex].click();
      searchInput.focus();
    }
    return;
  } else {
    return;
  }

  items.forEach(item => item.classList.remove('active'));
  items[activeIndex].classList.add('active');
  items[activeIndex].scrollIntoView({ block: 'nearest'});
});

function showEmptyState() {
  detailPanel.innerHTML = '';
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  const icon = document.createElement('div');
  icon.textContent = '🎬';
  icon.style.fontSize =  '48px';
  icon.style.marginBottom = '16px';
  const msg = document.createElement('p');
  msg.textContent = 'Search for a movie to get Started';

  empty.appendChild(icon);
  empty.appendChild(msg);
  detailPanel.appendChild(empty);
}

showEmptyState();