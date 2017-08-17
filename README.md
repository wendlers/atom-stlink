# atom-stlink - stlink V2 integration for Atom

This package allows you to flash your STM32/stlink V2 device from within Atom using [stlink](https://github.com/texane/stlink). It is meant as an extension to the [build-med](https://atom.io/packages/build-mbed) to allow flashing the results from the `mbed-cli` build process.

## Features

* Configuration dialog to configure target file, board serial etc. on per project basis (configuration is written to `stlink_settings.json`).
* Flash `.hex` or `.bin` file
* Erase flash

![screenshot](https://raw.githubusercontent.com/wendlers/atom-stlink/master/doc/stlink.png)

## Prerequisites

To use stlink, make sure you installed the `st-flash` and `st-info` binaries on your system. See instructions [here](https://github.com/texane/stlink) on how to get the binaries.

## Installation

To install this package from the package repository:

    apm install stlink

Or install from git:

    cd $HOME/$MY_GIT_REPOS
    git clone https://github.com/wendlers/atom-stlink

Change into the newly cloned directory and link the package into your atom install:

    cd atom-stlink
    apm link

Next, install required node packages:

    apm install

Now, when you start your atom next time, you might be asked to install the some dependencies.

## Usage

### Quick Start

* Connect your board
* Open a project for your board in Atom. Compile it to a `.hex` or `.bin` file (if you use mbed-cli and like to compile directly from Atom, you might want to try the [build-med](https://atom.io/packages/build-mbed) package).
* Configure stlink for your project by opening the stlink panel with `shift+alt+p` (or from right click menu and selecting `stlink: toggle`).
* In the configuration panel at least specify a `file` to flash (and a `address` if a .bin file is used).
* Now hit `flash` or press `shift-alt-s` to flash your board.
* Flashing progress is indicated by the spinning busy indicator in the right bottom corner.

## Configuration Parameters

The following could be set in the stlink panel:

* The `board serial` which is only needed if you have more than one board connected.
* The `file` to flash. Could be a .bin or .hex file.
* If the `reset` switch is turned on, the board will be reset after flashing is done.

In the package settings the following could be configured:

* `st-flash binary` : name and optional path for the st-flash tool which comes with stlink.
* `st-info binary` : name and optional path for the st-info tool which comes with stlink.

## Available Functions

The following functions could be performed (from the stlink panel,the menu, the context-menu or by keyboard shortcut):

* _toggel_ stlink panel (``shift+alt+p``): open the stlink panel
* _flash_ (`shift-alt-s`): flash specified file
* _erase_ (`shift-alt-e`): erase chip
