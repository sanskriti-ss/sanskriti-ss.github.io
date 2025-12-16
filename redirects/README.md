# Redirect System

This folder contains reference documentation for the redirect system.

## How It Works

All typo handling is done through the `404.html` page, which:
1. Automatically detects common typos using JavaScript
2. Redirects users to the correct page
3. Shows helpful navigation links if no typo match is found

## Current Typo Redirects

The 404 page automatically redirects these typos:
- `painting` or `painting.html` → `paintings.html`
- `mandala` or `mandala.html` → `mandalas.html`
- `project` or `project.html` → `projects.html`
- `interest` or `interest.html` → `interests.html`
- `surf` → `surf-caltech.html`
- `hackathon` → `hackathons.html`

## Adding New Redirects

Edit `404.html` and add entries to the `typoMap` object in the JavaScript section:

```javascript
const typoMap = {
    'newtypo': 'correct-page.html',
    // ... existing entries
};
```

## Benefits

- No need for individual redirect files cluttering the root directory
- All typo handling in one place
- Easy to maintain and update
- Works for both `.html` and non-`.html` URLs
