# Personal portfolio

A content-first Jekyll site for GitHub Pages, preserving the moon motif, dark
palette, and six projects from the original portfolio. See
[the migration notes](docs/migration.md) for content authoring and
[the architecture](docs/architecture.md) for the remaining stages.

## Local development

Install Ruby with Bundler. On Windows, follow the official
[RubyInstaller + Devkit instructions](https://jekyllrb.com/docs/installation/windows/).
Ruby and Bundler were not available in the initial workspace.

The local preview has now been built successfully using Ruby 3.3 in Docker,
and `Gemfile.lock` has been generated. With Docker Desktop running, the existing
preview container can be managed with:

```sh
docker start personalsite-preview
docker logs --tail 20 personalsite-preview
docker stop personalsite-preview
```

The preview is available at http://localhost:4000 and automatically rebuilds
when site files change. Dependencies are cached in the `personalsite-gems`
Docker volume. Restart the container after configuration changes.

For a native Ruby installation:

```sh
bundle install
bundle lock --add-platform x86_64-linux
bundle exec jekyll serve --livereload
```

Open http://localhost:4000. Commit the generated `Gemfile.lock` so local and CI
builds use the same dependency resolution. Do not handwrite the lockfile.
The exact Ruby version for CI will be selected and pinned when the build is validated.

## Build checks

```sh
bundle exec jekyll build --trace
bundle exec jekyll build --baseurl /portfolio-preview --destination _site/preview --trace
```

Verify navigation and stylesheet URLs under both hosting modes. The second
command is a separate project-site smoke build; normal production output is `_site/`.
Restart the development server after changing `_config.yml`.

## Publishing

The deployment workflow will be added at the deployment checkpoint. Before
publishing, set the real title, description, author, production `url`, and
`baseurl`. Choose **GitHub Actions** in the repository's Pages settings.
No remote repository or public deployment has been configured.

## Suggested first commit

After installing dependencies, generating the lockfile, and validating the build:

```sh
git add .
git commit -m "chore: establish Jekyll portfolio foundation"
```
