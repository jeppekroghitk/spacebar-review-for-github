# Changelog

## 1.0.1

- Space works on GitHub's pull request pages again. GitHub renamed the classes the extension used to
  find the *Viewed* toggle and the *Submit review* button, so nothing matched and Space scrolled the
  page as usual. The toggle is now found by its `aria-pressed` and `aria-label`, which do not change
  between GitHub's builds.

## 1.0.0

- Space marks the next unviewed file on a pull request as viewed and scrolls to the following one.
- With every file viewed, Space opens the *Submit review* menu.
