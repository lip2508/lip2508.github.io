# Portfolio — Muhammad Alif Hakimi

Personal portfolio site. Software Engineering undergraduate at Sunway University,
PETRONAS PESP scholar, looking for a software engineering internship.

**Live:** https://lip2508.github.io/

Hand-written HTML, CSS and JavaScript. No framework, no build step for normal
hosting, no dependencies — the whole site is about 85 KB.

## Running it

It is a static site, but open it through a web server rather than
double-clicking `index.html`. Opening it as a `file://` page breaks the contact
form, because FormSubmit rejects requests that arrive without a referrer.

```sh
python -m http.server 8080
# then open http://localhost:8080/
```

## Layout

```
index.html          the page
assets/styles.css   all styling, light and dark themes as CSS variables
assets/script.js    theme toggle, nav, filters, canvas, contact form
assets/og-image.*   1200x630 link-preview image (.svg is the source)
build.js            optional: inlines CSS + JS into dist/
```

## Deploying

GitHub Pages serves this repository as-is. `index.html` and `assets/` are all
that is needed, so no build step runs on deploy.

`build.js` exists only for hosts that block relative asset requests. It inlines
the stylesheet and script into a single `dist/index.html` and copies the
remaining assets next to it:

```sh
node build.js
```

It exits non-zero if the page references an asset that did not make it into
`dist/`, so a broken build fails loudly instead of shipping a dead link.

## Notes

- **Theme.** A small script in `<head>` sets the dark class before first paint,
  so returning visitors never see a flash of the light theme. It follows the
  OS preference until the toggle is used, after which the choice is remembered.
- **Contact form.** Posts to FormSubmit, which forwards the message by email.
  Activation is per domain: the first submission from a new domain triggers a
  confirmation email that has to be clicked once. If the request fails the form
  falls back to a `mailto:` link rather than claiming the message was sent.
- **Canvas.** The spinning mark is the Petronas Twin Towers floor plan, a Rub el
  Hizb: two squares, one turned 45 degrees. It is drawn 11 times, once per 8 of
  the 88 floors, and is sized for `devicePixelRatio` so it stays sharp on phones.
- **Reduced motion.** `prefers-reduced-motion` stops the canvas spinning, the
  typing effect, the counting stats and the scroll reveals.
