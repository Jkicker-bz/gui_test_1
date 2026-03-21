const API_KEY = "7ab7944f73f89f374b5e3acce87eae40";

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

searchInput.addEventListener('keydown', e => {
  const items = resultList.querySelectorAll('.result-item');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = Math.min(activeIndex + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = Math.max(activeIndex -1, 0);
  } else if (e.key === 'Enter') {
    if (activeIndex >= 0) items[activeIndex].click();
    return;
  } else {
    return;
  }

  items.forEach(item => item.classList.remove('active'));
  items[activeIndex].classList.add('active');
  items[activeIndex].scrollIntoView({ block: 'nearest'});
});

renderResults(MOVIES);
