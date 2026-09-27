# Original-site migration

Source: https://github.com/tonyxqing/tonyxqing.github.io

Inspected default branch `gh-pages` at commit
`da144b7f6f32c9feba6e253fa66db47d548a28af`.
The repository also has a `feature/v2-personal-website` branch, which was not used
as the reference for the published design.

## Preserved

- Moon photograph and circular name motif from `src/Hero.svelte`.
- Charcoal background, indigo accent, and wave footer.
- Six projects from `src/projects.json`, with their screenshots and source/demo URLs.
- Name, GitHub account, and contact email.

## Adapted

- Static, decorative circular lettering alongside a normal readable heading.
- Responsive navigation and document scrolling instead of scroll interception.
- One Markdown file per project, reusable layout/cards, automatic discovery.
- Direct email link instead of a form that merely opens the visitor's mail client.
- System fonts, no runtime framework, no third-party font request.
- Original biography used as background for draft copy; old employment, location,
  experience length, and personal details not asserted as current facts.

Project notes are intentionally brief. The old site did not provide detailed
architecture, measurements, or outcomes. These need author input or further
repository research before expanding into complete case studies. Preserved demo
links have not been certified as functional. The `tonyquing` spelling in the
SoTrendly repository URL is from the source, not an inferred correction.

The local reference checkout is ignored by Git and excluded from Jekyll output.
Original images are copied as-is. Image variants and full SEO/feed/deployment
work remain part of the next planned checkpoints.

## Add a project

Copy `templates/project.md` to `_projects/my-project.md`, replace its content,
and add any images. The filename determines `/projects/my-project/`. Set
`featured: true` to make it eligible for the homepage's three selected slots.
Projects currently sort alphabetically by title, providing stable ordering even
without dates. No date, image, links, role, or technology list is required.

Optional screenshot gallery:

```yaml
screenshots:
  - src: /assets/images/projects/my-project/detail.webp
    alt: A meaningful description of the screenshot
    width: 1200
    height: 800
    caption: Optional caption
```

Reusable Markdown includes:

```liquid
{% include figure.html src="/assets/images/projects/my-project/diagram.svg" alt="Request flow from browser to API to database" width=1200 height=800 caption="Request flow" %}
{% include callout.html title="Tradeoff" text="Explain the decision and its implications." %}
```

Suggested commit: `feat: preserve original portfolio identity in Jekyll collections`.
