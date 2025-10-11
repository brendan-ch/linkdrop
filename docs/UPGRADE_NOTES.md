# Dependency Upgrade Notes

This project upgrades multiple dependencies to remediate security advisories. The sections below collect the upstream breaking-change notes for each major upgrade so you can plan additional QA.

## Express 5.1.0 (from 4.17.1)

*Express 5 requires modern Node.js runtimes.* The Express 5.0.0 package manifest now enforces `"node": ">= 18"`, so the application must be built and packaged on Node.js 18 or newer going forward.

> `res.status()` accepts only integers, and input must be greater than 99 and less than 1000 … will throw a RangeError … will throw a TypeError for non integer inputs.
>
> `res.redirect('back')` and `res.location('back')` is no longer a supported magic string, explicitly use `req.get('Referrer') || '/'`.
>
> `res.clearCookie` will ignore user provided `maxAge` and `expires` options.
>
> `router` 2.0.0 introduces new `?`, `*`, and `+` parameter modifiers, removes special `*` path segment behavior, and restricts RegExp usage to matching groups.
>
> `body-parser` 2.0 defaults `urlencoded` parsing to `extended: false` and no longer initializes `req.body` to `{}`.
>
> `send` 1.0 defaults `dotfiles` to `"ignore"` and removes the legacy `hidden` option in favor of `dotfiles`.

These changes can affect code that relied on the old status-code coercion, `'back'` shortcuts, permissive router matching, or automatic request-body initialization.

## Electron 38.2.2 (from 9.1.1)

Electron has introduced numerous defaults that tighten security since v9:

> In Electron 12, `contextIsolation` will be enabled by default. To restore the previous behavior, `contextIsolation: false` must be specified in WebPreferences.
>
> `nativeWindowOpen` is no longer experimental, and is now the default.
>
> The `remote` module was deprecated in Electron 12, and will be removed … use the `@electron/remote` module instead.
>
> Child windows opened with the `nativeWindowOpen` option will always have Node.js integration disabled, unless `nodeIntegrationInSubFrames` is `true`.

The app explicitly disables `contextIsolation` for compatibility, but any future BrowserWindow or window-opening logic should account for the stricter defaults and the removal of the built-in `remote` module.

## @electron/packager 18.3.2 (from electron-packager 15.0.0)

> build!: update minimum Node.js version from `14.17.5` to `16.4.0` … Breaking changes: remove support for the legacy notarization tool; drop support for Node 14.

Using the scoped package requires Node.js ≥16.4 for build tooling and removes the deprecated notarization flow.

## electron-winstaller 5.4.0 (from 4.0.1)

> ### BREAKING CHANGES
>
> * Updated to Squirrel-Windows 2.0.1

Installer builds now rely on Squirrel.Windows 2.x, so custom hooks or expectations tied to the 1.x behavior should be validated.
