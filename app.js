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

class SearchComponent {
  constructor() {
    this.searchInput = document.getElementById("search-input");
    this.resultList = document.getElementById("result-list");
    this.detailPanel = document.getElementById("detail-panel");
    this.searchWrap = document.getElementById("search-wrap");
    this.template = document.getElementById("result-template");

    this.activeIndex = -1;
    this.cache = new Map();

    this.renderResults(MOVIES);
    this.searchInput.addEventListener("input", () => {
      const query = this.searchInput.value.trim();

      if (!query) {
        this.renderResults(MOVIES);
        return;
      }

      const filtered = MOVIES.filter((movie) =>
        movie.title.toLowerCase().includes(query.toLowerCase()),
      );
      this.renderResults(filtered);
    });
  }

  showDetail(movie) {
    this.detailPanel.innerHTML = `
        <h2>${movie.title}</h2>
        <p>${movie.tagline}</p>
        <p>${movie.overview}</p>
        `;
  }
  renderResults(movies) {
    const frag = new DocumentFragment();
    movies.forEach((movie) => {
      const clone = this.template.content.cloneNode(true);
      clone.querySelector(".result-title").textContent = movie.title;
      clone.querySelector(".result-meta").textContent =
        `${movie.year} · ${movie.genre}`;
      clone.querySelector(".result-rating").textContent = `★ ${movie.rating}`;

      const item = clone.querySelector(".result-item");
      item.addEventListener("click", () => {
        this.showDetail(movie);
      });
      frag.appendChild(clone);
    });

    this.resultList.innerHTML = "";
    this.resultList.appendChild(frag);
  }
}

new SearchComponent();
