#!/usr/bin/env bash
# This script downloads the latest release of DualPresenter from GitHub and removes the quarantine attribute.
clear
echo "Downloading DualPresenter..."
echo "This may take a few seconds, please wait..."
cd ~/Downloads || exit
rm -f dualpresenter*.dmg
curl -s https://api.github.com/repos/miagg/dualpresenter/releases/latest | grep -o '"browser_download_url": "[^"]*\.dmg"' | cut -d'"' -f4 | xargs wget -N -q --show-progress
xattr -d com.apple.quarantine ~/Downloads/dualpresenter*.dmg 2>/dev/null
echo "DualPresenter Downloaded! ✨"
echo "You can find it in your Downloads folder."
echo "To install, double-click the downloaded file and follow the instructions."
exit 0
