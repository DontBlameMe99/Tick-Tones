# Checkbox Tick Tones for Obsidian

This is a plugin for [Obsidian](https://obsidian.md/) that adds a tick-tones checkbox to the editor.

## Installation

### From Obsidian

1. Open the **Settings** window in Obsidian.
2. Go to **Community plugins** and enable **Tick Tones**.
3. Install sounds (see below).
4. Configure the plugin's settings to your liking.
5. Close the **Settings** window.

### From GitHub

1. Download the [latest release](https://codeberg.org/DontBlameMe/Tick-Tones/releases/latest).
2. Extract the zip file.
3. Copy the folder to your vault's plugin folder (`.obsidian/plugins/`).
4. Install sounds (see below).
5. Reload Obsidian.
6. Open the **Settings** window in Obsidian.
7. Enable **Tick Tones**.

## Usage

To use the tick-tones checkbox, simply check a checkbox and you will hear a sound.

## Settings

- **Checkbox Tick Sound**: The sound that will be played when a checkbox is checked.

## Installing Sounds

To install sounds, which you will hear when a checkbox is checked, you can either:

- Download sounds from the [assets](https://github.com/DontBlameMe99/Tick-Tones/tree/master/assets) folder.
- Find and download your own sounds

One important note:

- The sounds must be in an **WAV** format.

Now to install the sounds, you must move them to the plugin's assets folder:

```bash
.obsidian/plugins/tick-tones/assets
```

The `.obsidian` folder is hidden by default, but it can be found in your vault's root directory.

### Why do I need to manually install sounds?

You need to manually install sounds because Obsidian does not support including any other files for plugins.
I could include the sounds in the plugins source code, but this would disallow users to include their own sounds and/or change the sounds.
