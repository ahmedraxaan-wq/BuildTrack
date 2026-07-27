BUILDTRACK — INSTALLABLE APP
============================

WHAT'S IN THIS FOLDER
  index.html            the whole BuildTrack app
  manifest.webmanifest  makes it installable with a name + icon
  sw.js                 offline support (your sync always goes live to Google)
  icon-192.png / icon-512.png
  Code.gs               the Google Apps Script backend (already deployed if
                        you followed the earlier steps — kept here as backup)

PUT IT ONLINE (one time, ~5 minutes) — pick ONE:

A) GITHUB PAGES (recommended — free, permanent address)
  1. Go to github.com and sign in (create a free account if needed).
  2. Click + (top right) -> New repository -> name it  buildtrack
     -> keep it Private? NO — choose Public (Pages needs it on free plan)
     -> Create repository.
  3. On the repo page: "uploading an existing file" link -> upload ALL the
     files in this folder (index.html, manifest.webmanifest, sw.js, both
     icons) -> Commit changes.
  4. Settings tab -> Pages (left menu) -> Source: Deploy from a branch
     -> Branch: main, folder: / (root) -> Save.
  5. Wait ~1 minute; the page shows your address, like
     https://YOURNAME.github.io/buildtrack/
     Open it — BuildTrack loads.

B) NETLIFY DROP (fastest from a computer)
  1. Go to app.netlify.com/drop
  2. Drag this whole folder (or the zip) onto the page.
  3. It gives you an address immediately.

INSTALL IT
  Phone (Android Chrome): open your address -> ⋮ menu -> "Add to Home
  screen" / "Install app". A BuildTrack icon appears like a real app,
  opens fullscreen.
  Desktop (Chrome/Edge): open the address -> click the install icon in
  the address bar (⊕ / screen-with-arrow) -> Install.

FIRST OPEN
  Paste your Apps Script URL once and press Connect. From then on the
  app REMEMBERS it and loads your data automatically every time.

UPDATES
  When you get a new BuildTrack.html: rename it to index.html and upload
  it to the same place (GitHub: repo -> index.html -> pencil/Replace ->
  commit). The app picks it up next time you open it online.

TIP: to use YOUR LOGO as the home-screen icon, replace icon-192.png
and icon-512.png in the repo with your logo (same names, square PNGs).

NOTE
  The plain BuildTrack.html file still works exactly as before if you
  ever need it — the app saves to the same Google Sheet either way.
