// Wrap everything in an IIFE to avoid polluting global scope.
(async function () {
    // A flag to prevent re-entry of quality-fetching logic.
    let isFetchingQualities = false;
  
    // Simple sleep utility.
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  
    // Wait until the video element exists.
    async function waitForVideo() {
      let video = document.querySelector('video');
      while (!video) {
        await sleep(200);
        video = document.querySelector('video');
      }
      return video;
    }
  
    // Opens the settings menu and quality submenu to scrape available quality options.
    async function getAvailableQualities() {
      if (isFetchingQualities) return []; // Skip if already in progress.
      isFetchingQualities = true;
      
      await waitForVideo();
      await sleep(1000); // Allow player to settle
  
      // Click the settings (gear) button.
      const settingsButton = document.querySelector('.ytp-settings-button');
      if (!settingsButton) {
        console.log("Settings button not found.");
        isFetchingQualities = false;
        return [];
      }
      settingsButton.click();
      await sleep(500);
  
      // Find the "Quality" menu item.
      const menuItems = document.querySelectorAll('.ytp-menuitem');
      let qualityMenuItem;
      for (let item of menuItems) {
        if (item.innerText && item.innerText.includes("Quality")) {
          qualityMenuItem = item;
          break;
        }
      }
      if (!qualityMenuItem) {
        console.log("Quality menu item not found.");
        settingsButton.click();
        isFetchingQualities = false;
        return [];
      }
      qualityMenuItem.click();
      await sleep(500);
  
      // Fetch available quality options.
      const qualityOptions = Array.from(document.querySelectorAll('.ytp-menuitem'))
        .filter(item => {
            const txt = item.innerText.trim();
            // Look for strings that start with a number followed by "p" or exactly "Highest"
            return /^\d+p/.test(txt) || txt === "Highest";
        })
        .map(item => item.innerText.trim())
        .sort((a, b) => {
            const extractQuality = q => (q === "Highest" ? Infinity : parseInt(q));
            return extractQuality(a) - extractQuality(b);
        });
  
      // Close the settings menu.
      settingsButton.click();
      await sleep(300);
      
      isFetchingQualities = false;
      console.log("Available qualities:", qualityOptions);
      return qualityOptions;
    }
  
    // Function to change quality by simulating menu clicks.
    async function setQuality(quality) {
      await waitForVideo();
      await sleep(1000);
  
      const settingsButton = document.querySelector('.ytp-settings-button');
      if (!settingsButton) {
        console.log("Settings button not found.");
        return;
      }
      settingsButton.click();
      await sleep(500);
  
      // Find the "Quality" menu item.
      const menuItems = document.querySelectorAll('.ytp-menuitem');
      let qualityMenuItem;
      for (let item of menuItems) {
        if (item.innerText && item.innerText.includes("Quality")) {
          qualityMenuItem = item;
          break;
        }
      }
      if (!qualityMenuItem) {
        console.log("Quality menu not found.");
        settingsButton.click();
        return;
      }
      qualityMenuItem.click();
      await sleep(500);
  
      // Look for the option whose text includes the desired quality string.
      const qualityOptions = Array.from(document.querySelectorAll('.ytp-menuitem'));
      const selection = qualityOptions.find(item => item.innerText.trim().indexOf(quality) > -1);
      if (!selection) {
        console.log(`Quality option containing "${quality}" not found.`);
        settingsButton.click();
        return;
      }
      selection.click();
      await sleep(500);
    }
  
    // Create a container for the quality buttons.
    function createQualityButtonRow(qualities) {
        const container = document.createElement("div");
        container.id = "yt-quality-switcher";
        // Use static positioning and add some margin to separate it from the player.
        Object.assign(container.style, {
          position: "static",
        //   marginTop: "5px",
        //   backgroundColor: "rgba(0, 0, 0, 0.6)",
          padding: "5px",
          borderRadius: "4px",
          display: "flex",
          gap: "5px",
          alignItems: "center"
        });
      
        qualities.forEach(q => {
          const btn = document.createElement("button");
          btn.textContent = q;
          Object.assign(btn.style, {
            backgroundColor: "#fffffc",
            border: "none",
            padding: "5px 8px",
            borderRadius: "3px",
            fontSize: "11px",
            cursor: "pointer"
          });
          btn.addEventListener("click", () => {
            console.log(`Switching to quality option: ${q}`);
            setQuality(q);
          });
          container.appendChild(btn);
        });
        return container;
      }
  
    // Main routine: fetch available qualities, build the button row, and add it to the player.
    async function addDynamicQualitySwitcher() {
        // Avoid duplicate insertion.
        if (document.getElementById("yt-quality-switcher")) return;
      
        const availableQualities = await getAvailableQualities();
        if (!availableQualities || availableQualities.length === 0) {
          console.log("No quality options found.");
          return;
        }
      
        // Select the player container.
        // On YouTube, the video player is usually wrapped in an element with id "player".
        const player = document.getElementById("player");
        if (!player) {
          console.log("Video player container not found.");
          return;
        }
        
        // Create the button row.
        const btnRow = createQualityButtonRow(availableQualities);
        
        // Insert the button row after the player container.
        // This ensures the buttons appear below the player rather than overlaying it.
        const playerBelow = document.querySelector('#below');
        playerBelow.prepend(btnRow);
        // player.parentNode.insertBefore(btnRow, player.nextSibling);
      }
  
    // Use a MutationObserver to re-add the dynamic button row if necessary.
    const observer = new MutationObserver(() => {
      addDynamicQualitySwitcher();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  
    // Add the dynamic quality switcher on initial load.
    addDynamicQualitySwitcher();
  })();
  