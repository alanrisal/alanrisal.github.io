# Alan's portfolio

A buildless HTML/CSS/JavaScript portfolio with a tearable cloth opening.
The canonical entry point is `index.html` at the repository root. All asset
URLs are relative, so it works on both a GitHub user site and a project site.
The former `/root/` entry point redirects to the home page.

## Preview

Run `python -m http.server 8000` from this directory and visit
http://localhost:8000/. No dependency installation or build is needed.

## GitHub Pages

1. Push these files to `main` in `alanrisal/alanrisal.github.io`.
2. In **Settings → Pages → Build and deployment**, set **Source** to
   **GitHub Actions**.
3. The **Deploy portfolio to GitHub Pages** workflow publishes the static site
   to https://alanrisal.github.io/. If needed, run it from the Actions tab.

The workflow stages only the public site files, with `index.html` at the top
of its artifact. `.nojekyll` also supports deployments that serve `main` at
`/ (root)` directly. `/root` is an ordinary directory, not GitHub's root
publishing-source setting. See the [GitHub Pages entry-file requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Opening interaction

Drag with a mouse or touch to stretch and break the cloth. Keep dragging to
release it and reveal the portfolio. **Skip intro** and **Escape** bypass the
interaction. Reduced-motion preferences and direct section links bypass it
automatically. The artwork remains available with JavaScript disabled.

The Verlet integration and breakable constraints are inspired by
[dissimulate/Tearable-Cloth](https://github.com/dissimulate/Tearable-Cloth).
The interaction takes its playful, tactile direction from Daniel Beauchamp's
interaction experiments. The responsive mesh, moving texture, reveal, pointer
handling, and accessibility behavior are implemented locally with no runtime
CDN or framework dependencies.
