import { useEffect } from 'react';
import { setupStateManagement, loadStateFromPath } from './stateManager';

// Define the path to your state file
//random
const STATE_FILE_PATH = import.meta.env.VITE_STATE_FILE_URL || '/images/direct_snap.bin.zst';

// Debug function to check if a URL is accessible
async function checkUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log(`URL ${url} status:`, response.status);
    return response.ok;
  } catch (error) {
    console.error(`Error checking URL ${url}:`, error);
    return false;
  }
}

function App() {
  useEffect(function initializeEmulator(){
    console.log('Initializing emulator...');
    console.log('Environment variables:', {
      wasm: import.meta.env.VITE_WASM_URL,
      bios: import.meta.env.VITE_BIOS_URL,
      vgaBios: import.meta.env.VITE_VGA_BIOS_URL,
      state: import.meta.env.VITE_STATE_FILE_URL,
      cdrom: import.meta.env.VITE_CDROM_URL
    });
    
    // Base configuration without CD-ROM
    const baseConfig = {
      wasm_path: import.meta.env.VITE_WASM_URL || '/v86.wasm',
      screen_container: document.getElementById("screen_container"),
      bios: {
        url: import.meta.env.VITE_BIOS_URL || "/bios/seabios.bin",
      },
      vga_bios: {
        url: import.meta.env.VITE_VGA_BIOS_URL || "/bios/vgabios.bin",
      },
      boot_order: '0x123', // Boot from CD-ROM first
      memory_size: 512 * 1024 * 1024, // 512MB RAM
      vga_memory_size: 64 * 1024 * 1024, // 64MB VGA RAM
      // See more: https://github.com/copy/v86/blob/master/docs/networking.md
      net_device: {
        type: 'virtio',
        relay_url: "wisps://wisp.mercurywork.shop",
      },
      autostart: false, // Set to false so we can load state first
    };

    // Check if the wasm file is accessible
    checkUrl(baseConfig.wasm_path).then(isAccessible => {
      if (!isAccessible) {
        console.error('WASM file not accessible at:', baseConfig.wasm_path);
        // Try to load from public directory as fallback
        baseConfig.wasm_path = '/v86.wasm';
        console.log('Falling back to:', baseConfig.wasm_path);
      }
      
      // Create emulator instance
      window.emulator = new window.V86(baseConfig);

      // Wait for emulator to be ready
      window.emulator.add_listener("emulator-ready", function() {
        console.log('Emulator is ready, setting up state management...');
        setupStateManagement(window.emulator);

        // Try to load state from predefined path
        console.log('Attempting to load state...');
        loadStateFromPath(window.emulator, STATE_FILE_PATH).then(success => {
          if (!success) {
            console.log('State loading failed, starting normal boot with CD-ROM...');
            // Only load CD-ROM if state loading fails
            window.emulator.load_cdrom({
              url: import.meta.env.VITE_CDROM_URL || "/images/alpine-virt-3.21.3-x86.iso",
            }).then(() => {
              window.emulator.run();
            });
          }
        });
      });

      // Add error listener
      window.emulator.add_listener("emulator-error", function(error) {
        console.error('Emulator error:', error);
      });
    });

  }, []); // Empty dependency array since this should only run once

  return (
    <div id="screen_container">
      <div id="screen" style={{overflow: 'hidden'}}>Initializing Emulator…</div>
      <canvas style={{display: 'none'}}></canvas>
    </div>
  );
}

export default App;
