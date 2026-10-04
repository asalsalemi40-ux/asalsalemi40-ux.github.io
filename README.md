# Asal Salemi, portfolio website

Live at [asalsalemi40-ux.github.io](https://asalsalemi40-ux.github.io). Built with Jekyll on the [Editorial](https://html5up.net/editorial) theme by HTML5 UP, using the [Jekyll port by Andrew Banchich](https://github.com/andrewbanchich/editorial-jekyll-theme). GitHub Pages rebuilds the site on every push to `main`.

## Edit the content

| What | Where |
| --- | --- |
| Name, headline, email, location, contact line | `_config.yml` |
| LinkedIn, Behance, Instagram icons | `_config.yml`: paste a full URL into `linkedin_url`, `behance_url` or `instagram_url` |
| Projects (text, images, order) | `_projects/*.md`, one file per project; `order:` sets the position. Images live in `assets/images/work/` |
| Gym Box journey and blueprint | `journey:` and `blueprint:` at the top of `_projects/gym-box.md` |
| A project's two pages in the PDF | `print:` at the top of that project's file |
| About page | `about.md` |
| Home page intro | `_includes/banner.html` |
| CV download | add `assets/files/Asal_Salemi_CV.pdf`, then set `cv_pdf: /assets/files/Asal_Salemi_CV.pdf` in `_config.yml` |

To add a project, copy one of the files in `_projects/`, give it a new file name (this becomes its web address) and a new `order:` number, and change its text and images.

## Interactive pieces

| Piece | How it is used |
| --- | --- |
| Sketch and render slider | `{% include compare.html left="..." right="..." ratio="..." %}`: both images must be the same size and line up |
| 3D model with a slider | `{% include model3d.html model="..." poster="..." from="..." to="..." %}`: each model is built in `assets/js/models/<model>.js` with three.js |
| Service walk-through | `{% include journey.html %}`, filled from `journey:` and `blueprint:` |

Without JavaScript or WebGL, each piece falls back to its images.

## Update the PDF

The PDF is printed from the page `/print/`, which is built from the same content as the site. After changing a project, open [/print/](https://asalsalemi40-ux.github.io/print/) in Chrome, print it with "Save as PDF", save it over `assets/files/Asal_Salemi_Portfolio.pdf` and push. The page sets the paper size (A4 landscape) itself.

## Preview locally (optional)

With Ruby 3 installed:

```
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000. To print the PDF from a local copy, start it with `JEKYLL_ENV=production bundle exec jekyll serve` so the links in it point at the live address.

## Credits

- Design: Editorial by [HTML5 UP](https://html5up.net), free under the [CCA 3.0 licence](https://html5up.net/license). The credit in the sidebar footer is required by that licence.
- Jekyll integration: [Andrew Banchich](https://github.com/andrewbanchich/editorial-jekyll-theme) (see `LICENSE.md`).
- Fonts: Open Sans and Roboto Slab, self-hosted in `assets/fonts/` under their open licences.
- 3D: [three.js](https://threejs.org) (MIT licence), self-hosted in `assets/js/vendor/`.
