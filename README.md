# Mahfuz Hossain Antor — Portfolio

Plain HTML/CSS/JS, no build step. Open `index.html` in a browser, or deploy the folder
as-is to GitHub Pages, Vercel, or Netlify.

## Things left for you to fill in

1. **Your photo** — drop a picture at `assets/images/profile.jpg` (any name works, just
   update the `src` on the `#profileImg` tag in `index.html`). Until then, a placeholder
   frame is shown automatically.

2. **Project screenshots** — each project card in the "Projects" section has a dashed
   placeholder telling you the expected filename (e.g. `assets/images/project-network.jpg`).
   Drop images in and swap the `.proj-card__placeholder` div for an `<img>`.

3. **Real links** — GitHub, LinkedIn, and each project's "Source" link are placeholders
   (`href="#"`) so nothing 404s in the meantime.
   - Social links: search `index.html` for `linkedinLink` / `githubLink`.
   - Project links: search for `Source — link coming soon`.

4. **Live Codeforces streak chart** — open `script.js` and set:
   ```js
   const CF_HANDLE = "your_codeforces_handle";
   ```
   The heatmap will then fetch your real submission history straight from the public
   Codeforces API (`user.status`) client-side and compute your actual solved counts and
   streaks. Leave it blank and it shows sample data matching your current stats
   (593 solved · 537-day max streak).

## Structure

```
index.html   — markup / content
styles.css   — theme, layout, glass + animation styles
script.js    — cursor, scroll reveals, heatmap, project carousel
assets/images/ — put your photos here
```
