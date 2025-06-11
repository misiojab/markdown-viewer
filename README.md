# Markdown Viewer (GNOME Shell Extension)

A minimal GNOME Shell extension that displays and toggles tasks from a Markdown file, Kanban-style.  
Supports checkboxes and section headers (##), and writes back to the Markdown file.  
Ideal for simple TODO workflows right from your top bar!

*Note: This extension works for GNOME 48+*

---
## Features
- Displays sections and tasks from a markdown file.
- Recognizes `[ ]` (incomplete) and `[x]` (complete) tasks.
- Toggle task state with a click.
- Custom SVG icon support.
- Simple preferences panel to select the file.
---

## 🚀 Installation

Clone the extension directly into your local GNOME extensions folder:
```bash
git clone https://github.com/misiojab/markdown-viewer ~/.local/share/gnome-shell/extensions/markdown-viewer@misiojab
```
Ensure you are using GNOME version 48 or later.

---
## obsidian-kanban and markdown file
In order for this extension to work properly and recognise your tasks and lists, your markdown should look like this:
```
## In progress

- [ ] Install Markdown viewer!
- [ ] Make a coffe.

## Backlog

- [ ] Dig a hole
```
If you are using [Obsidian](https://obsidian.md/), consider installing [obsidian-kanban](https://github.com/mgmeyers/obsidian-kanban) plugin to edit and create kanban boards.
