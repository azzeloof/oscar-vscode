# OSCAR (VS Code Extension)
**OS**cilloscope **C**ode **A**nd **R**enderer

OSCAR is a live coding environment for creating visuals using sound waves, which are plotted on an x-y oscilloscope. For example, two offset sine waves on different audio channels produce a circle. This extension is used for selectivley evaluating lines of code and sending them to the [OSCAR Server](https://github.com/azzeloof/oscar-language/) for evaluation.

## Features

*   **Evaluate Code:** Selectively evaluate lines or blocks of Oscar code and send them to the OSCAR server for live rendering.
*   **Syntax Highlighting:** Provides syntax highlighting for the Oscar language (`.os` files).
*   **Automatic Block Selection:** If no text is selected, the extension intelligently determines the current code block to evaluate based on indentation and bracket matching.

## How to Use

1.  Install the [OSCAR Server](https://github.com/azzeloof/oscar-language/).
2.  Open a `.os` file.
3.  Use the keyboard shortcut `Ctrl+Enter` (`Cmd+Enter` on macOS) to evaluate the current line or selected block of code.

## Requirements

This extension requires the [OSCAR Server](https://github.com/azzeloof/oscar-language/) to be running in the background.

## Configuration

For the best experience, this extension will prompt you to associate `.os` files with the Python language. This enables features like auto-indentation and leverages Python's syntax for a better editing experience.

## Commands and Keybindings

*   **`Oscar: Evaluate Line/Block`**: `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (macOS)
    *   Evaluates the current line or selected block of code.

**Enjoy!**