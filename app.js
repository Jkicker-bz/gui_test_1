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
  clone.querySelector(".result-title").textContent = movie.title;

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

function showDetail(movie, element) {
  if (activeElement) {
    activeElement.classList.remove("active");
  }
  activeElement = element;
  element.classList.add("active");

  detailPanel.innerHTML = `
    <h2>${movie.title}</h2>
    <p>${movie.tagline}</p>
    <p>${movie.overview}</p>
    `;
}

async function search(query) {
  if (controller) controller.abort();
  controller = new AbortController();

  const API_KEY = "7ab7944f73f89f374b5e3acce87eae40";
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

renderResults(MOVIES);
