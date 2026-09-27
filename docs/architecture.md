# Portfolio architecture

Research checked 2026-09-26 against the official sources below.

## Decisions

Use Jekyll 4.4.1, the stable release listed in the official history, with an
explicit Gemfile and a generated, committed Gemfile.lock. Use a custom GitHub
Actions build instead of the `github-pages` dependency bundle. This keeps the
generator and dependencies under repository control and allows future build-time
integrations without changing the hosting model. Reproducibility is not complete
until the lockfile and tested Ruby version are committed.

The workflow will install locked dependencies, run a production Jekyll build,
upload `_site`, and deploy through GitHub's Pages actions. Pull requests should
build without deploying. Only the deployment job needs Pages write and OIDC
permissions. Production should use the github-pages environment and concurrency
control. Action versions will be checked when the workflow is implemented.

## Final structure

```text
_projects/                 One Markdown source per case study
_posts/                    Dated local articles
_drafts/                   Unpublished local writing
_data/
  navigation.yml           One navigation definition
  profile.yml              Name, biography, contact and professional links
  resume.yml               Structured résumé content
  external_writing.yml     Optional off-site article references
_layouts/                  default, page, project, post, resume
_includes/                 Navigation, cards, media, callouts, project links
assets/
  css/                     Tokens, components, prose, print styles
  js/                      Optional filters and isolated demonstrations
  images/projects/         Optimized project imagery
pages/                     Projects, About, Résumé, Writing, Contact
templates/                 Authoring examples excluded from site output
docs/                      Maintainer documentation excluded from output
.github/workflows/         Build checks and Pages deployment
_config.yml
Gemfile
Gemfile.lock
index.html                 Final homepage
```

Directories are introduced when used, rather than filled with placeholders.

## Content contract

Projects use an output-enabled collection. Require only a title and summary in
the authoring convention. Keep the filename equal to the intended stable URL
segment, e.g. `_projects/hockey-session-finder.md`. Collection permalinks use
`:name`, Jekyll's documented filename-based placeholder; do not assume a custom
`slug` property rewrites that URL. Use `permalink` for explicit overrides. A slug
may still be recorded as metadata if a future editor needs it.

Optional metadata: description, date, featured, status, technologies,
categories, tags, github, demo, image, screenshots, and links. Use description
for SEO when supplied and summary as its fallback. No template should repeat
project facts. Dates are optional; establish deterministic ordering using a
filename fallback for undated entries. Missing images, links, and technologies
must omit their corresponding UI rather than produce empty elements.

Project indexes read `site.projects`; homepage selection uses `featured: true`.
Technology/category filter choices derive from metadata, with all projects
visible without JavaScript. Case-study Markdown can freely choose sections:
problem, constraints, architecture, decisions, tradeoffs, results, and lessons.
Reusable includes will cover figures with alt text and dimensions, galleries,
callouts, accessible diagram images, technology lists, optional links, video,
and project navigation. Fenced Markdown code uses Jekyll's existing Rouge
highlighter. Diagrams should initially be authored SVG/images, avoiding a global
diagram runtime. Page-specific script metadata can enable isolated demos.

Local writing uses `_posts/YYYY-MM-DD-title.md`. External writing starts as data
with title, date, summary, source, and external URL, merged into the writing list
and clearly labeled as off-site. No scraped copies or synchronization. Local
posts may set a canonical URL for cross-publishing; canonical tags must never be
duplicated. External entries do not automatically become local feed items.

## Presentation and accessibility

Use plain CSS with custom properties, system fonts initially, restrained color,
readable prose, generous spacing, and strong project imagery. No CSS framework,
SPA, icon library, or animation dependency is necessary. Provide semantic
landmarks, visible keyboard focus, skip navigation, responsive layouts, image
alt text, adequate contrast, and reduced-motion support for any later animation.
Dark mode is optional after the primary design is validated.

Keep résumé content in one data file. Render a web page with print CSS so the
browser can save a PDF from the same content. Support an optional downloadable
PDF URL when an approved PDF exists; do not display a dead download link.

## SEO, URLs, and assets

At the SEO checkpoint add three plugins, each for a specific job:

- `jekyll-seo-tag`: titles, descriptions, canonical URLs, Open Graph, social
  metadata, and supported JSON-LD, avoiding handwritten duplication.
- `jekyll-feed`: automatic Atom feed for local posts.
- `jekyll-sitemap`: automatic sitemap for generated public pages.

Add robots.txt and favicons as static/template assets. Assess project-specific
CreativeWork JSON-LD alongside the SEO plugin's output; do not claim that every
project is a released SoftwareApplication. Use `jsonify` for structured values.
Set real author identity and social metadata before launch.

Use `relative_url` for internal navigation and asset paths and `absolute_url`
for canonical/feed/social URLs. `url` is the origin; `baseurl` is the repository
path or empty string. Apply the same convention to images embedded in Markdown
via Liquid includes. Avoid hardcoded root paths. Custom domains only require
configuration, Pages/DNS setup, and any hosting-specific domain file.

Images should have explicit dimensions, useful alt text, responsive variants
where justified, and lazy loading below the fold. Do not lazy-load the primary
hero image. No analytics, API polling, CMS, authentication, or backend initially.
Future integrations should produce build-time data where possible. A Git-backed
editor can later edit the same Markdown and YAML without replacing the templates.

## Checkpoints and acceptance

1. `chore: establish Jekyll portfolio foundation` — configuration, shell,
   architecture, dependency lock, successful local build.
2. `feat: add content-driven project case studies` — schema, authoring template,
   collection layouts, index, and featured selection. Add a temporary minimal
   project and confirm it appears without presentation changes, then remove it.
3. `feat: establish portfolio design system and homepage` — reusable components,
   responsive visual design, real profile content, selected projects.
4. `feat: add about and printable resume` — biography, data-driven résumé, contact.
5. `feat: add local and external writing` — posts, article layout, combined index.
6. `feat: add discoverability and Pages deployment` — SEO plugins, feed, sitemap,
   metadata, robots, favicons, PR builds, production deployment.
7. `fix: validate accessibility and production performance` — keyboard review,
   mobile/desktop checks, reduced motion, link checks, Lighthouse audit.

Do not invent professional experience, project results, metrics, or links.
Obtain real content before presenting the portfolio as ready to publish.
At deployment, test both empty and nonempty baseurl, generated canonical URLs,
feed/sitemap entries, optional project fields, and no-JavaScript navigation.
Lighthouse scores must be measured rather than promised.

## Official references

- [Jekyll release history](https://jekyllrb.com/docs/history/)
- [Collections](https://jekyllrb.com/docs/collections/)
- [Liquid URL filters](https://jekyllrb.com/docs/liquid/filters/)
- [Custom GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Jekyll on Windows](https://jekyllrb.com/docs/installation/windows/)
- [SEO Tag](https://jekyll.github.io/jekyll-seo-tag/)
- [Feed](https://github.com/jekyll/jekyll-feed)
- [Sitemap](https://github.com/jekyll/jekyll-sitemap)
