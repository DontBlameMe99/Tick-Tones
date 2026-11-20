# Checkbox Tick Tones for Obsidian

[![Stars](https://img.shields.io/github/stars/DontBlameMeDev/Tick-Tones?style=for-the-badge&labelColor=%231e1e2e&color=%23f9e2af)](https://github.com/DontBlameMeDev/Tick-Tones/stargazers)
[![Forks](https://img.shields.io/github/forks/DontBlameMeDev/Tick-Tones?style=for-the-badge&labelColor=%231e1e2e&color=%2394e2d5)](https://github.com/DontBlameMeDev/Tick-Tones/network/members)
[![Latest Version](https://img.shields.io/github/v/release/DontBlameMeDev/Tick-Tones?include_prereleases&display_name=tag&style=for-the-badge&label=Version&labelColor=%231e1e2e&color=%23cba6f7)](https://github.com/DontBlameMeDev/Tick-Tones/releases)
[![License](https://img.shields.io/github/license/DontBlameMeDev/Tick-Tones?style=for-the-badge&labelColor=%231e1e2e&color=%23f38ba8)](LICENSE)

Bring your checklists to life. Tick Tones plays a sound whenever you check or
uncheck a checkbox in [Obsidian](https://obsidian.md/). It supports custom
sounds, volume control, and a variety of audio formats.

## Features

- Plays a sound when you check or uncheck a checkbox
- Switch between multiple custom sounds with ease
- Volume slider for fine-tuned control
- Supports `.wav`, `.mp3`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.opus`, and `.webm`
  files
- Built-in sample sound downloader
- Random sound mode for variety

## Installation

**Minimum Obsidian version:** 1.15.1

### From Obsidian

1. Open **Settings** in Obsidian (`Ctrl+,` by default).
2. Go to the **Community plugins** tab.
3. Enable community plugins (if not already enabled).
4. Search for **Tick Tones**.
5. Click **Install**, then **Enable**.

### From GitHub

1. Download the
   [latest release](https://github.com/DontBlameMeDev/Tick-Tones/releases/latest).
2. Extract the zip file.
3. Move the extracted folder to your vault's plugin directory at
   `.obsidian/plugins/`.
4. Open **Settings**, go to the **Community plugins** tab, and enable **Tick
   Tones**.

### Quick Start

1. Open **Tick Tones** settings from the **Community plugins** tab.
2. Click **Download Sample Sounds** to get started with curated sounds, or add
   your own (see [Adding Sounds](#adding-sounds)).
3. Adjust the tick and untick sounds and volumes to your liking.
4. Check or uncheck a checkbox in any note to hear the result.

> The settings tab has a **Reload Sounds** button. Use it after adding
> new sound files instead of disabling and re-enabling the plugin.

## Adding Sounds

### Built-in Sample Sounds

Open the plugin's settings and click **Download Sample Sounds**. The plugin will
download a curated set of sounds directly into your assets folder.

### Your Own Sounds

1. Place your audio files in the plugin's assets directory:

       YourVault/.obsidian/plugins/tick-tones/assets/

   You may need to create the `assets` folder if it does not exist. The
   `.obsidian` folder is hidden by default — enable hidden file viewing in your
   file browser.

   > `YourVault` is your Obsidian vault root folder, not the Obsidian
   > application folder.

2. Find sounds on sites like
   [Pixabay](https://pixabay.com/sound-effects/search/click/) or
   [YouTube](https://youtube.com).

3. After adding files, click **Reload Sounds** in the plugin settings.

**Supported formats:** `.wav`, `.mp3`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.opus`,
`.webm`

### Why Manual Installation?

Obsidian plugins cannot bundle large audio files directly. This keeps the plugin
lightweight and lets you choose only the sounds you want.

## Configuration

1. Open **Settings** in Obsidian.
2. Go to the **Community plugins** tab.
3. Find **Tick Tones** and click the gear icon.
4. Configure the following options:
   - **Tick Sound** — the sound played when you check a box
   - **Untick Sound** — the sound played when you uncheck a box
   - **Volume** — separate sliders for tick and untick sounds
   - **Random Sounds** — enable to play a random sound from a curated list each
     time

## Troubleshooting

### Sounds Do Not Play

- Ensure audio files are in `.obsidian/plugins/tick-tones/assets/`.
- Confirm the file format is supported (see [Adding Sounds](#adding-sounds)).
- Click **Reload Sounds** in the plugin settings after adding new files.
- Make sure your system audio is not muted.
- Try restarting Obsidian.

### Where Is My Vault Folder?

See the
[Obsidian documentation on folder structure](https://help.obsidian.md/Advanced+topics/How+Obsidian+stores+data).
