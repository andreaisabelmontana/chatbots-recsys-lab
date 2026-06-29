# Chatbots & Recommendation Engines — Interactive Study Lab

An interactive, zero-install study site for the **AI: Chatbots & Recommendation Engines** course. Every core concept — from the utility function to multi-armed bandits to production serving pipelines — is a live demo you can drag, click, sample, and sweep while the math updates in real time.

Open `index.html` (or the live Pages site) — there's nothing to build or install. All visualizations run locally in the browser (Chart.js + KaTeX from CDN).

## What's inside

- `index.html` — the interactive lab: 20 chapters, 25+ demos
- `course.html` — syllabus-driven course outline and glossary
- `project.html` — a worked end-to-end example project
- `css/main.css` — theme and component styles
- `js/viz.js` — all demo logic; `js/app.js` — TOC, scroll-spy, bootstrapping

## Chapter map

Foundations & the utility function · the five recommender families · explicit vs implicit feedback · non-personalized (random / popular / Bayesian average) · regression, classification, and ranking metrics (RMSE, ROC, NDCG, MRR) · beyond-accuracy metrics (coverage, diversity, novelty) · cosine similarity · memory-based CF (user/item KNN) · matrix factorization & SVD · content-based TF-IDF · embeddings & PCA · hybrid strategies · context-aware recommenders · splits & cold-start · hyperparameter tuning · bias & feedback loops · multi-armed bandits (ε-greedy, Thompson sampling) · production pipeline · learning to rank.

## Coursework — projects I built

Hands-on projects applying these concepts:

- [BookDB Engine](https://andreaisabelmontana.github.io/bookdb-engine/) — item-CF, BPR, TF-IDF and hybrid RRF book recommender
- [Game Recommender](https://andreaisabelmontana.github.io/game-recommender/) — item-based CF over noisy Amazon game reviews
- [Inkwell](https://andreaisabelmontana.github.io/inkwell/) — grounded print-shop quoting chat over a deterministic pricing engine
- [Reel Discovery](https://andreaisabelmontana.github.io/reel-discovery/) — film discovery from learned embeddings of taste
- [Savory RecSys](https://andreaisabelmontana.github.io/savory-recsys/) — recipe recommender that learns tastes from ingredients
- [Short Video Recommender](https://andreaisabelmontana.github.io/short-video-recommender/) — ranks an endless feed from split-second watch signals
- [Skincares Advisor](https://andreaisabelmontana.github.io/skincares-advisor/) — annotated breakdown of any skincare ingredient list
- [Mistral Kit](https://andreaisabelmontana.github.io/mistral-kit/) — React + TypeScript chat components for Mistral AI
- [BookDB Discovery](https://andreaisabelmontana.github.io/bookdb-discovery/) — showcase of a conversational book recommender
- [Movie Watchlist](https://andreaisabelmontana.github.io/moviewatchlist/) — track watched / to-watch films with simple recommendations
- [Memora](https://andreaisabelmontana.github.io/memora-rebuild/) — a calm personal reflection library with an AI Librarian

## License

MIT — see [LICENSE](LICENSE).
