// Keep track of whether we've already set up the controls
let controlsInitialized = false;

export function setupStateManagement(emulator) {
    // If controls are already initialized, don't create them again
    if (controlsInitialized) {
        console.log('State management controls already initialized');
        return;
    }

    // Create state management buttons
    const stateControls = document.createElement('div');
    stateControls.style.margin = '1rem';
    stateControls.style.textAlign = 'center';
    
    const saveButton = document.createElement('button');
    saveButton.id = 'save_state';
    saveButton.textContent = 'Save VM State';
    saveButton.style.marginRight = '1rem';
    saveButton.style.padding = '0.5rem 1rem';
    saveButton.style.backgroundColor = '#4CAF50';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '4px';
    saveButton.style.cursor = 'pointer';

    const fileInput = document.createElement('input');
    fileInput.id = 'restore_state';
    fileInput.type = 'file';
    fileInput.style.display = 'none';

    const restoreButton = document.createElement('button');
    restoreButton.textContent = 'Restore VM State';
    restoreButton.style.padding = '0.5rem 1rem';
    restoreButton.style.backgroundColor = '#2196F3';
    restoreButton.style.color = 'white';
    restoreButton.style.border = 'none';
    restoreButton.style.borderRadius = '4px';
    restoreButton.style.cursor = 'pointer';

    stateControls.appendChild(saveButton);
    stateControls.appendChild(restoreButton);
    stateControls.appendChild(fileInput);

    // Insert controls before the screen container
    const screenContainer = document.getElementById('screen_container');
    screenContainer.parentNode.insertBefore(stateControls, screenContainer);

    // Save state functionality
    saveButton.onclick = async function() {
        try {
            const newState = await emulator.save_state();
            const a = document.createElement('a');
            a.download = 'coderdocs-vm-state.bin';
            a.href = window.URL.createObjectURL(new Blob([newState]));
            a.dataset.downloadurl = 'application/octet-stream:' + a.download + ':' + a.href;
            a.click();
            this.blur();
        } catch (error) {
            console.error('Error saving state:', error);
            alert('Failed to save VM state. Please try again.');
        }
    };

    // Restore state functionality
    restoreButton.onclick = function() {
        fileInput.click();
    };

    fileInput.onchange = function() {
        if (this.files.length) {
            const fileReader = new FileReader();
            emulator.stop();

            fileReader.onload = async function(e) {
                try {
                    await emulator.restore_state(e.target.result);
                    emulator.run();
                } catch (error) {
                    console.error('Error restoring state:', error);
                    alert('Failed to restore VM state. The file might be corrupted or incompatible.');
                }
            };

            fileReader.readAsArrayBuffer(this.files[0]);
            this.value = '';
        }
        this.blur();
    };

    // Mark controls as initialized
    controlsInitialized = true;
}

export async function loadStateFromPath(emulator, statePath) {
    try {
        console.log('Attempting to load state from:', statePath);
        const response = await fetch(statePath);
        if (!response.ok) {
            throw new Error(`Failed to load state file: ${response.statusText} (Status: ${response.status})`);
        }
        console.log('State file fetched successfully');
        const stateData = await response.arrayBuffer();
        console.log('State data loaded, size:', stateData.byteLength, 'bytes');
        await emulator.restore_state(stateData);
        console.log('State restored successfully');
        emulator.run();
        console.log('Emulator started');
        return true;
    } catch (error) {
        console.error('Error loading state from path:', error);
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack
        });
        return false;
    }
} 