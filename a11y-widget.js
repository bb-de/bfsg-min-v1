// A11y-Widget - Web Accessibility Enhancement Tool
// Standalone version for GitHub hosting

(function() {
  // Configuration
  const config = {
    buttonPosition: 'right', // or 'left'
    buttonSize: 60,
    iconColor: '#ffffff',
    buttonColor: '#2563eb',
    persistSettings: true,
    resetShortcut: {
      altKey: true, 
      key: 'l'
    }
  };

  // State management
  const DEFAULT_SETTINGS = {
    fontSize: 100,
    lineSpacing: 100,
    textAlignment: 'left',
    fontFamily: 'default',
    colorTheme: 'default',
    saturation: 100,
    colorFilter: null,
    muteSound: false,
    hideImages: false,
    stopAnimations: false,
    readingMask: false,
    maskOpacity: 50,
    readingGuide: false,
    guideColor: 'yellow',
  };

  let state = {
    ...DEFAULT_SETTINGS,
    isPanelOpen: false,
    contentSectionOpen: true,
    colorSectionOpen: true,
    orientationSectionOpen: true,
  };

  // Load saved settings from localStorage
  function loadSettings() {
    if (config.persistSettings) {
      try {
        const savedSettings = localStorage.getItem('a11y-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          state = { ...state, ...parsedSettings };
        }
      } catch (e) {
        console.error('Failed to load a11y settings:', e);
      }
    }
  }

  // Save settings to localStorage
  function saveSettings() {
    if (config.persistSettings) {
      try {
        // Save only the actual settings, not UI state
        const {
          isPanelOpen,
          contentSectionOpen,
          colorSectionOpen,
          orientationSectionOpen,
          ...settings
        } = state;
        
        localStorage.setItem('a11y-settings', JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save a11y settings:', e);
      }
    }
  }

  // DOM Elements References
  let widget, button, panel, readingGuide, readingMask;
  let fontSizeSlider, lineSpacingSlider, maskOpacitySlider, saturationSlider;

  // Helper to create elements with classes and attributes
  function createElement(tag, classes = [], attributes = {}) {
    const element = document.createElement(tag);
    if (classes.length) element.classList.add(...classes);
    
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    
    return element;
  }

  // Apply accessiblity styles based on current state
  function applyStyles() {
    // Remove existing styles
    document.querySelectorAll('.a11y-dynamic-style').forEach(el => el.remove());
    
    // Get the document root element for applying global styles
    const root = document.documentElement;
    
    // Font size
    root.style.setProperty('--a11y-font-scale', state.fontSize / 100);
    document.body.style.fontSize = `calc(var(--a11y-font-scale) * 1em)`;
    
    // Line spacing
    root.style.setProperty('--a11y-line-height', state.lineSpacing / 100);
    document.body.style.lineHeight = `calc(var(--a11y-line-height) * 1.5)`;
    
    // Text alignment
    document.body.style.textAlign = state.textAlignment;
    
    // Font family
    document.body.classList.remove('font-readable', 'font-dyslexic');
    if (state.fontFamily === 'readable') {
      document.body.classList.add('font-readable');
      document.body.style.fontFamily = 'Arial, sans-serif';
    } else if (state.fontFamily === 'dyslexic') {
      document.body.classList.add('font-dyslexic');
      document.body.style.fontFamily = 'OpenDyslexic, Comic Sans MS, cursive';
    } else if (state.fontFamily === 'monospace') {
      document.body.style.fontFamily = 'Courier New, monospace';
    } else {
      document.body.style.fontFamily = '';
    }
    
    // Color theme
    document.body.classList.remove('a11y-dark', 'a11y-high-contrast', 'a11y-low-contrast');
    if (state.colorTheme !== 'default') {
      document.body.classList.add(`a11y-${state.colorTheme}`);
    }
    
    // Saturation
    root.style.setProperty('--a11y-saturation', `${state.saturation}%`);
    if (state.saturation !== 100) {
      const style = document.createElement('style');
      style.classList.add('a11y-dynamic-style');
      style.textContent = `
        body:not(.a11y-dark) img,
        body:not(.a11y-dark) video {
          filter: saturate(var(--a11y-saturation));
        }
      `;
      document.head.appendChild(style);
    }
    
    // Color filter
    const filterStyles = {
      monochrome: 'grayscale(100%)',
      protanopia: 'url(#protanopia-filter)',
      deuteranopia: 'url(#deuteranopia-filter)',
      tritanopia: 'url(#tritanopia-filter)'
    };
    
    if (state.colorFilter) {
      // Add SVG filters if not already present
      if (!document.getElementById('a11y-filters')) {
        const svgFilters = document.createElement('div');
        svgFilters.id = 'a11y-filters';
        svgFilters.style.height = '0';
        svgFilters.style.width = '0';
        svgFilters.style.position = 'absolute';
        svgFilters.style.overflow = 'hidden';
        svgFilters.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" style="display:none">
            <filter id="protanopia-filter">
              <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0"/>
            </filter>
            <filter id="deuteranopia-filter">
              <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0"/>
            </filter>
            <filter id="tritanopia-filter">
              <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0"/>
            </filter>
          </svg>
        `;
        document.body.appendChild(svgFilters);
      }
      
      const style = document.createElement('style');
      style.classList.add('a11y-dynamic-style');
      style.textContent = `
        body {
          filter: ${filterStyles[state.colorFilter]};
        }
      `;
      document.head.appendChild(style);
    }
    
    // Hide images
    if (state.hideImages) {
      const style = document.createElement('style');
      style.classList.add('a11y-dynamic-style');
      style.textContent = `
        img, svg, picture, video {
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Stop animations
    if (state.stopAnimations) {
      const style = document.createElement('style');
      style.classList.add('a11y-dynamic-style');
      style.textContent = `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Reading mask
    if (readingMask) {
      readingMask.style.display = state.readingMask ? 'block' : 'none';
      readingMask.style.opacity = state.maskOpacity / 100;
    }
    
    // Reading guide
    if (readingGuide) {
      readingGuide.style.display = state.readingGuide ? 'block' : 'none';
      
      // Set guide color
      const guideColors = {
        yellow: '#ffee00',
        blue: '#0088ff',
        red: '#ff5555',
        green: '#44cc44'
      };
      readingGuide.style.backgroundColor = guideColors[state.guideColor] || guideColors.yellow;
    }
    
    // Mute sounds
    if (state.muteSound) {
      const videos = document.querySelectorAll('video, audio');
      videos.forEach(video => {
        video.muted = true;
      });
    }
    
    // Update controls in the panel if they exist
    updateControlsState();
  }

  // Update all control elements to match the current state
  function updateControlsState() {
    if (!panel) return;
    
    // Update sliders
    if (fontSizeSlider) fontSizeSlider.value = state.fontSize;
    if (lineSpacingSlider) lineSpacingSlider.value = state.lineSpacing;
    if (maskOpacitySlider) maskOpacitySlider.value = state.maskOpacity;
    if (saturationSlider) saturationSlider.value = state.saturation;
    
    // Update checkboxes and radio buttons
    panel.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
      const name = input.getAttribute('name');
      const value = input.getAttribute('value');
      
      if (name === 'fontFamily') {
        input.checked = state.fontFamily === value;
      } else if (name === 'textAlignment') {
        input.checked = state.textAlignment === value;
      } else if (name === 'colorTheme') {
        input.checked = state.colorTheme === value;
      } else if (name === 'colorFilter') {
        input.checked = state.colorFilter === value;
      } else if (name === 'guideColor') {
        input.checked = state.guideColor === value;
      } else if (name === 'muteSound') {
        input.checked = state.muteSound;
      } else if (name === 'hideImages') {
        input.checked = state.hideImages;
      } else if (name === 'stopAnimations') {
        input.checked = state.stopAnimations;
      } else if (name === 'readingMask') {
        input.checked = state.readingMask;
      } else if (name === 'readingGuide') {
        input.checked = state.readingGuide;
      }
    });
    
    // Update section toggles
    panel.querySelectorAll('.a11y-section-header').forEach(header => {
      const section = header.getAttribute('data-section');
      const icon = header.querySelector('.a11y-toggle-icon');
      
      if (section === 'content') {
        icon.textContent = state.contentSectionOpen ? '▼' : '►';
        const content = panel.querySelector('.a11y-content-section');
        if (content) content.style.display = state.contentSectionOpen ? 'block' : 'none';
      } else if (section === 'color') {
        icon.textContent = state.colorSectionOpen ? '▼' : '►';
        const content = panel.querySelector('.a11y-color-section');
        if (content) content.style.display = state.colorSectionOpen ? 'block' : 'none';
      } else if (section === 'orientation') {
        icon.textContent = state.orientationSectionOpen ? '▼' : '►';
        const content = panel.querySelector('.a11y-orientation-section');
        if (content) content.style.display = state.orientationSectionOpen ? 'block' : 'none';
      }
    });
  }

  // Action Handlers
  function togglePanel() {
    state.isPanelOpen = !state.isPanelOpen;
    if (panel) {
      panel.style.right = state.isPanelOpen ? '0' : '-320px';
    }
  }

  function toggleSection(section) {
    if (section === 'content') {
      state.contentSectionOpen = !state.contentSectionOpen;
    } else if (section === 'color') {
      state.colorSectionOpen = !state.colorSectionOpen;
    } else if (section === 'orientation') {
      state.orientationSectionOpen = !state.orientationSectionOpen;
    }
    updateControlsState();
  }

  function resetAllSettings() {
    state = { ...state, ...DEFAULT_SETTINGS };
    saveSettings();
    applyStyles();
  }

  function positionReadingMask(e) {
    if (!state.readingMask || !readingMask) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maskHeight = 100; // Fixed height for the mask
    
    readingMask.style.top = `${e.clientY + scrollTop - (maskHeight / 2)}px`;
  }

  function positionReadingGuide(e) {
    if (!state.readingGuide || !readingGuide) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    readingGuide.style.top = `${e.clientY + scrollTop}px`;
  }

  // Create widget elements
  function createWidgetElements() {
    // Add main widget container
    widget = createElement('div', ['a11y-widget'], {
      'aria-label': 'Accessibility Widget',
      'role': 'region'
    });
    document.body.appendChild(widget);
    
    // Add button
    button = createElement('button', ['a11y-button'], {
      'aria-label': 'Toggle Accessibility Menu',
      'aria-expanded': 'false',
      'aria-controls': 'a11y-panel'
    });
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v8"></path>
        <path d="M8 12h8"></path>
      </svg>
    `;
    button.style.position = 'fixed';
    button.style.zIndex = '9999';
    button.style[config.buttonPosition] = '20px';
    button.style.bottom = '20px';
    button.style.width = `${config.buttonSize}px`;
    button.style.height = `${config.buttonSize}px`;
    button.style.borderRadius = '50%';
    button.style.backgroundColor = config.buttonColor;
    button.style.border = 'none';
    button.style.color = config.iconColor;
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    
    button.addEventListener('click', () => {
      togglePanel();
      button.setAttribute('aria-expanded', state.isPanelOpen.toString());
    });
    
    widget.appendChild(button);
    
    // Add panel
    panel = createElement('div', ['a11y-panel'], {
      'id': 'a11y-panel',
      'role': 'dialog',
      'aria-labelledby': 'a11y-panel-title'
    });
    panel.style.position = 'fixed';
    panel.style.top = '0';
    panel.style.right = '-320px';
    panel.style.width = '320px';
    panel.style.height = '100%';
    panel.style.backgroundColor = '#fff';
    panel.style.zIndex = '9998';
    panel.style.boxShadow = '-2px 0 10px rgba(0,0,0,0.2)';
    panel.style.transition = 'right 0.3s ease';
    panel.style.overflowY = 'auto';
    panel.style.padding = '20px';
    
    panel.innerHTML = `
      <div class="a11y-panel-header">
        <h2 id="a11y-panel-title" style="margin: 0 0 10px 0; font-size: 18px; color: #2563eb;">Accessibility Settings</h2>
        <button class="a11y-close-button" aria-label="Close accessibility panel" style="position: absolute; top: 15px; right: 15px; border: none; background: none; cursor: pointer; padding: 5px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="a11y-panel-content" style="margin-top: 20px;">
        <!-- Content Adjustments Section -->
        <div class="a11y-section">
          <div class="a11y-section-header" data-section="content" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px;">Content Adjustments</h3>
            <span class="a11y-toggle-icon" style="font-size: 12px;">▼</span>
          </div>
          
          <div class="a11y-content-section" style="padding: 15px 0;">
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Font Size</label>
              <input type="range" id="a11y-font-size" name="fontSize" min="70" max="200" step="10" value="${state.fontSize}" style="width: 100%;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                <span>Small</span>
                <span>Default</span>
                <span>Large</span>
              </div>
            </div>
            
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Line Spacing</label>
              <input type="range" id="a11y-line-spacing" name="lineSpacing" min="90" max="200" step="10" value="${state.lineSpacing}" style="width: 100%;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                <span>Tight</span>
                <span>Default</span>
                <span>Loose</span>
              </div>
            </div>
            
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Text Alignment</label>
              <div style="display: flex; gap: 10px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="textAlignment" value="left" ${state.textAlignment === 'left' ? 'checked' : ''} style="margin-right: 5px;">
                  Left
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="textAlignment" value="center" ${state.textAlignment === 'center' ? 'checked' : ''} style="margin-right: 5px;">
                  Center
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="textAlignment" value="right" ${state.textAlignment === 'right' ? 'checked' : ''} style="margin-right: 5px;">
                  Right
                </label>
              </div>
            </div>
            
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Font Type</label>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="fontFamily" value="default" ${state.fontFamily === 'default' ? 'checked' : ''} style="margin-right: 5px;">
                  Default
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="fontFamily" value="readable" ${state.fontFamily === 'readable' ? 'checked' : ''} style="margin-right: 5px;">
                  Readable
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="fontFamily" value="dyslexic" ${state.fontFamily === 'dyslexic' ? 'checked' : ''} style="margin-right: 5px;">
                  Dyslexia Friendly
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="fontFamily" value="monospace" ${state.fontFamily === 'monospace' ? 'checked' : ''} style="margin-right: 5px;">
                  Monospace
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Color Adjustments Section -->
        <div class="a11y-section">
          <div class="a11y-section-header" data-section="color" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px;">Color Adjustments</h3>
            <span class="a11y-toggle-icon" style="font-size: 12px;">▼</span>
          </div>
          
          <div class="a11y-color-section" style="padding: 15px 0;">
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Color Theme</label>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="colorTheme" value="default" ${state.colorTheme === 'default' ? 'checked' : ''} style="margin-right: 5px;">
                  Default
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="colorTheme" value="dark" ${state.colorTheme === 'dark' ? 'checked' : ''} style="margin-right: 5px;">
                  Dark Contrast
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="colorTheme" value="high-contrast" ${state.colorTheme === 'high-contrast' ? 'checked' : ''} style="margin-right: 5px;">
                  High Contrast
                </label>
              </div>
            </div>
            
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Saturation</label>
              <input type="range" id="a11y-saturation" name="saturation" min="0" max="200" step="10" value="${state.saturation}" style="width: 100%;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                <span>Grayscale</span>
                <span>Normal</span>
                <span>Saturated</span>
              </div>
            </div>
            
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Color Filters</label>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="colorFilter" value="monochrome" ${state.colorFilter === 'monochrome' ? 'checked' : ''} style="margin-right: 5px;">
                  Monochrome
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="colorFilter" value="protanopia" ${state.colorFilter === 'protanopia' ? 'checked' : ''} style="margin-right: 5px;">
                  Protanopia (Red Blind)
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="colorFilter" value="deuteranopia" ${state.colorFilter === 'deuteranopia' ? 'checked' : ''} style="margin-right: 5px;">
                  Deuteranopia (Green Blind)
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="colorFilter" value="tritanopia" ${state.colorFilter === 'tritanopia' ? 'checked' : ''} style="margin-right: 5px;">
                  Tritanopia (Blue Blind)
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                  <input type="radio" name="colorFilter" value="" ${!state.colorFilter ? 'checked' : ''} style="margin-right: 5px;">
                  No Filter
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Orientation Adjustments Section -->
        <div class="a11y-section">
          <div class="a11y-section-header" data-section="orientation" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px;">Orientation Adjustments</h3>
            <span class="a11y-toggle-icon" style="font-size: 12px;">▼</span>
          </div>
          
          <div class="a11y-orientation-section" style="padding: 15px 0;">
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-weight: 500;">Stop Animations</label>
                <label class="a11y-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                  <input type="checkbox" name="stopAnimations" ${state.stopAnimations ? 'checked' : ''}>
                  <span class="a11y-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;"></span>
                </label>
              </div>
            </div>
            
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-weight: 500;">Hide Images</label>
                <label class="a11y-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                  <input type="checkbox" name="hideImages" ${state.hideImages ? 'checked' : ''}>
                  <span class="a11y-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;"></span>
                </label>
              </div>
            </div>
            
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-weight: 500;">Mute Sounds</label>
                <label class="a11y-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                  <input type="checkbox" name="muteSound" ${state.muteSound ? 'checked' : ''}>
                  <span class="a11y-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;"></span>
                </label>
              </div>
            </div>
            
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-weight: 500;">Reading Mask</label>
                <label class="a11y-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                  <input type="checkbox" name="readingMask" ${state.readingMask ? 'checked' : ''}>
                  <span class="a11y-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;"></span>
                </label>
              </div>
              
              <div style="margin-top: 10px; ${state.readingMask ? '' : 'display: none;'}" id="mask-opacity-control">
                <label style="display: block; margin-bottom: 5px;">Mask Opacity</label>
                <input type="range" id="a11y-mask-opacity" name="maskOpacity" min="10" max="90" step="5" value="${state.maskOpacity}" style="width: 100%;">
              </div>
            </div>
            
            <div class="a11y-control-group" style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-weight: 500;">Reading Guide</label>
                <label class="a11y-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                  <input type="checkbox" name="readingGuide" ${state.readingGuide ? 'checked' : ''}>
                  <span class="a11y-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;"></span>
                </label>
              </div>
              
              <div style="margin-top: 10px; ${state.readingGuide ? '' : 'display: none;'}" id="guide-color-control">
                <label style="display: block; margin-bottom: 5px;">Guide Color</label>
                <div style="display: flex; gap: 10px; margin-top: 5px;">
                  <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="guideColor" value="yellow" ${state.guideColor === 'yellow' ? 'checked' : ''} style="margin-right: 5px;">
                    <span style="width: 15px; height: 15px; background-color: #ffee00; display: inline-block; border-radius: 50%;"></span>
                  </label>
                  <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="guideColor" value="blue" ${state.guideColor === 'blue' ? 'checked' : ''} style="margin-right: 5px;">
                    <span style="width: 15px; height: 15px; background-color: #0088ff; display: inline-block; border-radius: 50%;"></span>
                  </label>
                  <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="guideColor" value="red" ${state.guideColor === 'red' ? 'checked' : ''} style="margin-right: 5px;">
                    <span style="width: 15px; height: 15px; background-color: #ff5555; display: inline-block; border-radius: 50%;"></span>
                  </label>
                  <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="guideColor" value="green" ${state.guideColor === 'green' ? 'checked' : ''} style="margin-right: 5px;">
                    <span style="width: 15px; height: 15px; background-color: #44cc44; display: inline-block; border-radius: 50%;"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Reset Button -->
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          <button id="a11y-reset-button" style="width: 100%; padding: 8px; background-color: #e2e8f0; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
            Reset All Settings
          </button>
          <p style="font-size: 12px; margin-top: 8px; color: #64748b; text-align: center;">
            Press Alt+L to reset settings
          </p>
        </div>
      </div>
    `;
    
    widget.appendChild(panel);
    
    // Create reading mask and guide
    readingMask = createElement('div', ['a11y-reading-mask']);
    readingMask.style.position = 'absolute';
    readingMask.style.left = '0';
    readingMask.style.width = '100%';
    readingMask.style.height = '100px';
    readingMask.style.backgroundColor = 'black';
    readingMask.style.opacity = state.maskOpacity / 100;
    readingMask.style.pointerEvents = 'none';
    readingMask.style.zIndex = '9990';
    readingMask.style.display = state.readingMask ? 'block' : 'none';
    widget.appendChild(readingMask);
    
    readingGuide = createElement('div', ['a11y-reading-guide']);
    readingGuide.style.position = 'absolute';
    readingGuide.style.left = '0';
    readingGuide.style.width = '100%';
    readingGuide.style.height = '2px';
    readingGuide.style.backgroundColor = '#ffee00';
    readingGuide.style.pointerEvents = 'none';
    readingGuide.style.zIndex = '9990';
    readingGuide.style.display = state.readingGuide ? 'block' : 'none';
    widget.appendChild(readingGuide);
    
    // Add stylesheet
    const stylesheet = createElement('style');
    stylesheet.textContent = `
      .a11y-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      input:checked + .a11y-slider {
        background-color: #2563eb;
      }
      
      input:focus + .a11y-slider {
        box-shadow: 0 0 1px #2563eb;
      }
      
      input:checked + .a11y-slider:before {
        transform: translateX(20px);
      }
      
      .font-readable {
        letter-spacing: 0.1em;
        word-spacing: 0.15em;
      }
      
      .font-dyslexic {
        letter-spacing: 0.15em;
        word-spacing: 0.25em;
      }
      
      .a11y-dark {
        filter: invert(90%) hue-rotate(180deg);
      }
      
      .a11y-dark img,
      .a11y-dark video,
      .a11y-dark iframe {
        filter: invert(100%) hue-rotate(180deg);
      }
      
      .a11y-high-contrast a {
        color: #3B82F6 !important;
        font-weight: bold !important;
        text-decoration: underline !important;
      }
      
      .a11y-high-contrast button,
      .a11y-high-contrast input,
      .a11y-high-contrast select {
        border: 2px solid white !important;
        outline: 2px solid black !important;
      }
    `;
    document.head.appendChild(stylesheet);
    
    // Get slider references
    fontSizeSlider = document.getElementById('a11y-font-size');
    lineSpacingSlider = document.getElementById('a11y-line-spacing');
    maskOpacitySlider = document.getElementById('a11y-mask-opacity');
    saturationSlider = document.getElementById('a11y-saturation');
  }

  // Add event listeners
  function setupEventListeners() {
    // Close button
    const closeButton = panel.querySelector('.a11y-close-button');
    closeButton?.addEventListener('click', () => {
      state.isPanelOpen = false;
      panel.style.right = '-320px';
      button.setAttribute('aria-expanded', 'false');
    });
    
    // Section toggle buttons
    panel.querySelectorAll('.a11y-section-header').forEach(header => {
      header.addEventListener('click', () => {
        const section = header.getAttribute('data-section');
        if (section) toggleSection(section);
      });
    });
    
    // Reset button
    const resetButton = document.getElementById('a11y-reset-button');
    resetButton?.addEventListener('click', resetAllSettings);
    
    // Keyboard shortcut
    document.addEventListener('keydown', e => {
      const { altKey, key } = config.resetShortcut;
      if (e.altKey === altKey && e.key === key) {
        resetAllSettings();
      }
    });
    
    // Content adjustment controls
    fontSizeSlider?.addEventListener('input', e => {
      state.fontSize = parseInt((e.target as HTMLInputElement).value);
      applyStyles();
    });
    
    fontSizeSlider?.addEventListener('change', e => {
      state.fontSize = parseInt((e.target as HTMLInputElement).value);
      saveSettings();
      applyStyles();
    });
    
    lineSpacingSlider?.addEventListener('input', e => {
      state.lineSpacing = parseInt((e.target as HTMLInputElement).value);
      applyStyles();
    });
    
    lineSpacingSlider?.addEventListener('change', e => {
      state.lineSpacing = parseInt((e.target as HTMLInputElement).value);
      saveSettings();
      applyStyles();
    });
    
    // Radio button controls
    panel.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', e => {
        const input = e.target as HTMLInputElement;
        const name = input.getAttribute('name');
        const value = input.value;
        
        if (name === 'fontFamily') {
          state.fontFamily = value as any;
        } else if (name === 'textAlignment') {
          state.textAlignment = value as any;
        } else if (name === 'colorTheme') {
          state.colorTheme = value as any;
        } else if (name === 'colorFilter') {
          state.colorFilter = value ? value as any : null;
        } else if (name === 'guideColor') {
          state.guideColor = value as any;
        }
        
        saveSettings();
        applyStyles();
      });
    });
    
    // Toggle switches
    panel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', e => {
        const input = e.target as HTMLInputElement;
        const name = input.getAttribute('name');
        const checked = input.checked;
        
        if (name === 'muteSound') {
          state.muteSound = checked;
          console.log('Mute sound setting changed:', checked);
        } else if (name === 'hideImages') {
          state.hideImages = checked;
        } else if (name === 'stopAnimations') {
          state.stopAnimations = checked;
        } else if (name === 'readingMask') {
          state.readingMask = checked;
          const opacityControl = document.getElementById('mask-opacity-control');
          if (opacityControl) {
            opacityControl.style.display = checked ? 'block' : 'none';
          }
        } else if (name === 'readingGuide') {
          state.readingGuide = checked;
          const colorControl = document.getElementById('guide-color-control');
          if (colorControl) {
            colorControl.style.display = checked ? 'block' : 'none';
          }
        }
        
        saveSettings();
        applyStyles();
      });
    });
    
    // Mask opacity slider
    maskOpacitySlider?.addEventListener('input', e => {
      state.maskOpacity = parseInt((e.target as HTMLInputElement).value);
      applyStyles();
    });
    
    maskOpacitySlider?.addEventListener('change', e => {
      state.maskOpacity = parseInt((e.target as HTMLInputElement).value);
      saveSettings();
      applyStyles();
    });
    
    // Saturation slider
    saturationSlider?.addEventListener('input', e => {
      state.saturation = parseInt((e.target as HTMLInputElement).value);
      applyStyles();
    });
    
    saturationSlider?.addEventListener('change', e => {
      state.saturation = parseInt((e.target as HTMLInputElement).value);
      saveSettings();
      applyStyles();
    });
    
    // Mouse event listeners for reading mask and guide
    document.addEventListener('mousemove', e => {
      positionReadingMask(e);
      positionReadingGuide(e);
    });
  }

  // Initialize the widget
  function init() {
    // Load saved settings
    loadSettings();
    
    // Create the widget elements
    createWidgetElements();
    
    // Setup event listeners
    setupEventListeners();
    
    // Apply initial styles
    applyStyles();
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();