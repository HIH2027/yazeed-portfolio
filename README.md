# Yazeed Bin Thnayan — Portfolio

A bilingual (English / Arabic) personal site built with plain HTML, CSS and JavaScript.
No framework and no build step. The only script dependency is StringTune (vendored in `js/vendor`,
MIT) for the card tilt, portrait parallax and magnetic buttons; everything works without it. Fonts
come from Google Fonts (IBM Plex Sans / Plex Sans Arabic, and Aref Ruqaa for the signature).

## Structure

```
index.html        All markup and copy, in both languages.
css/style.css     Tokens → reset → components → sections → responsive → print.
js/main.js        Language, theme, reveals, scroll spy, command menu (Ctrl/⌘ K), XO,
                  CV request, copy email, Riyadh clock.
js/vendor/        StringTune 1.2.5 browser build + licence.
assets/           Portrait, share card (og.jpg), icons, project previews (work/).
```

## How the two languages work

Both languages ship inside the HTML. Nothing is fetched or injected at runtime.

```html
<span lang="en">Work</span><span lang="ar">الأعمال</span>
```

CSS hides whichever language is inactive, keyed off `data-lang` on `<html>`:

```css
[data-lang="en"] [lang="ar"] { display: none; }
[data-lang="ar"] [lang="en"] { display: none; }
```

The toggle flips `data-lang`, `lang`, and `dir` on `<html>`. That single `dir` flip mirrors the whole
layout, because every direction-sensitive rule uses **logical properties**
(`padding-inline-start`, `border-block-end`, `inset-inline`) rather than left/right. There is no
separate RTL stylesheet to keep in sync.

To edit copy, edit both spans. To add a language, add a third `lang` and one more CSS pair.

**One exception:** the language button uses `data-show` instead of `lang`, so it can display `عربي`
while still carrying `lang="ar"` for screen readers. Don't "fix" that back to `lang`.

## Theme and language on first load

A small inline script in `<head>` resolves both before first paint, so nothing flashes:

1. the visitor's saved choice (`localStorage`: `theme`, `lang`)
2. otherwise the OS setting (`prefers-color-scheme`) and browser language (Arabic browsers get Arabic)
3. otherwise light + English

Clearing `localStorage` hands control back to the system.

## Design

Near-monochrome by intent. The accent — `#1B3A5C` light, `#8fb4d6` dark — is the HIH7 navy, so the
site and the hackathon identity agree. It appears only on the monogram, focus rings, and the work-row
hover. The only other colour is the green on the **Live** markers.

No cards, no shadows, no gradients: hairline rules and whitespace carry the layout. Type is the system
stack (no webfont download), with a separate Arabic stack and no negative tracking in Arabic, where
tight letterspacing breaks the letterforms.

Motion is one effect — a 12px rise and fade on entry — and it disables entirely under
`prefers-reduced-motion`.

Tokens live at the top of `style.css`. Changing the accent is one line, in two places (`:root` and
`[data-theme="dark"]`).

## Social preview card

`assets/og.jpg` (1200×630) is what LinkedIn, WhatsApp, Telegram and X show when the link is shared.
It carries the signature, name, roles and availability. Keep it a JPEG under 300 KB: above that,
WhatsApp drops to a small thumbnail. Regenerate it after any change to the name, roles or dates.

## Signature

The mark is «بن ثنيان» handwritten in Aref Ruqaa, slanted, with a stroke that leaves the final ن
and sweeps back under the name. It is navy (cream in the dark theme) and appears in the header
(inline SVG; the font is subset to the five letters it uses), on the share card, and in white on
navy as the site icon (`favicon-32.png`, `icon-192.png`, `apple-touch-icon.png`).

`og:url`, `og:image` and `twitter:image` are absolute and point at https://www.yazeed.space/.
They must stay absolute: crawlers will not resolve a relative path, and the card silently falls back
to plain text. If the domain ever changes, update the host in those tags.

Platforms cache previews aggressively. After a change, force a re-read with
LinkedIn Post Inspector (`linkedin.com/post-inspector`) or Facebook's Sharing Debugger.

## Printing

`Ctrl+P` produces a clean CV rather than a screenshot of a webpage: navigation and buttons are
dropped, colours forced to black on white, sections kept off page breaks, and real links annotated
with their URL. Only the language currently on screen prints.

## Editing the content

Everything a visitor reads is in `index.html`:

| What | Where |
| --- | --- |
| Headline, intro | `.hero` |
| Projects | the four `<li class="work__item">` blocks in `#work` |
| Numbers | `.figures` |
| Roles | `<li class="role">` blocks in `#experience` |
| Awards, certification | `.creds` |
| Bio, capabilities | `#about` |
| Email, LinkedIn | `#contact` |

## Verified

32/32 reveals fire · zero horizontal overflow in LTR and RTL · zero failed requests · language and
theme persist across reloads · mobile menu traps focus and closes on `Escape` · Arabic layout mirrors
with numerals and `@handles` staying LTR.

Reveals have a 2.5s failsafe: `IntersectionObserver` delivers nothing while a tab is hidden, and some
embedded webviews never report visible, so anything still unrevealed is shown outright. Content can
never be permanently invisible.

## Deploying

Three files and one SVG. No build command; publish directory `.`.

- **GitHub Pages** — push, enable Pages on the branch.
- **Netlify / Vercel** — drag the folder in.

## Browser support

Modern evergreen browsers. Uses `IntersectionObserver`, custom properties, `clamp()`, logical
properties, `color-mix()` and `backdrop-filter`. Without JavaScript, every section is still visible
and readable, in whichever language the markup defaults to.
