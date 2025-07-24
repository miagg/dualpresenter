#!/usr/bin/env bash
# This script downloads the latest release of DualPresenter from GitHub and removes the quarantine attribute.
clear
echo "Downloading DualPresenter..."
echo "This may take a few seconds, please wait..."
cd ~/Downloads || exit
rm -f dualpresenter*.dmg
curl -s https://api.github.com/repos/miagg/dualpresenter/releases/latest | grep -o '"browser_download_url": "[^"]*\.dmg"' | cut -d'"' -f4 | xargs curl -O -L
xattr -d com.apple.quarantine ~/Downloads/dualpresenter*.dmg 2>/dev/null
echo ""
echo "DualPresenter Downloaded! ✨"
echo "--------------------------------------"
echo "What's next?"
echo "$(curl -s https://api.github.com/repos/miagg/dualpresenter/releases/latest | grep body | cut -d'"' -f4)"
echo "---------------------------------------"
echo "You can find it in your Downloads folder."
echo "To install, double-click the downloaded file and follow the instructions."
echo ""
echo ""
echo ""
exit 0
