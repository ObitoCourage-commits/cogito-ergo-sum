let typedKeys = '';
const secretCode = 'epstein';
let secretUnlocked = false;

document.addEventListener('keydown', function (e) {
  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
    typedKeys += e.key.toLowerCase();

    if (typedKeys.length > secretCode.length) {
      typedKeys = typedKeys.slice(-secretCode.length);
    }

    if (typedKeys.includes(secretCode) && !secretUnlocked) {
      secretUnlocked = true;

      const secretGame = games.find(game => game.secret);
      if (secretGame) {
        openLesson(secretGame.title, secretGame.url);

        setTimeout(() => {
          secretUnlocked = false;
          typedKeys = '';
        }, 10000);
      }
    }
  }
});


function getLessonCardSearchValue(card, dataKey, selector) {
  if (!card) {
    return '';
  }

  const storedValue = String(card.dataset[dataKey] || '').trim();
  if (storedValue) {
    return storedValue.toLowerCase();
  }

  const element = selector ? card.querySelector(selector) : null;
  return element ? String(element.textContent || '').trim().toLowerCase() : '';
}

function performSearch(searchTerm) {
  const allContainer = document.getElementById('allLessonsGrid');
  const searchTermLower = String(searchTerm || '').toLowerCase().trim();

  let visibleCount = 0;
  let totalNonRandom = 0;

  if (allContainer) {
    const allNonRandomCards = allContainer.querySelectorAll('.lesson-card:not([data-random-game="true"])');
    totalNonRandom = allNonRandomCards.length;

    const randomCard = allContainer.querySelector('.lesson-card[data-random-game="true"]');
    if (randomCard) {
      const showRandomCard = searchTermLower === '';
      randomCard.hidden = !showRandomCard;
      randomCard.style.display = showRandomCard ? '' : 'none';
    }

    allNonRandomCards.forEach(card => {
      const title = getLessonCardSearchValue(card, 'searchTitle', '.lesson-title');
      const desc = getLessonCardSearchValue(card, 'searchDesc', '.lesson-desc');
      const matches = !searchTermLower || title.includes(searchTermLower) || desc.includes(searchTermLower);

      card.hidden = !matches;
      card.style.display = matches ? '' : 'none';

      if (matches) {
        visibleCount += 1;
      }
    });
  }

  const searchStats = document.getElementById('searchStats');
  if (searchStats) {
    if (searchTermLower === '') {
      const randomCard = allContainer ? allContainer.querySelector('.lesson-card[data-random-game="true"]') : null;
      const hasRandomCard = !!(randomCard && randomCard.style.display !== 'none');
      const totalVisibleCards = totalNonRandom + (hasRandomCard ? 1 : 0);
      searchStats.textContent = `Showing ${totalVisibleCards} of ${totalVisibleCards} lessons`;
    } else {
      searchStats.textContent = `Found ${visibleCount} of ${totalNonRandom} lessons for "${searchTerm}"`;
    }
  }
}

function toggleFullscreen() {
  ensureNativeCursorState();

  const activeTab = getActiveGameTab();
  if (!activeTab || !activeTab.frame) return;

  const frame = activeTab.frame;
  const enteringFullscreen = !getFullscreenElementCompat();

  if (typeof gtag !== 'undefined') {
    gtag('event', enteringFullscreen ? 'fullscreen_enter' : 'fullscreen_exit', {
      'event_category': 'game_interaction',
      'event_label': activeTab.title,
      'value': 1
    });
  }

  if (enteringFullscreen) {
    if (frame.requestFullscreen) {
      frame.requestFullscreen();
    } else if (frame.webkitRequestFullscreen) {
      frame.webkitRequestFullscreen();
    } else if (frame.msRequestFullscreen) {
      frame.msRequestFullscreen();
    } else if (frame.mozRequestFullScreen) {
      frame.mozRequestFullScreen();
    }
    frame.classList.add('fullscreen');
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
    frame.classList.remove('fullscreen');
  }

  setTimeout(ensureNativeCursorState, 80);
}

function requestElementFullscreen(element) {
  if (!element) return;

  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  }
}

function exitFullscreenCompat() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  }
}

function ensureNativeCursorState() {
  const cursor = document.getElementById('custom-cursor');
  if (cursor) {
    cursor.style.display = 'none';
    cursor.style.opacity = '0';
  }

  document.documentElement.style.removeProperty('cursor');
  document.body.style.removeProperty('cursor');
  document.documentElement.removeAttribute('data-cursor-style');
  document.body.removeAttribute('data-cursor-style');
  document.body.classList.add('cursor-disabled');
}

function syncChatShellFullscreenButton() {
  const shell = document.getElementById('chatAppShell');
  const gate = document.getElementById('chatFullscreenGate');
  if (!shell || !gate) return;

  const isFullscreen = getFullscreenElementCompat() === shell;
  const chatSection = document.getElementById('chat-section');
  const chatActive = !!(chatSection &&
    !chatSection.hidden &&
    chatSection.style.display !== 'none' &&
    getComputedStyle(chatSection).display !== 'none');
  const shouldGate = chatActive && !isFullscreen;
  const debugState = {
    reason: window.__chatGateDebugReason || 'sync',
    isFullscreen: isFullscreen,
    chatActive: chatActive,
    shouldGate: shouldGate,
    chatSectionHidden: !!(chatSection && chatSection.hidden),
    chatSectionInlineDisplay: chatSection ? chatSection.style.display || '' : '',
    chatSectionComputedDisplay: chatSection ? getComputedStyle(chatSection).display : 'missing',
    shellClasses: shell.className,
    gateClasses: gate.className,
    gateHiddenAttr: gate.hasAttribute('hidden')
  };

  shell.classList.toggle('is-fullscreen', isFullscreen);
  shell.classList.toggle('requires-fullscreen', shouldGate);
  document.body.classList.toggle('chat-requires-fullscreen', shouldGate);
  gate.removeAttribute('hidden');
  gate.classList.toggle('is-active', shouldGate);

  if (window.__chatGateDebugEnabled) {
    console.log('[chat-gate-debug] sync', debugState);
  }

  window.__chatGateDebugReason = '';
}

function toggleChatShellFullscreen() {
  const shell = document.getElementById('chatAppShell');
  if (!shell) return;

  if (window.__chatGateDebugEnabled) {
    console.log('[chat-gate-debug] toggle-click', {
      currentlyFullscreen: getFullscreenElementCompat() === shell
    });
  }

  if (getFullscreenElementCompat() === shell) {
    exitFullscreenCompat();
  } else {
    requestElementFullscreen(shell);
  }

  setTimeout(syncChatShellFullscreenButton, 80);
}

async function downloadCurrentGame() {
  const activeTab = getActiveGameTab();
  if (!activeTab || !activeTab.frame) return;

  const frame = activeTab.frame;
  const title = activeTab.title;
  const sourceUrl = activeTab.url || (games.find(game => game.title === title) || {}).url;
  const currentUrl = frame.src;
  const currentSrcDoc = frame.srcdoc;

  if (typeof gtag !== 'undefined') {
    gtag('event', 'download_attempt', {
      'event_category': 'game_interaction',
      'event_label': title,
      'value': 1
    });
  }

  try {
    let content = '';

    if (sourceUrl && currentSrcDoc && currentSrcDoc.includes('<!DOCTYPE')) {
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      content = await response.text();
    } else if (currentUrl && currentUrl !== 'about:blank' && !currentUrl.includes('loading')) {
      const response = await fetch(currentUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      content = await response.text();
    } else if (sourceUrl) {
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      content = await response.text();
    } else {
      throw new Error('No source URL available for active tab');
    }

    if (content && !content.includes('noahs-watermark')) {
      content = injectWatermark(content, title);
    }

    const blob = new Blob([content], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 100);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'download_success', {
        'event_category': 'game_interaction',
        'event_label': title,
        'value': 1
      });
    }
  } catch (error) {
    console.error('Download error:', error);
    if (typeof gtag !== 'undefined') {
      gtag('event', 'download_error', {
        'event_category': 'game_interaction',
        'event_label': title,
        'value': 1
      });
    }
    alert('Unable to download this game. Try another one or use the main site to download.');
  }
}

function injectWatermark(htmlContent, gameTitle) {
  htmlContent = htmlContent.replace(/<script[^>]*src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js[^>]*><\/script>/gi, '');
  htmlContent = htmlContent.replace(/<script[^>]*src="https:\/\/cdn\.jsdelivr\.net\/npm\/vanta@[^>]*><\/script>/gi, '');
  htmlContent = htmlContent.replace(/<div[^>]*id="vanta-bg"[^>]*>.*?<\/div>/gis, '');
  htmlContent = htmlContent.replace(/<div[^>]*class="loading-content"[^>]*>.*?<\/div>/gis, '');

  const watermarkHTML = `
		                        <!-- Downloaded From Noah's Tutoring Hub -->
		                        <style>
		                            @keyframes subtleGlow {
		                                0%, 100% { box-shadow: 0 0 10px rgba(194, 124, 21, 0.4) !important; }
		                                50% { box-shadow: 0 0 20px rgba(194, 124, 21, 0.6) !important; }
		                            }
		                        <\/style>
		                        <div id="noahs-watermark"
		                             onclick="window.open('https://unpkg.com/noahs-tutoring-hub@1.0.1/index.html', '_blank');"
		                             style="
		                                all: initial !important;
		                                position: fixed !important;
		                                bottom: 10px !important;
		                                right: 10px !important;
		                                background: rgba(0, 0, 0, 0.85) !important;
		                                color: #c27c15 !important;
		                                padding: 8px 12px !important;
		                                border-radius: 5px !important;
		                                font-family: 'Courier New', monospace !important;
		                                font-size: 12px !important;
		                                z-index: 2147483647 !important;
		                                border: 1px solid #c27c15 !important;
		                                opacity: 0.9 !important;
		                                pointer-events: auto !important;
		                                cursor: pointer !important;
		                                display: flex !important;
		                                align-items: center !important;
		                                gap: 8px !important;
		                                backdrop-filter: blur(4px) !important;
		                                box-shadow: 0 0 15px rgba(194, 124, 21, 0.4) !important;
		                                animation: subtleGlow 3s ease-in-out infinite !important;
		                                user-select: none !important;
		                            ">
		                            <img src="${LOCAL_ACTIVE_FAVICON}"
		                                 alt="Noah's Tutoring Hub"
		                                 style="width: 16px !important; height: 16px !important; border-radius: 3px !important; pointer-events: none !important;">
		                            <span style="pointer-events: none !important;">Downloaded from Noah's Tutoring Hub<\/span>
		                        <\/div>
		                        <script>
		                            (function() {
		                                var gameTitle = "${gameTitle}";

		                                function protectWatermark() {
		                                    const watermark = document.getElementById('noahs-watermark');
		                                    if (!watermark && document.body) {
		                                        location.reload();
		                                    }
		                                }
		                                
		                                setInterval(protectWatermark, 1000);
		                                
		                                console.log('%c🎮 Game: "' + gameTitle + '"', 'color: #c27c15; font-weight: bold;');
		                                console.log('%c📚 Downloaded from Noah\'s Tutoring Hub', 'color: #e69500;');
		                            })();
		                        <\/script>
		                    `;

  const bodyEndIndex = htmlContent.lastIndexOf('<\/body>');
  if (bodyEndIndex !== -1) {
    htmlContent = htmlContent.substring(0, bodyEndIndex) +
      watermarkHTML +
      htmlContent.substring(bodyEndIndex);
  } else {
    htmlContent += watermarkHTML;
  }

  return htmlContent;
}

const style = document.createElement('style');
style.textContent = '@keyframes subtleGlow { 0%, 100% { box-shadow: 0 0 10px rgba(194, 124, 21, 0.4) !important; } 50% { box-shadow: 0 0 20px rgba(194, 124, 21, 0.6) !important; } } #noahs-watermark { animation: subtleGlow 3s ease-in-out infinite !important; } #noahs-watermark:hover { animation: none !important; box-shadow: 0 0 25px rgba(194, 124, 21, 0.8) !important; }';
document.head.appendChild(style);

let lessonsInterfaceBootstrapped = false;
let lessonGridScheduled = false;
let lessonGridRendered = false;
let lessonGridScheduleHandle = null;
let bannerAdObserver = null;
let bannerAdInitScheduled = false;
let lessonImageObserver = null;
const LESSON_IMAGE_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

function optimizeStaticMedia() {
  document.querySelectorAll('.partner-image').forEach((image) => {
    image.loading = 'lazy';
    image.decoding = 'async';
    image.fetchPriority = 'low';
  });
}

function loadDeferredLessonImage(image) {
  if (!image || image.dataset.imageLoaded === '1') {
    return;
  }

  const source = image.dataset.src;
  if (!source) {
    return;
  }

  image.src = source;
  image.dataset.imageLoaded = '1';
}

function hydrateDeferredLessonImages(root = document) {
  if (!root || !root.querySelectorAll) {
    return;
  }

  const deferredImages = Array.from(root.querySelectorAll('.lesson-image[data-src]'));
  if (!deferredImages.length) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    deferredImages.forEach(loadDeferredLessonImage);
    return;
  }

  if (!lessonImageObserver) {
    lessonImageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        const image = entry.target;
        lessonImageObserver.unobserve(image);
        image.dataset.observing = '0';
        loadDeferredLessonImage(image);
      });
    }, {
      rootMargin: '600px 0px',
      threshold: 0.01
    });
  }

  deferredImages.forEach(function (image) {
    if (image.dataset.imageLoaded === '1' || image.dataset.observing === '1') {
      return;
    }
    image.dataset.observing = '1';
    lessonImageObserver.observe(image);
  });
}

function areAdsDisabled() {
  try {
    return localStorage.getItem('adsDisabled') === 'true';
  } catch (error) {
    return false;
  }
}

function updateBannerAdVisibility(activeTab) {
  const normalizedTab = String(activeTab || '').trim().toLowerCase();
  let hasVisibleAds = false;

  document.querySelectorAll('.banner-ad').forEach(function (ad) {
    const tabList = String(ad.dataset.tabs || '')
      .split(',')
      .map(function (value) {
        return value.trim().toLowerCase();
      })
      .filter(Boolean);
    const shouldShow = tabList.length ? tabList.includes(normalizedTab) : normalizedTab !== 'chat';

    ad.hidden = !shouldShow;
    ad.style.display = shouldShow ? '' : 'none';
    if (shouldShow) {
      hasVisibleAds = true;
    }
  });

  if (hasVisibleAds) {
    if (document.readyState === 'complete') {
      initializeBannerAds();
    } else {
      scheduleBannerAdsInitialization();
    }
  }
}

const LESSON_GRID_COLUMN_OPTIONS = [3, 4, 5];

function normalizeLessonGridColumns(value) {
  const numericValue = parseInt(value, 10);
  return LESSON_GRID_COLUMN_OPTIONS.includes(numericValue) ? numericValue : 3;
}

function applyLessonGridColumns(value) {
  const normalizedValue = normalizeLessonGridColumns(value);
  const allLessonsGrid = document.getElementById('allLessonsGrid');

  document.documentElement.dataset.lessonGridColumns = String(normalizedValue);
  document.body.dataset.lessonGridColumns = String(normalizedValue);

  if (allLessonsGrid) {
    allLessonsGrid.dataset.columns = String(normalizedValue);
  }

  document.querySelectorAll('.lesson-density-btn').forEach(function (button) {
    const isActive = normalizeLessonGridColumns(button.dataset.columns) === normalizedValue;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  return normalizedValue;
}

function syncSavedLessonGridColumns() {
  return applyLessonGridColumns(localStorage.getItem('lessonGridColumns') || '3');
}

window.setLessonGridColumns = function (value) {
  const normalizedValue = applyLessonGridColumns(value);
  localStorage.setItem('lessonGridColumns', String(normalizedValue));
  return normalizedValue;
};

function mountBannerAdSlot(slot) {
  if (!slot || slot.dataset.loaded === 'true') {
    return;
  }

  const key = (slot.dataset.adKey || '').trim();
  const format = (slot.dataset.adFormat || 'iframe').trim();
  const width = Math.max(1, Number(slot.dataset.adWidth || 728));
  const height = Math.max(1, Number(slot.dataset.adHeight || 90));

  if (!key) {
    return;
  }

  const frame = document.createElement('iframe');
  frame.loading = 'lazy';
  frame.decoding = 'async';
  frame.referrerPolicy = 'no-referrer-when-downgrade';
  frame.width = String(width);
  frame.height = String(height);
  frame.style.width = width + 'px';
  frame.style.height = height + 'px';
  frame.style.border = '0';
  frame.style.overflow = 'hidden';
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('allowtransparency', 'true');

  const bootstrapHtml = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style></head><body><script>atOptions=${JSON.stringify({ key: key, format: format, height: height, width: width, params: {} })};<\/script><script async src="https://www.highperformanceformat.com/${key}/invoke.js"><\/script></body></html>`;

  slot.innerHTML = '';
  slot.appendChild(frame);
  frame.srcdoc = bootstrapHtml;
  slot.dataset.loaded = 'true';
}

function initializeBannerAds() {
  const slots = Array.from(document.querySelectorAll('.banner-ad-slot'));
  if (!slots.length) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    slots.forEach(function (slot) {
      mountBannerAdSlot(slot);
    });
    return;
  }

  if (!bannerAdObserver) {
    bannerAdObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        bannerAdObserver.unobserve(entry.target);
        entry.target.dataset.observing = '0';
        mountBannerAdSlot(entry.target);
      });
    }, {
      rootMargin: '280px 0px'
    });
  }

  slots.forEach(function (slot) {
    if (slot.dataset.loaded === 'true' || slot.dataset.observing === '1') {
      return;
    }

    slot.dataset.observing = '1';
    bannerAdObserver.observe(slot);
  });
}

function scheduleBannerAdsInitialization() {
  if (bannerAdInitScheduled) {
    return;
  }

  bannerAdInitScheduled = true;
  const run = function () {
    initializeBannerAds();
    updateBannerAdVisibility(document.body && document.body.dataset ? document.body.dataset.activeTab || 'lessons' : 'lessons');
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2500 });
    return;
  }

  window.setTimeout(run, 1800);
}

optimizeStaticMedia();

function generateGameCards() {
  const allContainer = document.getElementById('allLessonsGrid');

  if (!allContainer) return;

  lessonGridRendered = true;

  const visibleGames = games.filter(game => !game.secret);
  allContainer.innerHTML = '';

  originalGamesOrder = [...visibleGames];

  applySorting();

  initCursorHover();
}

function getRandomGame() {
  return games[Math.floor(Math.random() * games.length)];
}

function setSiteLogos(src) {
  document.querySelectorAll('.logo, .home-logo').forEach(logoEl => {
    logoEl.dataset.baseSrc = src;
    logoEl.src = src;
  });
}

function ensureHardLockStyleTag() {
  if (document.getElementById('noahs-hard-lock-style')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'noahs-hard-lock-style';
  style.textContent = `
    #home-section[hidden],
    #all-lessons[hidden],
    #chat-section[hidden],
    #account-section[hidden],
    #admin-section[hidden],
    #info-section[hidden],
    #settings-section[hidden],
    #settings-section .settings-pane[hidden] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function applyLessonCardPresentation(root = document) {
  ensureHardLockStyleTag();
  const clearProps = function (element, properties) {
    if (!element || !element.style) {
      return;
    }
    properties.forEach(function (propertyName) {
      element.style.removeProperty(propertyName);
    });
  };

  root.querySelectorAll('#allLessonsGrid .lesson-card').forEach(function (card) {
    clearProps(card, ['min-height', 'aspect-ratio', 'align-self', 'align-items', 'justify-content', 'background', 'border', 'box-shadow']);
  });

  root.querySelectorAll('#allLessonsGrid .lesson-image').forEach(function (image) {
    clearProps(image, ['width', 'height', 'max-height', 'object-fit', 'object-position', 'padding', 'background', 'box-sizing', 'transform', 'filter']);
  });

  root.querySelectorAll('#allLessonsGrid .lesson-overlay').forEach(function (overlay) {
    clearProps(overlay, ['background']);
  });

  root.querySelectorAll('#allLessonsGrid .lesson-title-wrap').forEach(function (wrap) {
    clearProps(wrap, ['inset', 'align-items', 'justify-content', 'text-align', 'opacity', 'transform']);
  });

  root.querySelectorAll('#allLessonsGrid .lesson-title').forEach(function (title) {
    clearProps(title, ['width', 'max-width', 'margin', 'text-align', 'color', 'background', 'border', 'box-shadow', 'opacity']);
  });
}

function applySolidSettingsPresentation() {
  ensureHardLockStyleTag();
  const clearProps = function (element, properties) {
    if (!element || !element.style) {
      return;
    }
    properties.forEach(function (propertyName) {
      element.style.removeProperty(propertyName);
    });
  };

  document.querySelectorAll(
    '#settings-section, ' +
    '#settings-section .settings-page-header, ' +
    '#settings-section .settings-simple-panel, ' +
    '#settings-section .settings-simple-row, ' +
    '#settings-section .settings-simple-select, ' +
    '#settings-section .settings-panel, ' +
    '#settings-section .settings-nav, ' +
    '#settings-section .settings-content, ' +
    '#settings-section .settings-pane, ' +
    '#settings-section .settings-card, ' +
    '#settings-section .settings-row, ' +
    '#settings-section .settings-row-block, ' +
    '#settings-section .settings-nav-btn, ' +
    '#settings-section .settings-select, ' +
    '#settings-section .settings-text-input, ' +
    '#settings-section .settings-color-hex, ' +
    '#settings-section .bg-controls-panel, ' +
    '#settings-section .bg-controls'
  ).forEach(function (element) {
    clearProps(element, ['background', 'background-image', 'backdrop-filter', '-webkit-backdrop-filter', 'box-shadow', 'border', 'border-radius', 'padding', 'margin', 'max-width', 'width', 'overflow', 'text-align']);
  });
}

function switchAccountAuthMode(mode) {
  var activeMode = mode === 'signup' ? 'signup' : 'login';
  var authCard = document.getElementById('accountAuthCard');
  if (!authCard) return;

  authCard.querySelectorAll('.account-auth-toggle-btn').forEach((button) => {
    var isActive = button.dataset.authMode === activeMode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  authCard.querySelectorAll('.account-form[data-auth-pane]').forEach((form) => {
    var isActive = form.dataset.authPane === activeMode;
    form.hidden = !isActive;
    form.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });

  var authFeedback = document.getElementById('accountAuthFeedback');
  if (authFeedback) {
    authFeedback.hidden = true;
    authFeedback.textContent = '';
    authFeedback.classList.remove('is-success', 'is-error', 'is-info');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  switchAccountAuthMode('login');
});

function createGameCard(game, isRandom = false) {
  const card = document.createElement('div');
  card.className = 'lesson-card';

  if (isRandom) {
    card.setAttribute('data-random-game', 'true');
  }

  card.dataset.searchTitle = String(isRandom ? 'Random Game' : game.title || '').trim();
  card.dataset.searchDesc = String(isRandom ? 'Click to launch something random.' : game.desc || '').trim();

  card.innerHTML = `
		                                                      <img src="${game.image}" alt="${isRandom ? 'Random Game' : game.title}" class="lesson-image ${isRandom ? 'flash-image' : ''}" loading="lazy" decoding="async" fetchpriority="low">
		                                                      <div class="lesson-overlay">
		                                                        <div class="lesson-title-wrap">
		                                                          <h3 class="lesson-title">${isRandom ? 'Random Game' : game.title}<\/h3>
		                                                        <\/div>
		                                                        <p class="lesson-desc">${isRandom ? 'Click to launch something random.' : game.desc}<\/p>
		                                                      <\/div>
		                                                  `;

  if (isRandom) {
    card.onclick = function (e) {
      e.stopPropagation();

      const newRandomGame = getRandomGame();
      openLesson(newRandomGame.title, newRandomGame.url);

      if (typeof gtag !== 'undefined') {
        gtag('event', 'random_game_click', {
          'event_category': 'engagement',
          'event_label': newRandomGame.title,
          'value': 1
        });
      }
    };
  } else {
    card.onclick = function () {
      openLesson(game.title, game.url);
    };
  }

  applyLessonCardPresentation(card);

  return card;
}

function startHomeCarouselAutoplay(carousel) {
  if (!carousel) return;

  const track = carousel.querySelector('.home-carousel-track');
  if (!track) return;
  const cardCount = Math.max(1, Math.floor(track.querySelectorAll('.home-carousel-card').length / 2));
  const duration = Math.max(18, cardCount * 3.2);

  if (!carousel.dataset.cycleBound) {
    carousel.addEventListener('mouseenter', () => {
      const currentTrack = carousel.querySelector('.home-carousel-track');
      if (currentTrack) currentTrack.style.animationPlayState = 'paused';
    });
    carousel.addEventListener('mouseleave', () => {
      const currentTrack = carousel.querySelector('.home-carousel-track');
      if (currentTrack) currentTrack.style.animationPlayState = 'running';
    });
    carousel.dataset.cycleBound = '1';
  }

  const animationName = ensureVersionedCarouselAnimation();

  track.style.animation = 'none';
  track.style.transform = 'translateX(0)';
  void track.offsetWidth;
  track.style.animation = `${animationName} ${duration}s linear infinite`;
  track.style.animationPlayState = 'running';
}

function ensureVersionedCarouselAnimation() {
  const animationName = 'daily-games-scroll';
  const styleId = 'daily-games-scroll-style';

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
          @keyframes ${animationName} {
            from { transform: translateX(0) }
            to { transform: translateX(-50%) }
          }
        `;
    document.head.appendChild(style);
  }

  return animationName;
}

let fadeObserver = null;

function initFadeObserver() {
  if (fadeObserver) {
    fadeObserver.disconnect();
    fadeObserver = null;
  }

  const cards = document.querySelectorAll('.lesson-card');
  if (cards.length === 0) return;

  fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
      } else {
        entry.target.classList.remove('fade-in');
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => fadeObserver.observe(card));
}

function initHomeLogoTilt() {
  const wrap = document.getElementById('homeLogoWrap');
  const logo = wrap ? wrap.querySelector('.home-logo') : null;
  const shine = document.getElementById('homeLogoShine');
  if (!wrap || !logo || !shine) return;

  wrap.addEventListener('mousemove', (event) => {
    const rect = wrap.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 14;
    const rotateX = (0.5 - py) * 14;
    const dx = px - 0.5;
    const dy = py - 0.5;
    const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 0.7071);
    const glowAlpha = (0.16 + dist * 0.46).toFixed(3);
    const glowOpacity = (0.40 + dist * 0.50).toFixed(3);
    const glowBlur = `${Math.round(12 + dist * 20)}px`;
    const shineOpacity = (0.22 + dist * 0.34).toFixed(3);

    logo.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    wrap.style.setProperty('--glow-x', `${Math.round(px * 100)}%`);
    wrap.style.setProperty('--glow-y', `${Math.round(py * 100)}%`);
    wrap.style.setProperty('--glow-alpha', glowAlpha);
    wrap.style.setProperty('--glow-opacity', glowOpacity);
    wrap.style.setProperty('--glow-blur', glowBlur);
    shine.style.opacity = shineOpacity;
    shine.style.background = `radial-gradient(circle at ${Math.round(px * 100)}% ${Math.round(py * 100)}%, rgba(255, 255, 255, 0.26) 0%, transparent 42%)`;
  });

  wrap.addEventListener('mouseleave', () => {
    logo.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    wrap.style.setProperty('--glow-x', '50%');
    wrap.style.setProperty('--glow-y', '50%');
    wrap.style.setProperty('--glow-alpha', '0.16');
    wrap.style.setProperty('--glow-opacity', '0.40');
    wrap.style.setProperty('--glow-blur', '12px');
    shine.style.opacity = '0';
  });
}

function buildHomePopularCarousel() {
  const carousel = document.getElementById('homePopularCarousel');
  if (!carousel || !Array.isArray(games)) return;

  const requiredTitles = ['Balatro', 'Cloverpit', 'Peaks of Yore', 'Untitled Goose Game'];
  const selectedRequired = requiredTitles
    .map(title => games.find(game => game.title === title))
    .filter(Boolean);
  const selectedPopular = games.filter(game => game.popular && !game.secret).slice(0, 8);
  const selected = [...new Map([...selectedRequired, ...selectedPopular].map(game => [game.title, game])).values()];

  const pool = games.filter(game =>
    !game.secret && !selected.some(chosen => chosen.title === game.title) && game.image && game.url
  );
  const randomExtras = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.max(3, 9 - selected.length));
  const cycleGames = [...selected, ...randomExtras].slice(0, 9);
  const renderGames = [...cycleGames, ...cycleGames];

  carousel.innerHTML = '';
  const track = document.createElement('div');
  track.className = 'home-carousel-track';
  const gapPx = 18;
  const visibleCards = window.innerWidth <= 640 ? 1 : (window.innerWidth <= 1100 ? 2 : 3);
  const baseCardWidth = Math.floor((carousel.clientWidth - (gapPx * (visibleCards - 1))) / visibleCards);
  const cardWidth = Math.max(195, Math.floor(baseCardWidth * 0.88));
  const fragment = document.createDocumentFragment();
  renderGames.forEach(game => {
    const card = document.createElement('button');
    card.className = 'home-carousel-card';
    card.type = 'button';
    card.style.flex = `0 0 ${cardWidth}px`;
    const loadingMode = fragment.childNodes.length < visibleCards ? 'eager' : 'lazy';
    const fetchPriority = fragment.childNodes.length < visibleCards ? 'high' : 'low';
    card.innerHTML = `
          <img src="${game.image}" alt="${game.title}" class="home-carousel-image" loading="${loadingMode}" decoding="async" fetchpriority="${fetchPriority}">
          <div class="home-carousel-overlay">
            <div class="home-carousel-title-wrap">
              <div class="home-carousel-title">${game.title}</div>
            </div>
            <div class="home-carousel-desc">${game.desc}</div>
          </div>
        `;
    card.addEventListener('click', () => openLesson(game.title, game.url));
    fragment.appendChild(card);
  });
  track.appendChild(fragment);
  carousel.appendChild(track);
  startHomeCarouselAutoplay(carousel);
}

function updateSearchStats() {
  const allContainer = document.getElementById('allLessonsGrid');
  if (!allContainer) return;

  const nonRandomCards = document.querySelectorAll('#allLessonsGrid .lesson-card:not([data-random-game="true"])');
  const randomCard = allContainer.querySelector('.lesson-card[data-random-game="true"]');
  const hasRandomCard = randomCard && randomCard.style.display !== 'none';

  const searchStats = document.getElementById('searchStats');
  if (searchStats) {
    if (hasRandomCard) {
      searchStats.textContent = `Showing ${nonRandomCards.length + 1} of ${nonRandomCards.length + 1} lessons`;
    } else {
      searchStats.textContent = `Showing ${nonRandomCards.length} of ${nonRandomCards.length} lessons`;
    }
  }
}

var _cursorHoverDelegated = false;
function initCursorHover() {
  if (_cursorHoverDelegated) return;
  var cursor = document.getElementById('custom-cursor');
  if (!cursor) return;
  _cursorHoverDelegated = true;
  var grid = document.getElementById('allLessonsGrid');
  if (grid) {
    grid.addEventListener('mouseenter', function(e) {
      if (e.target.closest('.lesson-card')) cursor.classList.add('hover');
    }, true);
    grid.addEventListener('mouseleave', function(e) {
      if (e.target.closest('.lesson-card')) cursor.classList.remove('hover');
    }, true);
  }
}

window.pageLoadTime = Date.now();
window.matrixColor = '#c27c15';

const LOCAL_ACTIVE_FAVICON = 'cuh.png';
const LOCAL_INACTIVE_FAVICON = 'images/fruh.png';
const LOCAL_DEFAULT_LOGO = 'images/logo.png';

const canvas = document.getElementById('matrix-bg');
const ctx = canvas ? canvas.getContext('2d') : null;
const backgroundRoot = document.getElementById('background-root');
const pathsLayer = document.getElementById('paths-layer');
const starfieldLayer = document.getElementById('starfield-layer');
const backgroundGlow = document.getElementById('background-glow');

const backgroundState = {
  active: 'none',
  animationFrame: null,
  resizeTimeout: null,
  boostUntil: 0,
  lastRenderAt: 0,
  isPaused: typeof document !== 'undefined' && document.visibilityState === 'hidden',
  starfieldBoostTimeout: null,
  starfieldEnabled: false,
  matrix: { drops: [], speeds: [], lengths: [], streams: [], lastRows: [], columns: 0, fontSize: 16, gap: 0, resetFrames: 0, lastColorKey: '' },
  languageRain: { drops: [], speeds: [], lengths: [], streams: [], lastRows: [], columns: 0, fontSize: 17, gap: 20, resetFrames: 0, lastColorKey: '' },
  paths: { items: [], colorKey: '' },
  topography: { tick: 0 },
  constellation: { nodes: [], mouseX: -1000, mouseY: -1000, initialized: false },
  particleField: { particles: [], ripples: [], bursts: [], time: 0, mouseX: -9999, mouseY: -9999, initialized: false },
};

// Visual mode is intentionally limited to plain black or matrix.
window.__useForcedGridBackground = false;
const BACKGROUND_BODY_CLASSES = [
  'background-none',
  'background-matrix',
];

function useForcedGridBackground(style = backgroundState.active) {
  return false;
}

const matrixNumberGlyphs = 'ｦｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEF'.split('');
const languageRainKanaGlyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヰヱヲンァィゥェォッャュョヵヶ'.split('');
const languageRainHanGlyphs = '零電光影夜雨火風心刀龍空界幻機網回路信号暗号天地玄黃白虎青龍朱雀玄武風林火山夢術神雷雲月夜雪桜魂鏡詠'.split('');
const languageRainAsciiGlyphs = '01<>[]{}$#*+-=:;¦/\\'.split('');

function initForcedGridMotion() {
  if (!window.__useForcedGridBackground || !backgroundRoot || window.__siteGridMotionInitialized) return;
  window.__siteGridMotionInitialized = true;

  const motion = {
    x: 0,
    y: 0,
    lastTime: 0
  };
  const speedX = 4.8;
  const speedY = -3.2;
  const tileSize = 106;
  const wrapPositive = (value, size) => ((value % size) + size) % size;
  const wrapNegative = (value, size) => -wrapPositive(-value, size);

  const tick = (now) => {
    if (!backgroundRoot) return;
    if (!motion.lastTime) motion.lastTime = now;
    const deltaMs = Math.min(32, now - motion.lastTime);
    motion.lastTime = now;
    const delta = deltaMs / 1000;

    // Smooth diagonal drift: right and up, slowed down to reduce visible grid jitter.
    motion.x = wrapPositive(motion.x + speedX * delta, tileSize);
    motion.y = wrapNegative(motion.y + speedY * delta, tileSize);

    const style = backgroundRoot.style;
    style.setProperty('--site-grid-x', `${motion.x.toFixed(2)}px`);
    style.setProperty('--site-grid-y', `${motion.y.toFixed(2)}px`);

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

initForcedGridMotion();

function hexToRgbObject(hex) {
  const cleanHex = (hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) return { r: 194, g: 124, b: 21 };
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16)
  };
}

function rgbStringToObject(rgbValue) {
  const parts = (rgbValue || '').match(/\d+/g);
  if (!parts || parts.length < 3) return null;
  return { r: Number(parts[0]), g: Number(parts[1]), b: Number(parts[2]) };
}

function getThemePrimaryColor() {
  const cssColor = getComputedStyle(document.body)
    .getPropertyValue('--primary-orange')
    .trim();
  if (!cssColor) return '#c27c15';
  if (cssColor.startsWith('#')) return cssColor;
  const parsedRgb = rgbStringToObject(cssColor);
  if (!parsedRgb) return '#c27c15';
  return `#${[parsedRgb.r, parsedRgb.g, parsedRgb.b]
    .map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
    .join('')}`;
}

function getBackgroundColorRGB() {
  return hexToRgbObject(getThemePrimaryColor());
}

function clampColorValue(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixRgb(base, target, ratio) {
  return {
    r: clampColorValue(base.r + (target.r - base.r) * ratio),
    g: clampColorValue(base.g + (target.g - base.g) * ratio),
    b: clampColorValue(base.b + (target.b - base.b) * ratio)
  };
}

function alphaRgb(color, alpha) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function getBackgroundBoost(now = performance.now()) {
  return now < backgroundState.boostUntil ? 2.6 : 1;
}

function syncBackgroundGlow() {
  if (backgroundRoot) backgroundRoot.style.background = '#000';
  if (backgroundGlow) backgroundGlow.style.background = 'none';
  return;
  // Neutral dark base + accent-tinted glow for all canvas backgrounds
  // No hardcoded green/blue — everything derives from the accent color
}

function resizeBackgroundCanvas() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clearBackgroundCanvas() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function stopBackgroundLoop() {
  if (backgroundState.animationFrame) {
    cancelAnimationFrame(backgroundState.animationFrame);
    backgroundState.animationFrame = null;
  }
}

function startBackgroundIfVisible() {
  if (document.hidden) {
    backgroundState.isPaused = true;
    return;
  }

  if (backgroundState.active !== 'matrix') {
    backgroundState.isPaused = true;
    stopBackgroundLoop();
    clearBackgroundCanvas();
    return;
  }

  backgroundState.isPaused = false;
  startBackgroundLoop();
}

function normalizeBackgroundStyle(style) {
  const allowed = ['none', 'matrix'];
  if (!allowed.includes(style)) return 'none';
  return style;
}

// ── Per-background settings ──────────────────────────────────────────────────
var BG_SETTING_DEFAULTS = {
  'none':           {},
  'matrix':         { speed: 1.0, fontSize: 16, trailLength: 18 }
};
function getBackgroundSettings(name) {
  try {
    var stored = JSON.parse(localStorage.getItem('bgSettings_' + name) || '{}');
    return Object.assign({}, BG_SETTING_DEFAULTS[name] || {}, stored);
  } catch(e) { return Object.assign({}, BG_SETTING_DEFAULTS[name] || {}); }
}
function setBackgroundSetting(name, key, val) {
  try {
    var stored = JSON.parse(localStorage.getItem('bgSettings_' + name) || '{}');
    stored[key] = val;
    localStorage.setItem('bgSettings_' + name, JSON.stringify(stored));
  } catch(e) {}
}
function resetBackgroundSettings(name) {
  localStorage.removeItem('bgSettings_' + name);
}
// ─────────────────────────────────────────────────────────────────────────────

function buildGlyphStream(layerKey, length) {
  const pickGlyph = layerKey === 'languageRain' ? pickLanguageRainGlyph : pickMatrixClassicGlyph;
  return Array.from({ length: Math.max(1, length) }, function () {
    return pickGlyph();
  });
}

function initGlyphDrops(key, forceReset = false) {
  if (!canvas) return;
  const layer = backgroundState[key];
  const fontSize = layer.fontSize;
  const stride = fontSize + (layer.gap || 2);
  const spawnRange = key === 'languageRain' ? 22 : 28;
  layer.columns = Math.max(1, Math.floor(window.innerWidth / stride));
  layer.drops = Array.from({ length: layer.columns }, () =>
    -Math.floor(Math.random() * spawnRange)
  );
  layer.speeds = Array.from({ length: layer.columns }, () =>
    key === 'languageRain'
      ? 0.10 + Math.random() * 0.06
      : 0.72 + Math.random() * 0.34
  );
  layer.lengths = Array.from({ length: layer.columns }, () =>
    key === 'languageRain'
      ? 8 + Math.floor(Math.random() * 6)
      : 14 + Math.floor(Math.random() * 8)
  );
  layer.streams = layer.lengths.map(function (length) {
    return buildGlyphStream(key, length + 2);
  });
  layer.lastRows = layer.drops.map(function (drop) {
    return Math.floor(drop);
  });
  if (forceReset) {
    layer.resetFrames = 14;
  }
}

function pickMatrixClassicGlyph() {
  return matrixNumberGlyphs[(Math.random() * matrixNumberGlyphs.length) | 0];
}

function getNextMatrixGlyph(previousGlyph, trailingGlyph) {
  if (previousGlyph === '0' || previousGlyph === '1') {
    const opposite = previousGlyph === '0' ? '1' : '0';
    if (trailingGlyph === previousGlyph && Math.random() > 0.18) {
      return opposite;
    }
    return Math.random() > 0.46 ? opposite : previousGlyph;
  }
  return pickMatrixClassicGlyph();
}

function pickLanguageRainGlyph() {
  const roll = Math.random();
  if (roll > 0.92) {
    return languageRainHanGlyphs[(Math.random() * languageRainHanGlyphs.length) | 0];
  }
  if (roll > 0.72) {
    return languageRainAsciiGlyphs[(Math.random() * languageRainAsciiGlyphs.length) | 0];
  }
  return languageRainKanaGlyphs[(Math.random() * languageRainKanaGlyphs.length) | 0];
}

function renderMatrixBackground(now) {
  if (!canvas || !ctx) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const layer = backgroundState.matrix;
  const matrixSettings = getBackgroundSettings('matrix');
  const fontSize = Math.max(10, Math.round(matrixSettings.fontSize || 16));
  const speed = Math.max(0.35, Number(matrixSettings.speed || 1));
  const colorKey = String(window.matrixColor || getThemePrimaryColor() || '#c27c15');
  const columnCount = Math.max(1, Math.floor(width / fontSize));

  layer.fontSize = fontSize;

  if (!layer.drops.length || layer.columns !== columnCount || layer.lastColorKey !== colorKey) {
    layer.columns = columnCount;
    layer.lastColorKey = colorKey;
    layer.drops = Array.from({ length: columnCount }, function () {
      return 1 + Math.floor(Math.random() * Math.max(1, Math.ceil(height / fontSize)));
    });
    ctx.clearRect(0, 0, width, height);
  }

  ctx.fillStyle = 'rgba(5, 7, 11, 0.05)';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = colorKey;

  for (let i = 0; i < layer.drops.length; i += 1) {
    const glyph = matrixNumberGlyphs[(Math.random() * matrixNumberGlyphs.length) | 0];
    ctx.fillText(glyph, i * fontSize, layer.drops[i] * fontSize);

    if (layer.drops[i] * fontSize > height && Math.random() > 0.975) {
      layer.drops[i] = 0;
    }

    layer.drops[i] += speed;
  }
}

function renderLanguageRainBackground(now) {
  if (!canvas || !ctx) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const layer = backgroundState.languageRain;
  const lrSettings = getBackgroundSettings('language-rain');
  const baseColor = getBackgroundColorRGB();
  // Use bright accent-tinted glyph colors — no hardcoded blue background
  const glyphColor = mixRgb(baseColor, { r: 255, g: 255, b: 255 }, 0.10);
  const headColor  = mixRgb(baseColor, { r: 255, g: 255, b: 255 }, 0.55);
  const glowColor  = mixRgb(baseColor, { r: 255, g: 255, b: 255 }, 0.25);
  const colorKey = `langrain-${baseColor.r}-${baseColor.g}-${baseColor.b}`;

  // Sync settings live
  const settingsFontSize = Math.round(lrSettings.fontSize || 17);
  if (layer.fontSize !== settingsFontSize) {
    layer.fontSize = settingsFontSize;
    initGlyphDrops('languageRain', true);
    ctx.clearRect(0, 0, width, height);
  }

  const stride = layer.fontSize + (layer.gap || 2);
  if (!layer.drops.length || layer.columns !== Math.max(1, Math.floor(width / stride))) {
    initGlyphDrops('languageRain');
  }

  if (layer.lastColorKey !== colorKey) {
    layer.lastColorKey = colorKey;
    layer.resetFrames = Math.max(layer.resetFrames, 22);
    initGlyphDrops('languageRain');
    ctx.clearRect(0, 0, width, height);
  }

  // Plain black clearing — no color contamination
  const clearingAlpha = layer.resetFrames > 0 ? 0.13 : 0.06;
  ctx.fillStyle = `rgba(0,0,0,${clearingAlpha})`;
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `600 ${layer.fontSize}px "Yu Gothic","Hiragino Sans","Noto Sans JP",monospace`;
  ctx.shadowColor = alphaRgb(glowColor, 0.5);
  ctx.shadowBlur = 9;

  const speedMultiplier = lrSettings.speed || 1.0;
  const speedBoost = Math.min(3.1, speedMultiplier * 0.88 + (getBackgroundBoost(now) - 1) * 0.08);
  const visibleRows = Math.max(1, Math.ceil(height / layer.fontSize));

  for (let i = 0; i < layer.drops.length; i++) {
    const x = Math.round(i * stride + layer.fontSize * 0.5);
    const settingsTrailLength = Math.round(lrSettings.trailLength || 10);
    const trailLength = layer.lengths[i] || settingsTrailLength;
    const stream = layer.streams[i] || buildGlyphStream('languageRain', trailLength + 2);
    if (!layer.streams[i]) layer.streams[i] = stream;

    // Use modulo-wrapping like matrix (no drift off bottom)
    const currentRow = ((Math.floor(layer.drops[i]) % visibleRows) + visibleRows) % visibleRows;
    if (layer.lastRows[i] !== currentRow) {
      stream.unshift(pickLanguageRainGlyph());
      stream.length = trailLength + 2;
      layer.lastRows[i] = currentRow;
    }

    for (let step = trailLength; step >= 1; step--) {
      const trailRow = (currentRow - step + visibleRows) % visibleRows;
      const trailY = Math.round(trailRow * layer.fontSize);
      const alpha = Math.max(0.06, 0.38 - step * 0.034);
      ctx.fillStyle = alphaRgb(glyphColor, alpha);
      ctx.fillText(stream[Math.min(step, stream.length - 1)] || 'ア', x, trailY);
    }

    const headY = Math.round(currentRow * layer.fontSize);
    ctx.fillStyle = alphaRgb(headColor, Math.random() > 0.82 ? 1.0 : 0.92);
    ctx.fillText(stream[0] || 'ア', x, headY);

    layer.drops[i] += layer.speeds[i] * speedBoost;
    if (layer.drops[i] >= visibleRows) layer.drops[i] -= visibleRows;
  }

  ctx.shadowBlur = 0;

  if (layer.resetFrames > 0) layer.resetFrames -= 1;
}

function updateBackgroundSelectionUI() {
  document.querySelectorAll('.background-option').forEach(option => {
    option.classList.toggle('active', option.dataset.background === backgroundState.active);
  });
  var sel = document.getElementById('backgroundSelect');
  if (sel) sel.value = backgroundState.active;
  document.querySelectorAll('.bg-controls').forEach(function(el) {
    el.style.display = el.dataset.bg === backgroundState.active ? 'block' : 'none';
  });
  var s = getBackgroundSettings(backgroundState.active);
  document.querySelectorAll('.bg-slider[data-bg="' + backgroundState.active + '"]').forEach(function(slider) {
    var key = slider.dataset.key;
    if (s[key] !== undefined) {
      slider.value = s[key];
      var valEl = document.getElementById('bgVal_' + backgroundState.active + '_' + key);
      if (valEl) valEl.textContent = s[key];
    }
  });
}

function onBgSlider(el) {
  var bg = el.dataset.bg;
  var key = el.dataset.key;
  var val = parseFloat(el.value);
  setBackgroundSetting(bg, key, val);
  var valEl = document.getElementById('bgVal_' + bg + '_' + key);
  if (valEl) valEl.textContent = val;
  if (bg === 'matrix') {
    backgroundState.matrix.fontSize = Math.round(getBackgroundSettings('matrix').fontSize || 11);
    backgroundState.matrix.lengths = backgroundState.matrix.lengths.map(function() {
      return Math.round(getBackgroundSettings('matrix').trailLength || 16);
    });
    initGlyphDrops('matrix', true);
  }
}

function resetCurrentBgSettings() {
  resetBackgroundSettings(backgroundState.active);
  if (backgroundState.active === 'matrix') {
    backgroundState.matrix.fontSize = 11;
    initGlyphDrops('matrix', true);
  }
  updateBackgroundSelectionUI();
}

function ensurePathSvg() {
  if (!pathsLayer) return;
  const { r, g, b } = getBackgroundColorRGB();
  const colorKey = `${r},${g},${b}`;
  if (backgroundState.paths.items.length && backgroundState.paths.colorKey === colorKey) return;

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', '0 0 696 316');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

  const pathItems = [];
  const count = 28;

  const makePath = (i) => {
    const d = `M-${380 - i * 5} -${189 + i * 6}C-${380 - i * 5} -${189 + i * 6} -${312 - i * 5} ${216 - i * 6} ${152 - i * 5} ${343 - i * 6}C${616 - i * 5} ${470 - i * 6} ${684 - i * 5} ${875 - i * 6} ${684 - i * 5} ${875 - i * 6}`;
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', `rgb(${r}, ${g}, ${b})`);
    path.setAttribute('stroke-width', String(0.5 + i * 0.028));
    path.style.opacity = String(Math.min(0.9, 0.12 + i * 0.017));
    svg.appendChild(path);
    return {
      el: path,
      duration: 18 + (i % 9) * 1.4,
      baseOpacity: Math.min(0.9, 0.12 + i * 0.017),
      phase: i / count,
    };
  };

  for (let i = 0; i < count; i++) pathItems.push(makePath(i));

  pathsLayer.innerHTML = '';
  pathsLayer.appendChild(svg);

  backgroundState.paths.items = pathItems.map(item => ({
    ...item,
    length: Math.max(1, item.el.getTotalLength())
  }));
  backgroundState.paths.colorKey = colorKey;
}

function renderPathsBackground(now) {
  ensurePathSvg();
  const speed = getBackgroundBoost(now);
  const t = (now / 1000) * speed;
  for (const path of backgroundState.paths.items) {
    const phaseTime = (t / path.duration) + path.phase;
    const wave = 0.5 + 0.5 * Math.sin((phaseTime * Math.PI * 2) + path.phase * 4.7);
    const drawLen = path.length * (0.24 + wave * 0.53);
    path.el.style.strokeDasharray = `${drawLen} ${path.length}`;
    path.el.style.strokeDashoffset = `${-(phaseTime * path.length * 1.35)}`;
    path.el.style.opacity = String(Math.max(0.08, path.baseOpacity * (0.56 + wave * 0.78)));
  }
}

function renderTopographyBackground(now) {
  if (!canvas || !ctx) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const { r, g, b } = getBackgroundColorRGB();
  const speed = 1 + (getBackgroundBoost(now) - 1) * 0.55;

  backgroundState.topography.tick += 0.008 * speed;
  const t = backgroundState.topography.tick;

  ctx.fillStyle = 'rgb(5, 8, 12)';
  ctx.fillRect(0, 0, width, height);

  const lineCount = Math.max(16, Math.floor(height / 42));
  const spacing = height / (lineCount - 1);
  const padding = 80;

  const terrain = (x, phase) =>
    Math.sin(x * 0.0032 + phase * 0.9) * 30 +
    Math.sin(x * 0.0058 + phase * 0.6) * 24 +
    Math.sin(x * 0.0019 - phase * 0.45) * 40 +
    Math.sin(x * 0.0074 + phase * 1.1) * 14;

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.34)`;
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < lineCount; i++) {
    const baseY = spacing * i;
    ctx.beginPath();
    let started = false;
    for (let x = -padding; x <= width + padding; x += 4.2) {
      const y = baseY + terrain(x + i * 110, t);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.16)`;
  for (let i = 0; i < lineCount; i += 2) {
    const baseY = spacing * i + spacing * 0.35;
    ctx.beginPath();
    let started = false;
    for (let x = -padding; x <= width + padding; x += 5.6) {
      const y = baseY + terrain(x + i * 85, t * 0.83);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
}

function initConstellationNodes() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const count = Math.max(40, Math.min(88, Math.floor((width * height) / 25000)));
  backgroundState.constellation.nodes = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.62,
    vy: (Math.random() - 0.5) * 0.62,
    radius: 0.8 + Math.random() * 1.8
  }));
  backgroundState.constellation.initialized = true;
}

function renderConstellationBackground(now) {
  if (!canvas || !ctx) return;
  if (!backgroundState.constellation.initialized || !backgroundState.constellation.nodes.length) {
    initConstellationNodes();
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const { r, g, b } = getBackgroundColorRGB();
  const boost = 1.28 + (getBackgroundBoost(now) - 1) * 0.12;
  const nodes = backgroundState.constellation.nodes;
  const mouseRadius = 140;
  const driftX = Math.sin(now / 2800) * 0.016;
  const driftY = Math.cos(now / 3200) * 0.014;

  ctx.fillStyle = alphaRgb(mixRgb({ r: 6, g: 9, b: 14 }, { r, g, b }, 0.07), 1);
  ctx.fillRect(0, 0, width, height);

  for (const node of nodes) {
    const dxMouse = node.x - backgroundState.constellation.mouseX;
    const dyMouse = node.y - backgroundState.constellation.mouseY;
    const distMouse = Math.hypot(dxMouse, dyMouse);
    if (distMouse < mouseRadius && distMouse > 0) {
      const force = ((mouseRadius - distMouse) / mouseRadius) * 0.022 * boost;
      node.vx += (dxMouse / distMouse) * force;
      node.vy += (dyMouse / distMouse) * force;
    }

    node.x += node.vx * boost;
    node.y += node.vy * boost;

    node.vx *= 0.992;
    node.vy *= 0.992;
    node.vx += driftX + (Math.random() - 0.5) * 0.012;
    node.vy += driftY + (Math.random() - 0.5) * 0.012;

    if (node.x < 0 || node.x > width) {
      node.vx *= -1;
      node.x = Math.max(0, Math.min(width, node.x));
    }
    if (node.y < 0 || node.y > height) {
      node.vy *= -1;
      node.y = Math.max(0, Math.min(height, node.y));
    }
  }

  const connectionDistance = 182;
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.58)`;
  ctx.lineWidth = 1.35;
  ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.24)`;
  ctx.shadowBlur = 6;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distance = Math.hypot(dx, dy);
      if (distance < connectionDistance) {
        const alpha = (1 - distance / connectionDistance) * 0.96;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  for (const node of nodes) {
    const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 4.2);
    glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.28)`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius * 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.95)`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Particle Field ─────────────────────────────────────────────────────────
function initParticleField(forceReset) {
  var st = backgroundState.particleField;
  var w = window.innerWidth;
  var h = window.innerHeight;
  var spacing = 52;
  var margin = 1;
  var cols = Math.ceil(w / spacing) + margin * 2 + 1;
  var rows = Math.ceil(h / spacing) + margin * 2 + 1;
  var n = cols * rows;
  if (forceReset || !st.initialized) {
    var jitter = spacing * 0.08;
    // flat typed arrays for particle state — zero GC, cache-friendly
    st.px  = new Float32Array(n); // x
    st.py  = new Float32Array(n); // y
    st.pvx = new Float32Array(n); // vx
    st.pvy = new Float32Array(n); // vy
    st.pbx = new Float32Array(n); // baseX
    st.pby = new Float32Array(n); // baseY
    st.psz = new Float32Array(n); // size
    // pre-compute trig phase components so sin/cos only called TWICE per frame (not per-dot)
    st.psinY = new Float32Array(n); // sin(baseY * 0.012)
    st.pcosY = new Float32Array(n); // cos(baseY * 0.012)
    st.psinX = new Float32Array(n); // sin(baseX * 0.012)
    st.pcosX = new Float32Array(n); // cos(baseX * 0.012)
    st.pn = n;
    for (var i = 0; i < n; i++) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var bx = (col - margin) * spacing;
      var by = (row - margin) * spacing;
      st.pbx[i] = bx; st.pby[i] = by;
      st.px[i]  = bx + (Math.random() - 0.5) * jitter;
      st.py[i]  = by + (Math.random() - 0.5) * jitter;
      st.pvx[i] = 0; st.pvy[i] = 0;
      st.psz[i] = 1.35 + Math.random() * 0.7;
      st.psinY[i] = Math.sin(by * 0.012); st.pcosY[i] = Math.cos(by * 0.012);
      st.psinX[i] = Math.sin(bx * 0.012); st.pcosX[i] = Math.cos(bx * 0.012);
    }
    // pre-allocated draw buckets — 4 opacity levels, reused every frame (no GC)
    st.bx = [new Float32Array(n), new Float32Array(n), new Float32Array(n), new Float32Array(n)];
    st.by = [new Float32Array(n), new Float32Array(n), new Float32Array(n), new Float32Array(n)];
    st.bs = [new Float32Array(n), new Float32Array(n), new Float32Array(n), new Float32Array(n)];
    st.bn = [0, 0, 0, 0];
    st.ripples = [];
    st.bursts = [];
    st.time = 0;
    st.spacing = spacing;
    st.initialized = true;
  }
}

function _pfDrawPolygon(x, y, sides, size, rotation) {
  ctx.beginPath();
  for (var i = 0; i < sides; i++) {
    var angle = rotation + (i * 6.2832) / sides;
    var px = x + size * Math.cos(angle);
    var py = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function renderParticleFieldBackground(now) {
  if (!canvas || !ctx) return;
  var w = window.innerWidth;
  var h = window.innerHeight;
  var rgb = getBackgroundColorRGB();
  var dotColor = rgb.r + ',' + rgb.g + ',' + rgb.b;
  var st = backgroundState.particleField;
  if (!st.initialized) initParticleField(true);

  ctx.fillStyle = 'rgba(4,5,9,1)';
  ctx.fillRect(0, 0, w, h);

  var mx = st.mouseX, my = st.mouseY;
  var spacing   = st.spacing || 52;
  var waveAmp   = spacing * 0.12;
  var spring    = 0.018;
  var friction  = 0.895;
  var repR      = 135;
  var repR2     = repR * repR;
  var maxOff    = spacing * 1.6;
  var maxOff2   = maxOff * maxOff;
  var edgePad   = spacing * 4;
  var ripRing   = 22;
  var ripSpeed  = 0.95; // px/ms

  // advance time; compute sin/cos of T ONCE — used for all dots via angle-sum identity
  st.time += 0.01;
  var T = st.time;
  var sinT = Math.sin(T), cosT = Math.cos(T);

  // ripple states (timestamp-based — frame-drop safe)
  var maxRipR = Math.max(w, h) * 0.65;
  var nRip = 0, ripX = st._ripX, ripY = st._ripY, ripRad = st._ripRad, ripLife = st._ripLife;
  // lazy-alloc small ripple scratch arrays (max 3)
  if (!ripX) { ripX = st._ripX = new Float32Array(3); ripY = st._ripY = new Float32Array(3);
               ripRad = st._ripRad = new Float32Array(3); ripLife = st._ripLife = new Float32Array(3); }
  var nextRipples = [];
  for (var ri = 0; ri < st.ripples.length; ri++) {
    var rip0 = st.ripples[ri];
    var age0 = now - rip0.startedAt;
    var rad0 = age0 * ripSpeed;
    var life0 = 1 - rad0 / maxRipR;
    if (life0 > 0) {
      ripX[nRip] = rip0.x; ripY[nRip] = rip0.y;
      ripRad[nRip] = rad0; ripLife[nRip] = life0;
      nRip++; nextRipples.push(rip0);
    }
  }
  st.ripples = nextRipples;

  // reset bucket counters (typed arrays already allocated in init)
  st.bn[0] = st.bn[1] = st.bn[2] = st.bn[3] = 0;

  var n = st.pn;
  var px = st.px, py = st.py, pvx = st.pvx, pvy = st.pvy;
  var pbx = st.pbx, pby = st.pby, psz = st.psz;
  var psinY = st.psinY, pcosY = st.pcosY, psinX = st.psinX, pcosX = st.pcosX;
  var bx0 = st.bx[0], by0 = st.by[0], bs0 = st.bs[0];
  var bx1 = st.bx[1], by1 = st.by[1], bs1 = st.bs[1];
  var bx2 = st.bx[2], by2 = st.by[2], bs2 = st.bs[2];
  var bx3 = st.bx[3], by3 = st.by[3], bs3 = st.bs[3];

  for (var i = 0; i < n; i++) {
    // wave target via angle-sum: sin(T + phase) = sinT*cos(phase) + cosT*sin(phase)
    // eliminates per-dot sin/cos calls entirely
    var waveX = (sinT * pcosY[i] + cosT * psinY[i]) * waveAmp;
    var waveY = (cosT * pcosX[i] - sinT * psinX[i]) * waveAmp;
    var tX = pbx[i] + waveX, tY = pby[i] + waveY;
    pvx[i] += (tX - px[i]) * spring;
    pvy[i] += (tY - py[i]) * spring;

    // mouse repulsion + swirl
    var dx = px[i] - mx, dy = py[i] - my;
    var d2 = dx * dx + dy * dy;
    var near = 0;
    if (d2 < repR2 && d2 > 0) {
      var d = Math.sqrt(d2);
      var f = (repR - d) / repR;
      pvx[i] += (dx / d) * f * 1.74 + (-dy / d) * f * 0.3;
      pvy[i] += (dy / d) * f * 1.74 + ( dx / d) * f * 0.3;
      near = 1 - d / repR;
    }

    // ripple impulse + boost — AABB reject first
    var boost = 0;
    for (var ri2 = 0; ri2 < nRip; ri2++) {
      var rx = px[i] - ripX[ri2], ry = py[i] - ripY[ri2];
      var rEdge = ripRad[ri2] + ripRing;
      if (rx > rEdge || rx < -rEdge || ry > rEdge || ry < -rEdge) continue;
      var rD = Math.sqrt(rx * rx + ry * ry);
      var diff = rD - ripRad[ri2];
      if (diff > -ripRing && diff < ripRing && rD > 0) {
        var pulse = (1 - Math.abs(diff) / ripRing) * ripLife[ri2];
        if (pulse > boost) boost = pulse;
        pvx[i] += (rx / rD) * pulse * 2.2;
        pvy[i] += (ry / rD) * pulse * 2.2;
      }
    }

    pvx[i] *= friction; pvy[i] *= friction;
    px[i] += pvx[i];   py[i] += pvy[i];

    // soft clamp
    var ox = px[i] - tX, oy = py[i] - tY;
    var od2 = ox * ox + oy * oy;
    if (od2 > maxOff2) {
      var od = Math.sqrt(od2);
      var ovf = od - maxOff;
      var onx = ox / od, ony = oy / od;
      var cor = Math.min(ovf, spacing * 0.55);
      px[i]  -= onx * cor * 0.26; py[i]  -= ony * cor * 0.26;
      pvx[i] -= onx * cor * 0.052; pvy[i] -= ony * cor * 0.052;
    }

    if (px[i] < -edgePad || px[i] > w + edgePad || py[i] < -edgePad || py[i] > h + edgePad) continue;

    // bucket by activity — 4 opacity levels, zero per-frame allocation
    var sz = psz[i] * (1 + near * 1.25 + boost * 1.6);
    if (near < 0.01 && boost < 0.01) {
      var b0 = st.bn[0]++; bx0[b0] = px[i]; by0[b0] = py[i]; bs0[b0] = sz;
    } else {
      var op = 0.2 + near * 0.62 + boost * 0.55;
      if (op < 0.45)      { var b1 = st.bn[1]++; bx1[b1] = px[i]; by1[b1] = py[i]; bs1[b1] = sz; }
      else if (op < 0.70) { var b2 = st.bn[2]++; bx2[b2] = px[i]; by2[b2] = py[i]; bs2[b2] = sz; }
      else                { var b3 = st.bn[3]++; bx3[b3] = px[i]; by3[b3] = py[i]; bs3[b3] = sz; }
    }
  }

  // 4 batched draw calls — all size variation handled within each batch's arc() calls
  var base = 'rgba(' + dotColor + ',';
  var alphas = [0.22, 0.45, 0.70, 0.92];
  var bufsX = [bx0, bx1, bx2, bx3], bufsY = [by0, by1, by2, by3], bufsS = [bs0, bs1, bs2, bs3];
  for (var bi = 0; bi < 4; bi++) {
    var cnt = st.bn[bi];
    if (!cnt) continue;
    var bxA = bufsX[bi], byA = bufsY[bi], bsA = bufsS[bi];
    ctx.fillStyle = base + alphas[bi] + ')';
    ctx.beginPath();
    for (var j = 0; j < cnt; j++) {
      ctx.moveTo(bxA[j] + bsA[j], byA[j]);
      ctx.arc(bxA[j], byA[j], bsA[j], 0, 6.2832);
    }
    ctx.fill();
  }

  // burst shapes — click outlines
  if (st.bursts.length) {
    ctx.lineWidth = 2;
    var alive = [];
    for (var bi2 = 0; bi2 < st.bursts.length; bi2++) {
      var sh = st.bursts[bi2];
      var life2 = 1 - (now - sh.startedAt) / sh.ttl;
      if (life2 <= 0) continue;
      sh.vx *= 0.985; sh.vy *= 0.985;
      sh.x += sh.vx * 1.8; sh.y += sh.vy * 1.8;
      sh.rotation += sh.rotationSpeed;
      ctx.strokeStyle = base + (0.28 * life2).toFixed(3) + ')';
      if (sh.kind === 'plus') {
        var sp = sh.size * 0.75;
        ctx.beginPath();
        ctx.moveTo(sh.x - sp, sh.y); ctx.lineTo(sh.x + sp, sh.y);
        ctx.moveTo(sh.x, sh.y - sp); ctx.lineTo(sh.x, sh.y + sp);
        ctx.stroke();
      } else if (sh.kind === 'diamond') {
        _pfDrawPolygon(sh.x, sh.y, 4, sh.size, sh.rotation + Math.PI / 4); ctx.stroke();
      } else {
        _pfDrawPolygon(sh.x, sh.y, sh.sides, sh.size, sh.rotation); ctx.stroke();
      }
      alive.push(sh);
    }
    st.bursts = alive.length > 120 ? alive.slice(-120) : alive;
  }
}

document.addEventListener('click', function(e) {
  if (backgroundState.active !== 'particle-field' || backgroundState.isPaused) return;
  var st = backgroundState.particleField;
  var now = performance.now();
  // timestamp-based ripple (frame-drop safe, matches original React impl)
  st.ripples.push({ x: e.clientX, y: e.clientY, startedAt: now });
  if (st.ripples.length > 3) st.ripples = st.ripples.slice(-3);
  // burst shapes — polygon/diamond/plus outlines that fly outward
  var burstCount = 13;
  for (var i = 0; i < burstCount; i++) {
    var angle = Math.random() * 6.2832;
    var speed = 1.4 + Math.random() * 2.8;
    var kindRoll = Math.random();
    var kind = kindRoll < 0.65 ? 'poly' : kindRoll < 0.85 ? 'diamond' : 'plus';
    st.bursts.push({
      x: e.clientX, y: e.clientY,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      rotation: Math.random() * 6.2832,
      rotationSpeed: (Math.random() - 0.5) * 0.08,
      size: 9 + Math.random() * 16,
      sides: 3 + Math.floor(Math.random() * 4),
      kind: kind,
      startedAt: now,
      ttl: 900 + Math.random() * 700
    });
  }
  if (st.bursts.length > 80) st.bursts = st.bursts.slice(-80);
}, { passive: true });
// ──────────────────────────────────────────────────────────────────────────────

function loopBackground(now) {
  if (backgroundState.isPaused || document.hidden) {
    stopBackgroundLoop();
    return;
  }

  if (backgroundState.active !== 'matrix') {
    clearBackgroundCanvas();
    stopBackgroundLoop();
    return;
  }

  if (now - backgroundState.lastRenderAt < 1000 / 18) {
    backgroundState.animationFrame = requestAnimationFrame(loopBackground);
    return;
  }
  backgroundState.lastRenderAt = now;

  renderMatrixBackground(now);
  backgroundState.animationFrame = requestAnimationFrame(loopBackground);
}

function startBackgroundLoop() {
  if (document.hidden) {
    backgroundState.isPaused = true;
    return;
  }
  stopBackgroundLoop();
  backgroundState.isPaused = false;
  backgroundState.lastRenderAt = 0;
  backgroundState.animationFrame = requestAnimationFrame(loopBackground);
}

function initStarfieldBackground() {
  if (!starfieldLayer || !window.Starfield) return false;
  try {
    starfieldLayer.innerHTML = '';
    const { r, g, b } = getBackgroundColorRGB();
    const diag = Math.hypot(window.innerWidth, window.innerHeight);
    Starfield.setup({
      container: starfieldLayer,
      auto: false,
      originX: window.innerWidth / 2,
      originY: window.innerHeight / 2,
      numStars: Math.max(260, Math.min(520, Math.floor((window.innerWidth * window.innerHeight) / 3800))),
      baseSpeed: 1.12,
      trailLength: 1.04,
      starColor: `rgb(${Math.min(255, r + 26)}, ${Math.min(255, g + 26)}, ${Math.min(255, b + 26)})`,
      canvasColor: 'rgb(8, 12, 18)',
      hueJitter: 10,
      maxAcceleration: 12,
      accelerationRate: 0.28,
      decelerationRate: 0.22,
      minSpawnRadius: 30,
      maxSpawnRadius: Math.max(360, Math.min(920, diag * 0.55))
    });
    const starCanvas = starfieldLayer.querySelector('canvas');
    if (!starCanvas) throw new Error('Starfield canvas was not created');
    starCanvas.style.zIndex = '0';
    starCanvas.style.opacity = '1';
    backgroundState.starfieldEnabled = true;
    return true;
  } catch (error) {
    console.error('Starfield initialization failed:', error);
    backgroundState.starfieldEnabled = false;
    starfieldLayer.innerHTML = '';
    return false;
  }
}

function cleanupStarfieldBackground() {
  if (backgroundState.starfieldBoostTimeout) {
    clearTimeout(backgroundState.starfieldBoostTimeout);
    backgroundState.starfieldBoostTimeout = null;
  }
  if (window.Starfield && backgroundState.starfieldEnabled) {
    try {
      Starfield.cleanup();
    } catch (error) {
      console.warn('Starfield cleanup warning:', error);
    }
  }
  backgroundState.starfieldEnabled = false;
  if (starfieldLayer) starfieldLayer.innerHTML = '';
}

function triggerBackgroundBoost() {
  backgroundState.boostUntil = performance.now() + 420;
}

function refreshActiveBackground() {
  document.body.classList.remove('gridflow-background-active');
  backgroundState.isPaused = document.hidden;
  resizeBackgroundCanvas();
  syncBackgroundGlow();
  if (pathsLayer) pathsLayer.classList.remove('active');
  if (starfieldLayer) starfieldLayer.classList.remove('active');
  if (backgroundState.starfieldEnabled) cleanupStarfieldBackground();
  backgroundState.boostUntil = 0;
  if (backgroundState.active !== 'matrix') {
    if (canvas) canvas.style.setProperty('opacity', '0', 'important');
    clearBackgroundCanvas();
    stopBackgroundLoop();
    return;
  }
  if (canvas) canvas.style.setProperty('opacity', '1', 'important');
  clearBackgroundCanvas();
  initGlyphDrops('matrix', true);
  if (document.hidden) {
    stopBackgroundLoop();
  } else {
    startBackgroundLoop();
  }
}

function applyBackgroundStyle(style, shouldPersist = true) {
  const nextStyle = normalizeBackgroundStyle(style);
  backgroundState.active = nextStyle;

  if (shouldPersist) {
    localStorage.setItem('selectedBackground', nextStyle);
  }

  document.body.classList.remove(...BACKGROUND_BODY_CLASSES);
  document.body.classList.add(`background-${nextStyle}`);
  document.body.classList.remove('gridflow-background-active');
  updateBackgroundSelectionUI();
  refreshActiveBackground();
}

window.setBackgroundStyle = function (style) {
  applyBackgroundStyle(style, true);
  if (typeof gtag !== 'undefined') {
    gtag('event', 'background_change', {
      'event_category': 'settings',
      'event_label': normalizeBackgroundStyle(style),
      'value': 1
    });
  }
};

let _chromeMoveRaf = 0;
document.addEventListener('mousemove', (event) => {
  backgroundState.constellation.mouseX = event.clientX;
  backgroundState.constellation.mouseY = event.clientY;
  backgroundState.particleField.mouseX = event.clientX;
  backgroundState.particleField.mouseY = event.clientY;
  if (!_chromeMoveRaf) {
    _chromeMoveRaf = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--chrome-mx', `${event.clientX}px`);
      document.documentElement.style.setProperty('--chrome-my', `${event.clientY}px`);
      _chromeMoveRaf = 0;
    });
  }
});

window.addEventListener('blur', () => {
  backgroundState.constellation.mouseX = -1000;
  backgroundState.constellation.mouseY = -1000;
  backgroundState.particleField.mouseX = -9999;
  backgroundState.particleField.mouseY = -9999;
  document.documentElement.style.setProperty('--chrome-mx', '50vw');
  document.documentElement.style.setProperty('--chrome-my', '18vh');
});

document.addEventListener('pointerdown', (event) => {
  const interactive = event.target.closest('button, a, .nav-tab, .lesson-card, .apply-btn, .file-btn, .background-option, .theme-option, input, select, label');
  if (interactive) triggerBackgroundBoost();
});

let carouselResizeTimeout = null;
window.addEventListener('resize', () => {
  if (backgroundState.resizeTimeout) clearTimeout(backgroundState.resizeTimeout);
  backgroundState.resizeTimeout = setTimeout(() => {
    refreshActiveBackground();
  }, 90);

  if (carouselResizeTimeout) clearTimeout(carouselResizeTimeout);
  carouselResizeTimeout = setTimeout(() => {
    buildHomePopularCarousel();
  }, 120);
});

function getFullscreenElementCompat() {
  return document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null;
}

function syncGameFullscreenClasses() {
  const fullscreenEl = getFullscreenElementCompat();
  document.querySelectorAll('.game-frame.fullscreen').forEach(frame => {
    if (frame !== fullscreenEl) {
      frame.classList.remove('fullscreen');
    }
  });
}

document.addEventListener('fullscreenchange', () => {
  ensureNativeCursorState();
  window.__chatGateDebugReason = 'fullscreenchange';
  if (window.__chatGateDebugEnabled) {
    console.log('[chat-gate-debug] fullscreenchange', {
      fullscreenElementId: getFullscreenElementCompat() && getFullscreenElementCompat().id ? getFullscreenElementCompat().id : ''
    });
  }
  syncGameFullscreenClasses();
  syncChatShellFullscreenButton();
  setTimeout(() => refreshActiveBackground(), 70);
});

document.addEventListener('webkitfullscreenchange', () => {
  ensureNativeCursorState();
  window.__chatGateDebugReason = 'webkitfullscreenchange';
  syncGameFullscreenClasses();
  syncChatShellFullscreenButton();
  setTimeout(() => refreshActiveBackground(), 70);
});

document.addEventListener('mozfullscreenchange', () => {
  ensureNativeCursorState();
  window.__chatGateDebugReason = 'mozfullscreenchange';
  syncGameFullscreenClasses();
  syncChatShellFullscreenButton();
  setTimeout(() => refreshActiveBackground(), 70);
});

document.addEventListener('MSFullscreenChange', () => {
  ensureNativeCursorState();
  window.__chatGateDebugReason = 'MSFullscreenChange';
  syncGameFullscreenClasses();
  syncChatShellFullscreenButton();
  setTimeout(() => refreshActiveBackground(), 70);
});

document.addEventListener('visibilitychange', () => {
  backgroundState.isPaused = document.hidden;
  if (document.hidden) {
    stopBackgroundLoop();
    if (backgroundState.active === 'starfield' && backgroundState.starfieldEnabled) {
      cleanupStarfieldBackground();
    }
    return;
  }

  refreshActiveBackground();
  startBackgroundIfVisible();
});

window.addEventListener('beforeunload', () => {
  stopBackgroundLoop();
  cleanupStarfieldBackground();
});

resizeBackgroundCanvas();
syncBackgroundGlow();
(function() {
  var _stored = normalizeBackgroundStyle(localStorage.getItem('selectedBackground') || 'none');
  applyBackgroundStyle(_stored, false);
})();

let currentSortMethod = 'default';
let originalGamesOrder = [...games];
let isSorterOpen = false;

function sortGames(method) {
  if (method === 'default') {
    return [...originalGamesOrder];
  }

  const sortedGames = [...games];

  switch (method) {
    case 'alphabetical':
      sortedGames.sort((a, b) => a.title.localeCompare(b.title));
      break;

    case 'reverse':
      sortedGames.sort((a, b) => b.title.localeCompare(a.title));
      break;

    case 'random':
      for (let i = sortedGames.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sortedGames[i], sortedGames[j]] = [sortedGames[j], sortedGames[i]];
      }
      break;
  }

  return sortedGames;
}

function applySorting() {
  const sortedGames = sortGames(currentSortMethod);
  const allContainer = document.getElementById('allLessonsGrid');

  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput ? searchInput.value : '';

  allContainer.innerHTML = '';
  const fragment = document.createDocumentFragment();

  if (!searchTerm && currentSortMethod === 'default') {
    const randomGame = getRandomGame();
    const randomCard = createGameCard(randomGame, true);
    fragment.appendChild(randomCard);
  }

  sortedGames.forEach(game => {
    const gameCard = createGameCard(game);
    fragment.appendChild(gameCard);
  });

  allContainer.appendChild(fragment);

  const hasRandomCard = !!allContainer.querySelector('.lesson-card[data-random-game="true"] .lesson-image');
  const lessonsTab = document.getElementById('lessonsTab');
  const lessonsVisible = !!(lessonsTab && lessonsTab.classList.contains('active'));
  if (hasRandomCard && lessonsVisible) {
    startImageFlash();
  } else {
    stopImageFlash();
  }

  hydrateDeferredLessonImages(allContainer);
  applyLessonCardPresentation(allContainer);
  setTimeout(() => applyLessonCardPresentation(allContainer), 120);
  syncSavedLessonGridColumns();

  initCursorHover();

  if (searchTerm) {
    performSearch(searchTerm);
  } else {
    updateSearchStats();
  }

  setTimeout(() => {
    initFadeObserver();
  }, 50);

  if (typeof gtag !== 'undefined') {
    gtag('event', 'game_sort', {
      'event_category': 'engagement',
      'event_label': currentSortMethod,
      'value': sortedGames.length
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const sortSelect = document.getElementById('sortSelect');
  const arrow = document.querySelector('.custom-arrow');
  const chatFullscreenGateButton = document.getElementById('chatFullscreenGateButton');
  const chatShell = document.getElementById('chatAppShell');
  const chatSection = document.getElementById('chat-section');
  const chatGate = document.getElementById('chatFullscreenGate');

  if (chatGate) {
    if (chatGate.parentElement !== document.body) {
      document.body.appendChild(chatGate);
    }
    chatGate.removeAttribute('hidden');
  }

  window.__chatGateDebugEnabled = true;
  window.__chatGateDebugReason = 'dom-content-loaded';

  syncChatShellFullscreenButton();

  if (chatFullscreenGateButton) {
    chatFullscreenGateButton.addEventListener('click', toggleChatShellFullscreen);
  }

  window.addEventListener('app:switch-tab', function () {
    if (typeof document !== 'undefined') {
      const chatMessageList = document.getElementById('chatMessageList');
      if (chatMessageList && document.getElementById('chat-section') && !document.getElementById('chat-section').hidden) {
        chatMessageList._userScrolledUp = false;
      }
    }
    window.__chatGateDebugReason = 'app-switch-tab';
    if (window.__chatGateDebugEnabled) {
      console.log('[chat-gate-debug] app-switch-tab');
    }
    setTimeout(syncChatShellFullscreenButton, 0);
  });

  if (chatShell && chatSection && 'MutationObserver' in window) {
    const syncChatGate = function () {
      window.__chatGateDebugReason = 'mutation-observer';
      if (window.__chatGateDebugEnabled) {
        console.log('[chat-gate-debug] mutation-observer', {
          shellClasses: chatShell.className,
          chatSectionHidden: chatSection.hidden,
          chatSectionInlineDisplay: chatSection.style.display || ''
        });
      }
      syncChatShellFullscreenButton();
    };
    const observer = new MutationObserver(syncChatGate);
    observer.observe(chatShell, { attributes: true, attributeFilter: ['class'] });
    observer.observe(chatSection, { attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
  }

  window.setInterval(function () {
    var chatSection = document.getElementById('chat-section');
    if (!chatSection || chatSection.hidden || chatSection.style.display === 'none') return;
    window.__chatGateDebugReason = 'interval';
    syncChatShellFullscreenButton();
  }, 1000);

  if (!sortSelect) return;

  sortSelect.value = 'default';

  sortSelect.addEventListener('mousedown', function () {
    if (!isSorterOpen) {
      isSorterOpen = true;
      if (arrow) {
        arrow.classList.add('open');
        arrow.style.animation = 'openFlip 0.25s cubic-bezier(0.2, 0.8, 0.2, 1.2) forwards';
      }
    }
  });

  sortSelect.addEventListener('change', function (e) {
    currentSortMethod = e.target.value;
    if (!lessonGridRendered) {
      scheduleLessonGridRender(true);
    } else {
      applySorting();
    }
    closeSorter();
  });

  sortSelect.addEventListener('blur', function () {
    setTimeout(() => {
      if (document.activeElement !== sortSelect) {
        closeSorter();
      }
    }, 10);
  });

  document.addEventListener('click', function (e) {
    if (!sortSelect.contains(e.target) && isSorterOpen) {
      closeSorter();
    }
  });

  function closeSorter() {
    if (isSorterOpen) {
      isSorterOpen = false;
      if (arrow) {
        arrow.classList.remove('open');
        arrow.style.animation = 'closeFlip 0.25s cubic-bezier(0.2, 0.8, 0.2, 1.2) forwards';

        setTimeout(() => {
          arrow.style.animation = '';
        }, 250);
      }
    }
  }

  scheduleLessonGridRender(false);
});

/* Game count badge + home stats row */
document.addEventListener('DOMContentLoaded', function () {
  const visibleCount = games.filter(function (g) { return !g.secret; }).length;

  /* Lessons section badge */
  const countEl = document.getElementById('lessonsGameCount');
  if (countEl) {
    countEl.textContent = visibleCount + ' LESSONS';
  }

  /* Home stats: real game count */
  const homeStatGames = document.getElementById('homeStatGames');
  if (homeStatGames) {
    homeStatGames.textContent = visibleCount + '+';
  }

  /* Home stats: mirror live counter value whenever it updates */
  const liveValue = document.getElementById('liveCounterValue');
  const homeOnline = document.getElementById('homeStatOnline');
  if (liveValue && homeOnline) {
    function syncOnlineStat() {
      const txt = liveValue.textContent.trim();
      homeOnline.textContent = (txt && txt !== '...') ? txt : '—';
    }
    syncOnlineStat();
    new MutationObserver(syncOnlineStat).observe(liveValue, { childList: true, characterData: true, subtree: true });
  }
});

var _tabCache = null;
function _getTabCache() {
  if (!_tabCache) {
    _tabCache = {
      homeTab: document.getElementById('homeTab'),
      lessonsTab: document.getElementById('lessonsTab'),
      chatTab: document.getElementById('chatTab'),
      accountTab: document.getElementById('accountTab'),
      adminTab: document.getElementById('adminTab'),
      infoTab: document.getElementById('infoTab'),
      settingsTab: document.getElementById('settingsTab'),
      homeSection: document.getElementById('home-section'),
      allLessonsSection: document.getElementById('all-lessons'),
      chatSection: document.getElementById('chat-section'),
      accountSection: document.getElementById('account-section'),
      adminSection: document.getElementById('admin-section'),
      infoSection: document.getElementById('info-section'),
      settingsSection: document.getElementById('settings-section')
    };
  }
  return _tabCache;
}
function switchTab(tab) {
  if (tab === 'home') {
    tab = 'lessons';
  }

  // If chatAppShell is in native fullscreen and we're switching away, exit first
  const _fsEl = getFullscreenElementCompat();
  const _chatShell = document.getElementById('chatAppShell');
  if (_fsEl && _chatShell && _fsEl === _chatShell && tab !== 'chat') {
    exitFullscreenCompat();
    const _onFsExit = () => {
      document.removeEventListener('fullscreenchange', _onFsExit);
      document.removeEventListener('webkitfullscreenchange', _onFsExit);
      switchTab(tab);
    };
    document.addEventListener('fullscreenchange', _onFsExit, { once: true });
    document.addEventListener('webkitfullscreenchange', _onFsExit, { once: true });
    // Fallback in case fullscreenchange doesn't fire
    setTimeout(() => {
      document.removeEventListener('fullscreenchange', _onFsExit);
      document.removeEventListener('webkitfullscreenchange', _onFsExit);
      switchTab(tab);
    }, 400);
    return;
  }

  const tc = _getTabCache();
  const homeTab = tc.homeTab;
  const lessonsTab = tc.lessonsTab;
  const chatTab = tc.chatTab;
  const accountTab = tc.accountTab;
  const adminTab = tc.adminTab;
  const infoTab = tc.infoTab;
  const settingsTab = tc.settingsTab;
  const homeSection = tc.homeSection;
  const allLessonsSection = tc.allLessonsSection;
  const chatSection = tc.chatSection;
  const accountSection = tc.accountSection;
  const adminSection = tc.adminSection;
  const infoSection = tc.infoSection;
  const settingsSection = tc.settingsSection;
  const tabs = [homeTab, lessonsTab, chatTab, accountTab, adminTab, settingsTab, infoTab];
  const sections = [homeSection, allLessonsSection, chatSection, accountSection, adminSection, infoSection, settingsSection];

  tabs.forEach((tabElement) => {
    if (tabElement) {
      tabElement.classList.remove('active');
    }
  });

  sections.forEach((section) => {
    if (section) {
      section.hidden = true;
      section.setAttribute('aria-hidden', 'true');
      section.classList.remove('is-active-section');
      section.style.display = 'none';
      section.style.pointerEvents = 'none';
      section.style.zIndex = '0';
    }
  });

  document.documentElement.dataset.activeTab = tab;
  document.body.dataset.activeTab = tab;

  updateBannerAdVisibility(tab);

  // Lock viewport on chat page
  document.documentElement.classList.toggle('chat-active', tab === 'chat');
  document.body.classList.toggle('chat-active', tab === 'chat');
  if (tab === 'chat') window.scrollTo(0, 0);

  if (tab === 'lessons') {
    startImageFlash();
    hydrateDeferredLessonImages(document.getElementById('allLessonsGrid'));
    applyLessonCardPresentation(document);
  } else {
    stopImageFlash();
  }

  if (tab === 'home') {
    if (homeTab) homeTab.classList.add('active');
    if (homeSection) {
      homeSection.hidden = false;
      homeSection.setAttribute('aria-hidden', 'false');
      homeSection.classList.add('is-active-section');
      homeSection.style.display = 'block';
      homeSection.style.pointerEvents = 'auto';
      homeSection.style.zIndex = '1';
    }
  } else if (tab === 'lessons') {
    if (lessonsTab) lessonsTab.classList.add('active');
    if (homeSection) {
      homeSection.hidden = false;
      homeSection.setAttribute('aria-hidden', 'false');
      homeSection.classList.add('is-active-section');
      homeSection.style.display = 'block';
      homeSection.style.pointerEvents = 'auto';
      homeSection.style.zIndex = '1';
    }
    if (allLessonsSection) {
      allLessonsSection.hidden = false;
      allLessonsSection.setAttribute('aria-hidden', 'false');
      allLessonsSection.classList.add('is-active-section');
      allLessonsSection.style.display = 'block';
      allLessonsSection.style.pointerEvents = 'auto';
      allLessonsSection.style.zIndex = '1';
    }
  } else if (tab === 'chat') {
    if (chatTab) chatTab.classList.add('active');
    if (chatSection) {
      chatSection.hidden = false;
      chatSection.setAttribute('aria-hidden', 'false');
      chatSection.classList.add('is-active-section');
      chatSection.style.display = 'flex';
      chatSection.style.pointerEvents = 'auto';
      chatSection.style.zIndex = '1';
    }
  } else if (tab === 'account') {
    if (accountTab) accountTab.classList.add('active');
    if (accountSection) {
      accountSection.hidden = false;
      accountSection.setAttribute('aria-hidden', 'false');
      accountSection.classList.add('is-active-section');
      accountSection.style.display = 'block';
      accountSection.style.pointerEvents = 'auto';
      accountSection.style.zIndex = '1';
    }
  } else if (tab === 'admin') {
    if (adminTab) adminTab.classList.add('active');
    if (adminSection) {
      adminSection.hidden = false;
      adminSection.setAttribute('aria-hidden', 'false');
      adminSection.classList.add('is-active-section');
      adminSection.style.display = 'block';
      adminSection.style.pointerEvents = 'auto';
      adminSection.style.zIndex = '1';
    }
  } else if (tab === 'info') {
    if (infoTab) infoTab.classList.add('active');
    if (infoSection) {
      infoSection.hidden = false;
      infoSection.setAttribute('aria-hidden', 'false');
      infoSection.classList.add('is-active-section');
      infoSection.style.display = 'block';
      infoSection.style.pointerEvents = 'auto';
      infoSection.style.zIndex = '1';
    }
  } else {
    if (settingsTab) settingsTab.classList.add('active');
    if (settingsSection) {
      settingsSection.hidden = false;
      settingsSection.setAttribute('aria-hidden', 'false');
      settingsSection.classList.add('is-active-section');
      settingsSection.style.display = 'block';
      settingsSection.style.pointerEvents = 'auto';
      settingsSection.style.zIndex = '1';
    }
    initSettingsDocsPreview();
    applySolidSettingsPresentation();
  }

  syncChatShellFullscreenButton();

  window.dispatchEvent(new CustomEvent('app:switch-tab', {
    detail: { tab: tab }
  }));
}

function scheduleLessonGridRender(forceImmediate = false) {
  if (lessonGridRendered) {
    return;
  }

  const runRender = () => {
    lessonGridScheduled = false;
    lessonGridScheduleHandle = null;
    if (lessonGridRendered) {
      return;
    }
    generateGameCards();
  };

  if (forceImmediate) {
    if (lessonGridScheduleHandle !== null) {
      if ('cancelIdleCallback' in window) {
        cancelIdleCallback(lessonGridScheduleHandle);
      } else {
        clearTimeout(lessonGridScheduleHandle);
      }
      lessonGridScheduleHandle = null;
    }
    runRender();
    return;
  }

  if (lessonGridScheduled) {
    return;
  }

  lessonGridScheduled = true;
  if ('requestIdleCallback' in window) {
    lessonGridScheduleHandle = requestIdleCallback(runRender, { timeout: 900 });
    return;
  }

  lessonGridScheduleHandle = window.setTimeout(runRender, 180);
}

function bootstrapLessonsInterface() {
  if (lessonsInterfaceBootstrapped) {
    return;
  }

  lessonsInterfaceBootstrapped = true;
  optimizeStaticMedia();
  scheduleLessonGridRender(false);
  buildHomePopularCarousel();
  initHomeLogoTilt();
}

(function () {
  const c = document.getElementById('custom-cursor');
  if (!c) return;

  let mx = 0, my = 0, cx = 0, cy = 0;
  let cursorHidden = false;
  let cursorTimeout;
  let cursorVisible = true;
  let isOverIframe = false;
  let iframeCheckTimeout;
  const overlayCursorStyles = ['light', 'dark'];

  // Hide native cursor whenever an overlay cursor style is active
  const _cs = localStorage.getItem('cursorStyle') || 'default';
  if (overlayCursorStyles.includes(_cs)) {
    document.documentElement.style.setProperty('cursor', 'none', 'important');
    document.body.style.setProperty('cursor', 'none', 'important');
    document.documentElement.setAttribute('data-cursor-style', _cs);
    document.body.setAttribute('data-cursor-style', _cs);
  }

  function lerp(s, e, a) {
    return (1 - a) * s + a * e;
  }

  function hideCustomCursor() {
    if (cursorVisible) {
      c.style.opacity = '0';
      cursorVisible = false;
      cursorHidden = true;
    }
  }

  function showCustomCursor() {
    if (!cursorVisible) {
      c.style.opacity = '1';
      cursorVisible = true;
      cursorHidden = false;
    }
  }

  function resetCursorTimeout() {
    clearTimeout(cursorTimeout);
    cursorTimeout = setTimeout(() => {
      if (cursorVisible && !isOverIframe) {
        hideCustomCursor();
      }
    }, 3000);
  }

  var _cachedIframes = null;
  var _iframeCacheTime = 0;
  function checkIfOverIframe(x, y) {
    var now = performance.now();
    if (!_cachedIframes || now - _iframeCacheTime > 2000) {
      _cachedIframes = document.querySelectorAll('iframe');
      _iframeCacheTime = now;
    }
    for (var i = 0; i < _cachedIframes.length; i++) {
      var rect = _cachedIframes[i].getBoundingClientRect();
      if (x >= rect.left - 5 && x <= rect.right + 5 &&
        y >= rect.top - 5 && y <= rect.bottom + 5) {
        return true;
      }
    }
    return false;
  }

  function updateIframeStatus(x, y) {
    const wasOverIframe = isOverIframe;
    isOverIframe = checkIfOverIframe(x, y);
    const activeCursorStyle = document.body.getAttribute('data-cursor-style') || localStorage.getItem('cursorStyle') || 'default';
    const usesOverlayCursor = overlayCursorStyles.includes(activeCursorStyle);

    clearTimeout(iframeCheckTimeout);
    iframeCheckTimeout = setTimeout(() => {
      if (isOverIframe && !wasOverIframe) {
        hideCustomCursor();
        if (usesOverlayCursor) {
          document.documentElement.style.removeProperty('cursor');
          document.body.style.removeProperty('cursor');
        }
      } else if (!isOverIframe && wasOverIframe) {
        showCustomCursor();
        if (usesOverlayCursor) {
          document.documentElement.style.setProperty('cursor', 'none', 'important');
          document.body.style.setProperty('cursor', 'none', 'important');
        }
      }
    }, 50);
  }

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    const activeCursorStyle = document.body.getAttribute('data-cursor-style') || localStorage.getItem('cursorStyle') || 'default';
    const usesOverlayCursor = overlayCursorStyles.includes(activeCursorStyle);

    updateIframeStatus(mx, my);

    if (!isOverIframe) {
      showCustomCursor();
      if (usesOverlayCursor) {
        document.documentElement.style.setProperty('cursor', 'none', 'important');
        document.body.style.setProperty('cursor', 'none', 'important');
      }
    }

    resetCursorTimeout();
  });

  function animate() {
    var activeCursorStyle = document.body.getAttribute('data-cursor-style') || localStorage.getItem('cursorStyle') || 'default';
    if (activeCursorStyle === 'light' || activeCursorStyle === 'dark') {
      cx = mx;
      cy = my;
    } else {
      cx = lerp(cx, mx, 0.25);
      cy = lerp(cy, my, 0.25);
    }
    c.style.left = cx + 'px';
    c.style.top = cy + 'px';
    requestAnimationFrame(animate);
  }
  animate();

  document.addEventListener('mousedown', (e) => {
    if (!isOverIframe) {
      showCustomCursor();
      c.classList.add('click');
      resetCursorTimeout();
    }
  });

  document.addEventListener('mouseup', () => {
    c.classList.remove('click');
  });

  const interactive = document.querySelectorAll(
    'button, a, .partner-card, .nav-tab, .btn, .search-box, input, ' +
    '.lesson-card, .theme-toggle-btn, .sort-select, .discord-btn, ' +
    '.visit-btn, .sorter-wrapper, .social-icons a'
  );

  interactive.forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      if (!isOverIframe) {
        showCustomCursor();
        c.classList.add('hover');
        resetCursorTimeout();
      }
    });

    el.addEventListener('mouseleave', (e) => {
      c.classList.remove('hover');
    });
  });

  const gamePage = document.getElementById('gamePage');
  if (gamePage) {
    const observer = new MutationObserver(() => {
      if (!gamePage.classList.contains('active')) {
        isOverIframe = false;
        showCustomCursor();
        document.documentElement.style.cursor = 'none';
      }
    });
    observer.observe(gamePage, { attributes: true });
  }

  ['click', 'keydown', 'scroll'].forEach(eventType => {
    document.addEventListener(eventType, () => {
      resetCursorTimeout();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      showCustomCursor();
      resetCursorTimeout();
    }
  });

  showCustomCursor();
  resetCursorTimeout();

  window.addEventListener('beforeunload', () => {
    clearTimeout(cursorTimeout);
    clearTimeout(iframeCheckTimeout);
  });
})();

document.addEventListener('DOMContentLoaded', function () {
  bootstrapLessonsInterface();
  initSettingsDocsPreview();
  ensureHardLockStyleTag();
  applyLessonCardPresentation(document);
  applySolidSettingsPresentation();
  syncSavedLessonGridColumns();
  ensureNativeCursorState();
  switchTab('lessons');
});

window.addEventListener('load', function () {
  scheduleBannerAdsInitialization();
}, { once: true });

document.addEventListener('DOMContentLoaded', function () {
  const scrollbar = document.getElementById('custom-scrollbar');
  const scrollbarThumb = document.getElementById('custom-scrollbar-thumb');
  const scrollbarTrack = document.getElementById('custom-scrollbar-track');

  if (!scrollbar || !scrollbarThumb || !scrollbarTrack) return;

  let isDragging = false;
  let lastY = 0;
  let scrollTimeout;
  let mouseMoveTimeout;
  let isHovering = false;

  scrollbar.style.opacity = '0';

  function updateScrollbar() {
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = Math.max(docHeight - windowHeight, 1);
    const thumbHeight = Math.max((windowHeight / docHeight) * windowHeight, 40);
    scrollbarThumb.style.height = thumbHeight + 'px';
    const thumbTop = maxScroll > 0 ? (scrollTop / maxScroll) * (windowHeight - thumbHeight) : 0;
    scrollbarThumb.style.top = thumbTop + 'px';

    showScrollbar();
  }

  function showScrollbar() {
    const gamePage = document.getElementById('gamePage');
    const scrollbar = document.getElementById('custom-scrollbar');

    if (!scrollbar) return;

    if (gamePage && gamePage.classList.contains('active')) {
      scrollbar.style.opacity = '0';
      return;
    }

    if (isHovering) return;

    scrollbar.style.opacity = '0.8';
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      if (!isHovering && !isDragging) {
        hideScrollbar();
      }
    }, 3200);
  }

  function hideScrollbar() {
    scrollbar.style.opacity = '0';
  }

  function handleScrollbarMouseEnter() {
    isHovering = true;
    scrollbar.style.opacity = '0.8';
    clearTimeout(scrollTimeout);
  }

  function handleScrollbarMouseLeave() {
    isHovering = false;
    if (!isDragging) {
      scrollTimeout = setTimeout(() => {
        hideScrollbar();
      }, 1800);
    }
  }

  function handleDocumentMouseMove(e) {
    const mouseX = e.clientX;
    const windowWidth = window.innerWidth;
    const distanceFromRight = windowWidth - mouseX;

    if (distanceFromRight <= 20) {
      const gamePage = document.getElementById('gamePage');
      if (gamePage && gamePage.classList.contains('active')) {
        return;
      }

      showScrollbar();
    } else if (!isHovering && !isDragging && !isMouseOverScrollbar(e)) {
      clearTimeout(mouseMoveTimeout);
      mouseMoveTimeout = setTimeout(() => {
        hideScrollbar();
      }, 1800);
    }
  }

  function isMouseOverScrollbar(e) {
    const rect = scrollbar.getBoundingClientRect();
    return e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
  }

  function startDrag(e) {
    isDragging = true;
    lastY = e.clientY;
    scrollbarThumb.classList.add('dragging');
    e.preventDefault();
  }

  function doDrag(e) {
    if (!isDragging) return;

    const currentY = e.clientY;
    const deltaY = currentY - lastY;
    lastY = currentY;

    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const maxScroll = Math.max(docHeight - windowHeight, 1);
    const thumbHeight = parseInt(scrollbarThumb.style.height) || 40;
    const trackHeight = windowHeight - thumbHeight;

    const scrollPercent = deltaY / trackHeight;
    window.scrollBy(0, scrollPercent * maxScroll);

    e.preventDefault();
  }

  function stopDrag() {
    isDragging = false;
    scrollbarThumb.classList.remove('dragging');

    setTimeout(() => {
      if (!isHovering) {
        hideScrollbar();
      }
    }, 2200);
  }

  function trackClick(e) {
    if (e.target === scrollbarThumb) return;

    const rect = scrollbarTrack.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const maxScroll = Math.max(docHeight - windowHeight, 1);
    const thumbHeight = parseInt(scrollbarThumb.style.height) || 40;

    const newThumbTop = Math.min(Math.max(clickY - thumbHeight / 2, 0), windowHeight - thumbHeight);
    const scrollPercent = newThumbTop / (windowHeight - thumbHeight);

    window.scrollTo(0, scrollPercent * maxScroll);
  }

  scrollbarThumb.addEventListener('mousedown', startDrag);
  scrollbarTrack.addEventListener('mousedown', trackClick);

  scrollbar.addEventListener('mouseenter', handleScrollbarMouseEnter);
  scrollbar.addEventListener('mouseleave', handleScrollbarMouseLeave);

  document.addEventListener('mousemove', handleDocumentMouseMove);
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);

  window.addEventListener('scroll', updateScrollbar);
  window.addEventListener('resize', updateScrollbar);

  const gamePage = document.getElementById('gamePage');
  if (gamePage) {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === 'class') {
          if (gamePage.classList.contains('active')) {
            hideScrollbar();
          } else {
            setTimeout(updateScrollbar, 100);
          }
        }
      });
    });

    observer.observe(gamePage, { attributes: true });
  }

  setTimeout(updateScrollbar, 100);

  setTimeout(() => {
    hideScrollbar();
  }, 3000);
});

const schoolSubjects = ["Math", "Science", "English", "History", "Biology", "Chemistry", "Physics", "Calculus", "Algebra", "Geometry", "Literature", "Spanish", "French", "Art", "Music", "Computer Science", "Economics", "Psychology", "Statistics"];
const activeIcon = LOCAL_ACTIVE_FAVICON;
const inactiveIcon = LOCAL_INACTIVE_FAVICON;

let currentSubject = getRandomSubject();

function getRandomSubject() {
  return schoolSubjects[Math.floor(Math.random() * schoolSubjects.length)];
}

function normalizeFaviconPath(value, fallback = LOCAL_INACTIVE_FAVICON) {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) {
    return fallback;
  }

  if (normalizedValue.includes('/cuh.png')) {
    return LOCAL_ACTIVE_FAVICON;
  }

  if (normalizedValue.includes('/images/fruh.png')) {
    return LOCAL_INACTIVE_FAVICON;
  }

  return normalizedValue;
}

function setFavicon(iconUrl) {
  const existingFavicons = document.querySelectorAll('link[rel*="icon"], link[rel*="shortcut"]');
  existingFavicons.forEach(link => link.remove());

  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/x-icon';
  favicon.href = iconUrl;
  document.head.appendChild(favicon);

  const shortcut = document.createElement('link');
  shortcut.rel = 'shortcut icon';
  shortcut.href = iconUrl;
  document.head.appendChild(shortcut);

  const apple = document.createElement('link');
  apple.rel = 'apple-touch-icon';
  apple.href = iconUrl;
  document.head.appendChild(apple);

}

function updateTitle() {
  if (!document.hidden) {
    currentSubject = getRandomSubject();
    document.title = `Noahs Tutoring | ${currentSubject}`;
  } else {
    document.title = "Home";
  }
}

function initializeFaviconAndTitle() {
  setFavicon(activeIcon);

  updateTitle();

}

document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    const inactiveTitle = localStorage.getItem('inactiveTabTitle') || 'Home';
    const inactiveFavicon = normalizeFaviconPath(localStorage.getItem('inactiveTabFavicon'), LOCAL_INACTIVE_FAVICON);

    document.title = inactiveTitle;
    setFavicon(inactiveFavicon);
  } else {
    currentSubject = getRandomSubject();
    document.title = `Noahs Tutoring | ${currentSubject}`;
    setFavicon(LOCAL_ACTIVE_FAVICON);
  }
});

setInterval(function () {
  if (!document.hidden) {
    currentSubject = getRandomSubject();
    document.title = `Noahs Tutoring | ${currentSubject}`;
  }
}, 30000);

document.addEventListener('DOMContentLoaded', function () {
  initializeFaviconAndTitle();
});

document.addEventListener('DOMContentLoaded', function () {
  const gamePage = document.getElementById('gamePage');
  const backToTopBtn = document.getElementById("backToTop");

  updateBackToTopVisibility();

  window.addEventListener("scroll", updateBackToTopVisibility);

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", scrollToTop);
  }

  if (gamePage) {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === 'class') {
          setTimeout(updateBackToTopVisibility, 50);
        }
      });
    });

    observer.observe(gamePage, { attributes: true });
  }

  function updateBackToTopVisibility() {
    if (!backToTopBtn) return;

    const isGameActive = gamePage && gamePage.classList.contains('active');
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;

    if (isGameActive) {
      backToTopBtn.classList.remove("show");
      return;
    }

    if (scrollPosition > 18000) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
});

function preloadFavicons() {
  const preloadActive = new Image();
  preloadActive.src = activeIcon;

  const preloadInactive = new Image();
  preloadInactive.src = inactiveIcon;
}

preloadFavicons();

let flashInterval;
let flashImages = [];
let lastRandomIndex = -1;

function startImageFlash() {
  flashImages = games
    .map(function (game) { return game.image; })
    .filter(function (img) { return !!img; })
    .slice(0, 36);

  if (flashImages.length === 0) return;

  if (flashInterval) clearInterval(flashInterval);

  const randomCard = document.querySelector('.lesson-card[data-random-game="true"] .lesson-image');
  if (!randomCard) {
    return;
  }

  const rotateImage = function () {
    if (!randomCard.isConnected) {
      stopImageFlash();
      return;
    }

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * flashImages.length);
    } while (randomIndex === lastRandomIndex && flashImages.length > 1);

    lastRandomIndex = randomIndex;
    const nextSrc = flashImages[randomIndex];
    const currentSrc = randomCard.getAttribute('src');
    if (currentSrc !== nextSrc) {
      randomCard.src = nextSrc;
    }
  };

  rotateImage();
  flashInterval = window.setInterval(rotateImage, 1400);
}
function stopImageFlash() {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', function (e) {
    if (!lessonGridRendered) {
      scheduleLessonGridRender(true);
    }
    performSearch(e.target.value);
  });

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      setTimeout(() => {
        if (searchInput.value) {
          performSearch(searchInput.value);
        } else {
          updateSearchStats();
        }
      }, 100);
    });
  }
}

let cursorEnabled = true;
let cursorStyle = 'light';
const DOM_CURSOR_STYLES = ['light', 'dark'];
const CSS_CURSOR_STYLES = [];
const ALL_CURSOR_STYLES = ['default', 'light', 'dark'];

function normalizeCursorStyle(style, fallback = 'light') {
  if (ALL_CURSOR_STYLES.includes(style)) {
    return style;
  }

  return ALL_CURSOR_STYLES.includes(fallback) ? fallback : 'light';
}

const themeColors = {
  'default': '#f4f4f6',
  'theme-legacy-orange': '#c27c15',
  'theme-rainbow': '#ff0080',
  'theme-cyber-green': '#00ff00',
  'theme-ice-blue': '#00ccff',
  'theme-solarized': '#2aa198',
  'theme-purple-haze': '#9b59b6'
};

document.addEventListener('DOMContentLoaded', function () {
  document.addEventListener('contextmenu', function (e) {
    const target = e.target;
    const isInIframe = target.tagName === 'IFRAME' || target.closest('iframe');
    const isInGamePage = document.getElementById('gamePage').classList.contains('active');

    if (isInIframe || (isInGamePage && !target.closest('.game-tabbar'))) {
      return;
    }

    e.preventDefault();

    const contextMenu = document.getElementById('contextMenu');
    if (!contextMenu) return;

    const x = Math.min(e.clientX, window.innerWidth - contextMenu.offsetWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - contextMenu.offsetHeight - 10);

    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.style.display = 'block';

    setTimeout(() => {
      const closeContextMenu = function (e) {
        if (!contextMenu.contains(e.target)) {
          contextMenu.style.display = 'none';
          document.removeEventListener('click', closeContextMenu);
        }
      };
      document.addEventListener('click', closeContextMenu);
    }, 10);
  });

  document.addEventListener('click', function (e) {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu && !contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
    }
  });

  setDefaultSettings();
  initializeSettings();

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      openSettings();
    }
  });
});

function initializeSettings() {
  document.body.classList.remove('theme-legacy-orange', 'theme-rainbow', 'theme-cyber-green', 'theme-ice-blue',
    'theme-solarized', 'theme-purple-haze');
  clearCustomThemeColors();
  localStorage.setItem('selectedTheme', 'default');
  localStorage.removeItem('customThemeColor');
  localStorage.setItem('cursorEnabled', 'false');
  localStorage.setItem('cursorStyle', 'default');
  localStorage.setItem('mouseTrailEnabled', 'false');
  localStorage.setItem('mouseShapesEnabled', 'false');
  setCursorStyle('default');
  destroyMouseFx();
  const monochromeSavedBackground = normalizeBackgroundStyle(localStorage.getItem('selectedBackground') || 'none');
  localStorage.setItem('selectedBackground', monochromeSavedBackground);
  applyBackgroundStyle(monochromeSavedBackground, false);
  syncLogoThemeTone();
  const monochromeSavedTitle = localStorage.getItem('inactiveTabTitle');
  const monochromeSavedFavicon = normalizeFaviconPath(localStorage.getItem('inactiveTabFavicon'), LOCAL_INACTIVE_FAVICON);
  if (monochromeSavedTitle) document.getElementById('customTitle').value = monochromeSavedTitle;
  if (monochromeSavedFavicon) document.getElementById('customFavicon').value = monochromeSavedFavicon;
  localStorage.removeItem('customLogo');
  const monochromeLogoPreview = document.getElementById('logoPreview');
  if (monochromeLogoPreview) {
    const monochromePreviewImg = monochromeLogoPreview.querySelector('img');
    if (monochromePreviewImg) {
      monochromePreviewImg.src = LOCAL_DEFAULT_LOGO;
      monochromePreviewImg.style.display = 'block';
      monochromeLogoPreview.querySelector('i').style.display = 'none';
    }
  }
  setSiteLogos(LOCAL_DEFAULT_LOGO);
  updateBackgroundSelectionUI();
  return;

  const savedCursorStyle = localStorage.getItem('cursorStyle');
  const initialCursorStyle = normalizeCursorStyle(
    savedCursorStyle || (localStorage.getItem('cursorEnabled') === 'false' ? 'default' : 'light')
  );
  setCursorStyle(initialCursorStyle);
  const cursorStyleSelect = document.getElementById('cursorStyleSelect');
  if (cursorStyleSelect) cursorStyleSelect.value = initialCursorStyle;

  // Mouse FX: sync UI toggles with saved settings, then init
  var _trailOn = localStorage.getItem('mouseTrailEnabled') !== 'false';
  var _shapesOn = localStorage.getItem('mouseShapesEnabled') !== 'false';
  var _trailColor = localStorage.getItem('mouseTrailColor') || '#c27c15';
  var _shapesColor = localStorage.getItem('mouseShapesColor') || '#c27c15';
  var _trailToggle = document.getElementById('mouseTrailToggle');
  var _shapesToggle = document.getElementById('mouseShapesToggle');
  var _trailPicker = document.getElementById('mouseTrailColorPicker');
  var _shapesPicker = document.getElementById('mouseShapesColorPicker');
  if (_trailToggle) _trailToggle.checked = _trailOn;
  if (_shapesToggle) _shapesToggle.checked = _shapesOn;
  if (_trailPicker) _trailPicker.value = _trailColor;
  if (_shapesPicker) _shapesPicker.value = _shapesColor;
  initMouseFx();

  const savedTheme = localStorage.getItem('selectedTheme') || 'default';

  const savedCustomColor = localStorage.getItem('customThemeColor');
  if (savedCustomColor && savedTheme === 'custom') {
    document.getElementById('customHexInput').value = savedCustomColor;
    document.getElementById('colorPreview').style.background = savedCustomColor;
  }

  const savedTitle = localStorage.getItem('inactiveTabTitle');
  const savedFavicon = normalizeFaviconPath(localStorage.getItem('inactiveTabFavicon'), LOCAL_INACTIVE_FAVICON);
  if (savedTitle) document.getElementById('customTitle').value = savedTitle;
  if (savedFavicon) document.getElementById('customFavicon').value = savedFavicon;

  const savedLogo = localStorage.getItem('customLogo');
  if (savedLogo) {
    const logoPreview = document.getElementById('logoPreview');
    if (logoPreview) {
      const previewImg = logoPreview.querySelector('img');
      if (previewImg) {
        previewImg.src = savedLogo;
        previewImg.style.display = 'block';
        logoPreview.querySelector('i').style.display = 'none';
      }
    }
    setSiteLogos(savedLogo);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      const inactiveTitle = localStorage.getItem('inactiveTabTitle') || 'Home';
      const inactiveFavicon = normalizeFaviconPath(localStorage.getItem('inactiveTabFavicon'), LOCAL_INACTIVE_FAVICON);

      document.title = inactiveTitle;
      setFavicon(inactiveFavicon);
    } else {
      currentSubject = getRandomSubject();
      document.title = `Noahs Tutoring | ${currentSubject}`;
      setFavicon(LOCAL_ACTIVE_FAVICON);
    }
  });

  setTimeout(updateCursorColors, 100);
}

function openSettings() {
  switchTab('settings');
  updateBackgroundSelectionUI();
}

function applySavedTheme(themeName) {
  const legacyPresetIndex = getLegacyThemePresetIndex(themeName);
  if (legacyPresetIndex !== null) {
    localStorage.setItem('activeThemePreset', String(legacyPresetIndex));
  }
  applyThemePreset(normalizeThemePresetIndex(localStorage.getItem('activeThemePreset') || '0'));
  applyBackgroundStyle(normalizeBackgroundStyle(localStorage.getItem('selectedBackground') || 'none'), false);
}

function closeSettings() {
  switchTab('lessons');
}

function clearCustomThemeColors() {
  [document.documentElement, document.body].forEach((target) => {
    if (!target || !target.style) return;
    target.style.removeProperty('--primary-orange');
    target.style.removeProperty('--primary-orange-rgb');
    target.style.removeProperty('--accent-orange');
    target.style.removeProperty('--proto-tint-rgb');
  });
}

function initSettingsDocsPreview() {
  const settingsSection = document.getElementById('settings-section');
  if (!settingsSection) return;

  const modalBody = settingsSection.querySelector('.modal-body');
  if (!modalBody || modalBody.dataset.docsInitialized === '1') return;

  const intro = modalBody.querySelector('#settingsDocsIntro');
  const groups = Array.from(modalBody.querySelectorAll('.settings-group'));
  if (!intro || !groups.length) return;

  const layout = document.createElement('div');
  layout.className = 'settings-docs-layout';

  const nav = document.createElement('aside');
  nav.className = 'settings-docs-nav';

  const content = document.createElement('div');
  content.className = 'settings-docs-content';

  const navButtons = [];

  function setActiveGroup(targetGroup = null) {
    groups.forEach((group) => {
      group.open = group === targetGroup;
      group.classList.toggle('is-current', group === targetGroup);
    });

    navButtons.forEach(({ button, group }) => {
      button.classList.toggle('active', group === targetGroup);
    });

    intro.hidden = !!targetGroup;
  }

  groups.forEach((group) => {
    const summary = group.querySelector('.settings-group-header');
    if (!summary) return;

    const label = summary.textContent.replace(/\s+/g, ' ').trim();
    const icon = summary.querySelector('i:not(.settings-group-arrow)');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'settings-docs-nav-button';
    button.innerHTML = `${icon ? `<i class="${icon.className}"></i>` : ''}<span>${label}</span>`;
    button.addEventListener('click', () => {
      setActiveGroup(group.open ? null : group);
    });
    nav.appendChild(button);
    navButtons.push({ button, group });

    summary.addEventListener('click', (event) => {
      event.preventDefault();
      setActiveGroup(group.open ? null : group);
    });
  });

  content.appendChild(intro);
  groups.forEach((group) => content.appendChild(group));

  layout.appendChild(nav);
  layout.appendChild(content);

  modalBody.innerHTML = '';
  modalBody.appendChild(layout);
  modalBody.dataset.docsInitialized = '1';

  setActiveGroup(null);
}

function selectPresetTheme(themeName) {
  const body = document.body;

  body.classList.remove('theme-legacy-orange', 'theme-rainbow', 'theme-cyber-green', 'theme-ice-blue',
    'theme-solarized', 'theme-purple-haze');

  if (themeName !== 'default' && themeName !== 'custom') {
    body.classList.add(`theme-${themeName}`);
  }

  if (themeName === 'custom') {
    const customColor = localStorage.getItem('customThemeColor') || '#c27c15';
    applyCustomThemeColors(customColor);
    document.getElementById('customColorInput').style.display = 'flex';
  } else {
    clearCustomThemeColors();
    document.getElementById('customColorInput').style.display = 'none';
  }

  localStorage.setItem('selectedTheme', themeName);

  logoTintCache.clear();

  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.remove('active');
  });
  const activeOption = document.querySelector(`.theme-option[data-theme="${themeName}"]`);
  if (activeOption) activeOption.classList.add('active');

  updateLogoForCurrentTheme();

  updateMatrixTheme();
  updateCursorColors();

  if (typeof gtag !== 'undefined') {
    gtag('event', 'theme_change', {
      'event_category': 'settings',
      'event_label': themeName,
      'value': 1
    });
  }
}

function updateLogoForCurrentTheme() {
  const defaultLogo = LOCAL_DEFAULT_LOGO;

  document.querySelectorAll('.logo, .home-logo').forEach(logoEl => {
    logoEl.src = defaultLogo;
    logoEl.dataset.baseSrc = defaultLogo;
  });

  setTimeout(() => {
    const { r, g, b } = getBackgroundColorRGB();
    document.querySelectorAll('.logo, .home-logo').forEach(logoEl => {
      tintLogoElementExact(logoEl, r, g, b);
    });
  }, 50);
}

function updateMatrixBackground() {
  refreshActiveBackground();
}

function applyCustomThemeColors(hexColor) {
  if (!/^#[0-9A-F]{6}$/i.test(hexColor)) {
    if (/^[0-9A-F]{6}$/i.test(hexColor)) {
      hexColor = '#' + hexColor;
    } else {
      return false;
    }
  }

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const rgb = `${r}, ${g}, ${b}`;

  const accentR = Math.min(255, Math.floor(r * 1.2));
  const accentG = Math.min(255, Math.floor(g * 1.2));
  const accentB = Math.min(255, Math.floor(b * 1.2));
  const accentColor = `rgb(${accentR}, ${accentG}, ${accentB})`;

  [document.documentElement, document.body].forEach((target) => {
    if (!target || !target.style) return;
    target.style.setProperty('--primary-orange', hexColor, 'important');
    target.style.setProperty('--primary-orange-rgb', rgb, 'important');
    target.style.setProperty('--accent-orange', accentColor, 'important');
    target.style.setProperty('--proto-tint-rgb', rgb, 'important');
  });

  window.matrixColor = hexColor;

  updateMatrixTheme();

  return true;
}

function applyCustomTheme() {
  const hexInput = document.getElementById('customHexInput');
  const colorPreview = document.getElementById('colorPreview');

  if (!hexInput || !colorPreview) return;

  const hexColor = hexInput.value.trim();

  if (!applyCustomThemeColors(hexColor)) {
    alert('Please enter a valid hex color (e.g., #c27c15)');
    hexInput.style.borderColor = '#ff4444';
    setTimeout(() => hexInput.style.borderColor = '', 1000);
    return;
  }

  colorPreview.style.background = hexColor;

  localStorage.setItem('selectedTheme', 'custom');
  localStorage.setItem('customThemeColor', hexColor);

  const body = document.body;
  body.classList.remove('theme-legacy-orange', 'theme-rainbow', 'theme-cyber-green', 'theme-ice-blue',
    'theme-solarized', 'theme-purple-haze');

  updateMatrixTheme();

  updateCursorColors();

  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.remove('active');
  });
  document.querySelector('.theme-option[data-theme="custom"]').classList.add('active');

  hexInput.style.borderColor = 'var(--accent-orange)';
  setTimeout(() => {
    hexInput.style.borderColor = '';
  }, 1000);
}

// ── Theme Preset System ──────────────────────────────────────────────────
var THEME_PRESET_DEFAULTS = [
  { name: 'Amber Core',    accent: '#c27c15', fg: '#f6f1e7' },
  { name: 'Glacier Blue',  accent: '#5ecbff', fg: '#edf8ff' },
  { name: 'Nova Pink',     accent: '#ff5f8c', fg: '#fff0f5' },
  { name: 'Emerald Pulse', accent: '#41d38a', fg: '#edfff5' },
  { name: 'Violet Static', accent: '#8e79ff', fg: '#f3efff' }
];
var _themePresets = null;
var _activePresetIdx = 0;

function normalizeThemePresetIndex(value) {
  const presets = getThemePresets();
  const parsedValue = parseInt(value, 10);
  if (Number.isNaN(parsedValue) || parsedValue < 0 || parsedValue >= presets.length) {
    return 0;
  }
  return parsedValue;
}

function getLegacyThemePresetIndex(themeName) {
  const normalizedTheme = String(themeName || '').trim();
  const legacyMap = {
    'default': 0,
    'legacy-orange': 0,
    'ice-blue': 1,
    'rainbow': 2,
    'solarized': 3,
    'cyber-green': 3,
    'purple-haze': 4
  };
  return Object.prototype.hasOwnProperty.call(legacyMap, normalizedTheme) ? legacyMap[normalizedTheme] : null;
}

function getThemePresets() {
  if (_themePresets) return _themePresets;
  try {
    var saved = localStorage.getItem('themePresets');
    if (saved) { _themePresets = JSON.parse(saved); return _themePresets; }
  } catch(e) {}
  _themePresets = THEME_PRESET_DEFAULTS.map(function(p) { return Object.assign({}, p); });
  return _themePresets;
}

function saveThemePresets() {
  localStorage.setItem('themePresets', JSON.stringify(getThemePresets()));
}

function applyThemePreset(idx) {
  var presets = getThemePresets();
  idx = normalizeThemePresetIndex(idx);
  var p = presets[idx] || presets[0];
  _activePresetIdx = idx;
  applyCustomThemeColors(p.accent);
  [document.documentElement, document.body].forEach(function(t) {
    if (!t || !t.style) return;
    t.style.setProperty('--light-text', p.fg, 'important');
  });
  document.body.classList.remove('theme-legacy-orange','theme-rainbow','theme-cyber-green','theme-ice-blue','theme-solarized','theme-purple-haze');
  localStorage.setItem('selectedTheme', 'custom');
  localStorage.setItem('customThemeColor', p.accent);
  localStorage.setItem('activeThemePreset', String(idx));
  updateMatrixTheme();
  updateCursorColors();
}

function switchThemePreset(idxStr) {
  _activePresetIdx = normalizeThemePresetIndex(idxStr);
  applyThemePreset(_activePresetIdx);
  renderThemePresetEditor(_activePresetIdx);
}

function updateThemePresetName(val) {
  var presets = getThemePresets();
  presets[_activePresetIdx].name = val;
  saveThemePresets();
  var sel = document.getElementById('themePresetSelect');
  if (sel && sel.options[_activePresetIdx]) {
    sel.options[_activePresetIdx].text = val || '(unnamed)';
  }
}

function updateThemeAccent(val) {
  var presets = getThemePresets();
  presets[_activePresetIdx].accent = val;
  saveThemePresets();
  applyThemePreset(_activePresetIdx);
  var hexEl = document.getElementById('themeAccentHex');
  if (hexEl) hexEl.textContent = val;
}

function updateThemeFg(val) {
  var presets = getThemePresets();
  presets[_activePresetIdx].fg = val;
  saveThemePresets();
  applyThemePreset(_activePresetIdx);
  var hexEl = document.getElementById('themeFgHex');
  if (hexEl) hexEl.textContent = val;
}

function resetThemePresets() {
  _themePresets = THEME_PRESET_DEFAULTS.map(function(p) { return Object.assign({}, p); });
  localStorage.removeItem('themePresets');
  _activePresetIdx = 0;
  localStorage.setItem('activeThemePreset', '0');
  initThemePresetUI();
  applyThemePreset(0);
}

function renderThemePresetEditor(idx) {
  var presets = getThemePresets();
  var p = presets[idx] || presets[0];
  var nameEl = document.getElementById('themePresetName');
  var accentEl = document.getElementById('themeAccentPicker');
  var fgEl = document.getElementById('themeFgPicker');
  var accentHex = document.getElementById('themeAccentHex');
  var fgHex = document.getElementById('themeFgHex');
  if (nameEl) nameEl.value = p.name;
  if (accentEl) accentEl.value = p.accent;
  if (fgEl) fgEl.value = p.fg;
  if (accentHex) accentHex.textContent = p.accent;
  if (fgHex) fgHex.textContent = p.fg;
}

function initThemePresetUI() {
  var presets = getThemePresets();
  var sel = document.getElementById('themePresetSelect');
  if (sel) {
    while (sel.options.length) sel.remove(0);
    presets.forEach(function(p, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.text = p.name;
      sel.add(opt);
    });
    _activePresetIdx = normalizeThemePresetIndex(localStorage.getItem('activeThemePreset') || '0');
    sel.value = _activePresetIdx;
  }
  renderThemePresetEditor(_activePresetIdx);
  applyThemePreset(_activePresetIdx);
}
// ─────────────────────────────────────────────────────────────────────────────

function switchSettingsPane(name) {
  document.querySelectorAll('.settings-nav-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.pane === name);
  });
  document.querySelectorAll('.settings-pane').forEach(function(pane) {
    pane.classList.toggle('active', pane.dataset.pane === name);
  });
  applySolidSettingsPresentation();
}

function setCursorStyle(style) {
  var existing = document.getElementById('noahs-cursor-style');
  if (existing) existing.remove();
  var existingLock = document.getElementById('noahs-cursor-lock');
  if (existingLock) existingLock.remove();
  cursorStyle = 'default';
  cursorEnabled = false;
  const cursor = document.getElementById('custom-cursor');
  if (cursor) {
    cursor.style.display = 'none';
    cursor.style.opacity = '0';
  }
  document.body.classList.add('cursor-disabled');
  document.body.removeAttribute('data-cursor-style');
  document.documentElement.removeAttribute('data-cursor-style');
  document.documentElement.style.removeProperty('cursor');
  document.body.style.removeProperty('cursor');
  const sel = document.getElementById('cursorStyleSelect');
  if (sel) sel.value = 'default';
  localStorage.setItem('cursorStyle', 'default');
  localStorage.setItem('cursorEnabled', 'false');
}

function toggleCursorSetting(enabled) {
  setCursorStyle('default');
}

/* ═══════════════════════════════════════════════════════════════
   Mouse FX — clean glow trail + falling shape particles
   ═══════════════════════════════════════════════════════════════ */
var _mouseFx = {
  canvas: null, ctx: null, raf: null,
  points: [], shapes: [],
  lastShapeAt: 0, lastMoveAt: 0,
  handleMove: null, handleLeave: null, handleBlur: null,
  handleVisibility: null, handleResize: null,
  // Pre-parsed RGB for trail/shapes to avoid parsing every frame
  trailRGB: null, shapesRGB: null,
  debugFrame: 0
};

function _fxParseHex(hex) {
  hex = (hex || '#c27c15').replace('#', '');
  if (hex.length !== 6) return { r: 194, g: 124, b: 21 };
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

function _fxDrawPolygon(ctx, x, y, sides, size, rotation) {
  ctx.beginPath();
  for (var i = 0; i < sides; i++) {
    var angle = rotation + (i * 2 * Math.PI) / sides;
    if (i === 0) ctx.moveTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
    else ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
  }
  ctx.closePath();
}

function destroyMouseFx() {
  if (_mouseFx.raf) cancelAnimationFrame(_mouseFx.raf);
  _mouseFx.raf = null;
  if (_mouseFx.handleMove) window.removeEventListener('mousemove', _mouseFx.handleMove);
  if (_mouseFx.handleLeave) window.removeEventListener('mouseleave', _mouseFx.handleLeave);
  if (_mouseFx.handleBlur) window.removeEventListener('blur', _mouseFx.handleBlur);
  if (_mouseFx.handleVisibility) document.removeEventListener('visibilitychange', _mouseFx.handleVisibility);
  if (_mouseFx.handleResize) window.removeEventListener('resize', _mouseFx.handleResize);
  if (_mouseFx.canvas && _mouseFx.canvas.parentNode) _mouseFx.canvas.remove();
  _mouseFx.canvas = null; _mouseFx.ctx = null;
  _mouseFx.points = []; _mouseFx.shapes = [];
}

function initMouseFx() {
  destroyMouseFx();
  localStorage.setItem('mouseTrailEnabled', 'false');
  localStorage.setItem('mouseShapesEnabled', 'false');
  return;

  var trailOn = localStorage.getItem('mouseTrailEnabled') !== 'false';
  var shapesOn = localStorage.getItem('mouseShapesEnabled') !== 'false';
  if (!trailOn && !shapesOn) return;

  var trailColor = localStorage.getItem('mouseTrailColor') || '#c27c15';
  var shapesColor = localStorage.getItem('mouseShapesColor') || '#c27c15';
  var tRGB = _fxParseHex(trailColor);
  var sRGB = _fxParseHex(shapesColor);

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:999998;';
  document.body.appendChild(canvas);
  _mouseFx.canvas = canvas;
  _mouseFx.debugFrame = 0;

  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  _mouseFx.ctx = ctx;

  var resize = function () {
    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  _mouseFx.handleResize = resize;
  window.addEventListener('resize', resize);

  var TRAIL_LIFE = 180;
  var MAX_PTS = 60;
  var points = _mouseFx.points;
  var shapes = _mouseFx.shapes;

  var handleMove = function (e) {
    var now = performance.now();
    var last = points[points.length - 1];
    if (last) {
      var dx = e.clientX - last.x, dy = e.clientY - last.y;
      var d2 = dx * dx + dy * dy;
      if (d2 < 4) return;
      if (now - last.t < 8 && d2 < 400) return;
    }
    points.push({ x: e.clientX, y: e.clientY, t: now });
    if (points.length > MAX_PTS) _mouseFx.points = points = points.slice(-MAX_PTS);
    _mouseFx.lastMoveAt = now;

    if (shapesOn && now - _mouseFx.lastShapeAt > 90) {
      _mouseFx.lastShapeAt = now;
      var kr = Math.random();
      shapes.push({
        x: e.clientX + (Math.random() - 0.5) * 10,
        y: e.clientY + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.15 + Math.random() * 0.5,
        rot: Math.random() * 6.28,
        rs: (Math.random() - 0.5) * 0.05,
        sz: 8 + Math.random() * 10,
        sides: 3 + Math.floor(Math.random() * 4),
        born: now,
        ttl: 1100 + Math.random() * 500,
        kind: kr < 0.55 ? 0 : kr < 0.8 ? 1 : 2 // 0=poly 1=diamond 2=plus
      });
    }
  };

  var clearTrail = function () { _mouseFx.points = points = []; };
  _mouseFx.handleMove = handleMove;
  _mouseFx.handleLeave = clearTrail;
  _mouseFx.handleBlur = clearTrail;
  _mouseFx.handleVisibility = function () { if (document.hidden) clearTrail(); };

  window.addEventListener('mousemove', handleMove, { passive: true });
  window.addEventListener('mouseleave', clearTrail);
  window.addEventListener('blur', clearTrail);
  document.addEventListener('visibilitychange', _mouseFx.handleVisibility);

  var draw = function () {
    var now = performance.now();
    var W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);
    _mouseFx.debugFrame += 1;

    // Trim
    var i = 0;
    while (i < points.length && now - points[i].t > TRAIL_LIFE) i++;
    if (i > 0) { points.splice(0, i); _mouseFx.points = points; }
    if (now - _mouseFx.lastMoveAt > TRAIL_LIFE + 50) { points.length = 0; }

    // ── Trail: single smooth path per layer, NO shadowBlur ──
    if (trailOn && points.length >= 2) {
      var len = points.length;
      var r = tRGB.r, g = tRGB.g, b = tRGB.b;

      // Draw 2 clean layers: outer glow + inner core
      var layers = [
        { w: 12, a: 0.18 },  // soft outer
        { w: 4,  a: 0.55 }   // bright core
      ];

      for (var li = 0; li < layers.length; li++) {
        var lw = layers[li].w, la = layers[li].a;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = lw;

        // Single path — way cheaper than per-segment
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var pi = 1; pi < len; pi++) {
          // Smooth with quadratic curves through midpoints
          if (pi < len - 1) {
            var mx = (points[pi].x + points[pi + 1].x) * 0.5;
            var my = (points[pi].y + points[pi + 1].y) * 0.5;
            ctx.quadraticCurveTo(points[pi].x, points[pi].y, mx, my);
          } else {
            ctx.lineTo(points[pi].x, points[pi].y);
          }
        }

        // Gradient along trail: fade tail → bright head
        var tail = points[0], head = points[len - 1];
        var grad = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
        grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0)');
        grad.addColorStop(0.3, 'rgba(' + r + ',' + g + ',' + b + ',' + (la * 0.4) + ')');
        grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',' + la + ')');
        ctx.strokeStyle = grad;
        ctx.stroke();
        ctx.restore();
      }

      // Tiny head dot
      var hd = points[len - 1];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(hd.x, hd.y, 5, 0, 6.28);
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.35)';
      ctx.fill();
      ctx.restore();
    }

    // ── Shapes: no shadowBlur, just stroke ──
    if (shapesOn && shapes.length) {
      var sr = sRGB.r, sg = sRGB.g, sb = sRGB.b;
      var next = [];
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'lighter';

      for (var si = 0; si < shapes.length; si++) {
        var sh = shapes[si];
        var age = now - sh.born;
        var life = 1 - age / sh.ttl;
        if (life <= 0) continue;

        sh.vy += 0.01;
        sh.vx *= 0.993;
        sh.vy *= 0.993;
        sh.x += sh.vx * 4;
        sh.y += sh.vy * 4;
        sh.rot += sh.rs;

        ctx.strokeStyle = 'rgba(' + sr + ',' + sg + ',' + sb + ',' + (0.88 * life) + ')';
        ctx.fillStyle = 'rgba(' + sr + ',' + sg + ',' + sb + ',' + (0.22 * life) + ')';

        if (sh.kind === 2) { // plus
          var ps = sh.sz * 0.7;
          ctx.beginPath();
          ctx.moveTo(sh.x - ps, sh.y); ctx.lineTo(sh.x + ps, sh.y);
          ctx.moveTo(sh.x, sh.y - ps); ctx.lineTo(sh.x, sh.y + ps);
          ctx.stroke();
        } else if (sh.kind === 1) { // diamond
          _fxDrawPolygon(ctx, sh.x, sh.y, 4, sh.sz, sh.rot + 0.785);
          ctx.fill();
          ctx.stroke();
        } else { // polygon
          _fxDrawPolygon(ctx, sh.x, sh.y, sh.sides, sh.sz, sh.rot);
          ctx.fill();
          ctx.stroke();
        }
        next.push(sh);
      }
      _mouseFx.shapes = shapes = next.length > 80 ? next.slice(-80) : next;
      ctx.globalCompositeOperation = 'source-over';
    }

    _mouseFx.raf = requestAnimationFrame(draw);
  };

  _mouseFx.raf = requestAnimationFrame(draw);
}

function setMouseTrail(enabled) {
  localStorage.setItem('mouseTrailEnabled', 'false');
  initMouseFx();
}

function setMouseTrailColor(hex) {
  localStorage.setItem('mouseTrailColor', '#ffffff');
  initMouseFx();
}

function setMouseShapes(enabled) {
  localStorage.setItem('mouseShapesEnabled', 'false');
  initMouseFx();
}

function setMouseShapesColor(hex) {
  localStorage.setItem('mouseShapesColor', '#ffffff');
  initMouseFx();
}

function applyMatrixFilterForCustomColor(hexColor) {
  refreshActiveBackground();
}

function setFavicon(url) {
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach(link => link.remove());

  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/x-icon';
  favicon.href = url;
  document.head.appendChild(favicon);

  const shortcut = document.createElement('link');
  shortcut.rel = 'shortcut icon';
  shortcut.href = url;
  document.head.appendChild(shortcut);

  const appleIcon = document.createElement('link');
  appleIcon.rel = 'apple-touch-icon';
  appleIcon.href = url;
  document.head.appendChild(appleIcon);
}

function applyInactiveTabSettings() {
  const titleInput = document.getElementById('customTitle');
  const faviconInput = document.getElementById('customFavicon');

  if (!titleInput || !faviconInput) return;

  const newTitle = titleInput.value.trim() || 'Home';
  const newFavicon = normalizeFaviconPath(faviconInput.value.trim(), LOCAL_INACTIVE_FAVICON);

  localStorage.setItem('inactiveTabTitle', newTitle);
  localStorage.setItem('inactiveTabFavicon', newFavicon);

  if (document.hidden) {
    document.title = newTitle;
    setFavicon(newFavicon);
  }

  const applyBtn = event.target;
  const originalText = applyBtn.innerHTML;
  applyBtn.innerHTML = '<i class="fas fa-check"><\/i> Applied!';
  applyBtn.style.borderColor = 'var(--accent-orange)';
  applyBtn.style.background = 'rgba(var(--primary-orange-rgb), 0.3)';

  setTimeout(() => {
    applyBtn.innerHTML = originalText;
    applyBtn.style.borderColor = '';
    applyBtn.style.background = '';
  }, 1500);
}

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.match('image.*')) {
    alert('Please upload an image file (JPG, PNG, GIF, etc.)');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const logoData = e.target.result;

    const logoPreview = document.getElementById('logoPreview');
    const previewImg = logoPreview.querySelector('img');
    previewImg.src = logoData;
    previewImg.style.display = 'block';
    logoPreview.querySelector('i').style.display = 'none';

    setSiteLogos(logoData);

    localStorage.setItem('customLogo', logoData);

    const fileBtn = event.target.parentElement;
    const originalHTML = fileBtn.innerHTML;
    fileBtn.innerHTML = '<i class="fas fa-check"><\/i> Logo Uploaded!';
    fileBtn.style.borderColor = 'var(--accent-orange)';
    fileBtn.style.background = 'rgba(var(--primary-orange-rgb), 0.3)';

    setTimeout(() => {
      fileBtn.innerHTML = originalHTML;
      fileBtn.style.borderColor = '';
      fileBtn.style.background = '';
    }, 1500);
  };

  reader.readAsDataURL(file);
}

function updateCursorColors() {
  return;
}

const logoTintCache = new Map();

function tintLogoElementExact(logoEl, r, g, b) {
  if (!logoEl) return;

  const baseSrc = logoEl.dataset.baseSrc || logoEl.getAttribute('src') || logoEl.src;
  if (!baseSrc || baseSrc.startsWith('blob:')) return;
  if (!logoEl.dataset.baseSrc) logoEl.dataset.baseSrc = baseSrc;

  const cacheKey = `${baseSrc}|${r},${g},${b}`;
  if (logoTintCache.has(cacheKey)) {
    logoEl.src = logoTintCache.get(cacheKey);
    return;
  }

  const img = new Image();
  if (!baseSrc.startsWith('data:')) img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 0;
      canvas.height = img.naturalHeight || img.height || 0;
      if (!canvas.width || !canvas.height) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha === 0) continue;

        const srcR = data[i];
        const srcG = data[i + 1];
        const srcB = data[i + 2];

        const isWhite = srcR > 200 && srcG > 200 && srcB > 200;
        const isNearWhite = Math.abs(srcR - srcG) < 20 &&
          Math.abs(srcG - srcB) < 20 &&
          srcR > 180 && srcG > 180 && srcB > 180;

        if (isWhite || isNearWhite) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else {
          const luminance = (0.2126 * srcR + 0.7152 * srcG + 0.0722 * srcB) / 255;
          const shade = Math.pow(luminance, 0.88);

          data[i] = Math.round(r * shade);
          data[i + 1] = Math.round(g * shade);
          data[i + 2] = Math.round(b * shade);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const tintedDataUrl = canvas.toDataURL('image/png');
      logoTintCache.set(cacheKey, tintedDataUrl);

      if ((logoEl.dataset.baseSrc || '') === baseSrc) {
        logoEl.src = tintedDataUrl;
      }
    } catch (error) {
    }
  };
  img.onerror = () => { };
  img.src = baseSrc;
}

function syncLogoThemeTone() {
  document.querySelectorAll('.logo, .home-logo').forEach(logoEl => {
    const baseSrc = logoEl.dataset.baseSrc || logoEl.getAttribute('src') || '';
    if (baseSrc && logoEl.src !== baseSrc) {
      logoEl.src = baseSrc;
    }
  });
}

function updateMatrixTheme() {
  syncLogoThemeTone();
  refreshActiveBackground();
}


function revertLogo() {
  const defaultLogo = LOCAL_DEFAULT_LOGO;

  const logoPreview = document.getElementById('logoPreview');
  const previewImg = logoPreview.querySelector('img');
  previewImg.src = defaultLogo;
  previewImg.style.display = 'block';
  logoPreview.querySelector('i').style.display = 'none';

  setSiteLogos(defaultLogo);

  localStorage.removeItem('customLogo');

  const revertBtn = event.target;
  const originalText = revertBtn.innerHTML;
  revertBtn.innerHTML = '<i class="fas fa-check"><\/i> Logo Reverted!';
  revertBtn.style.background = 'rgba(0, 255, 0, 0.2)';
  revertBtn.style.borderColor = 'var(--accent-orange)';

  setTimeout(() => {
    revertBtn.innerHTML = originalText;
    revertBtn.style.background = '';
    revertBtn.style.borderColor = '';
  }, 1500);
}

function revertFavicon() {
  const defaultFavicon = LOCAL_ACTIVE_FAVICON;
  const defaultInactiveFavicon = LOCAL_INACTIVE_FAVICON;

  const titleInput = document.getElementById('customTitle');
  const faviconInput = document.getElementById('customFavicon');

  if (titleInput) titleInput.value = 'Home';
  if (faviconInput) faviconInput.value = defaultInactiveFavicon;

  localStorage.removeItem('inactiveTabTitle');
  localStorage.removeItem('inactiveTabFavicon');

  if (document.hidden) {
    document.title = 'Home';
    setFavicon(defaultInactiveFavicon);
  }

  const revertBtn = event.target;
  const originalText = revertBtn.innerHTML;
  revertBtn.innerHTML = '<i class="fas fa-check"><\/i> Favicon Reverted!';
  revertBtn.style.background = 'rgba(0, 255, 0, 0.2)';
  revertBtn.style.borderColor = 'var(--accent-orange)';

  setTimeout(() => {
    revertBtn.innerHTML = originalText;
    revertBtn.style.background = '';
    revertBtn.style.borderColor = '';
  }, 1500);
}

function initializeSettings() {
  localStorage.setItem('cursorEnabled', 'false');
  localStorage.setItem('cursorStyle', 'default');
  localStorage.setItem('mouseTrailEnabled', 'false');
  localStorage.setItem('mouseShapesEnabled', 'false');
  setCursorStyle('default');
  destroyMouseFx();

  const activePresetIndex = normalizeThemePresetIndex(localStorage.getItem('activeThemePreset') || '0');
  localStorage.setItem('activeThemePreset', String(activePresetIndex));
  initThemePresetUI();
  applyThemePreset(activePresetIndex);
  syncSavedLessonGridColumns();

  const activeBackground = normalizeBackgroundStyle(localStorage.getItem('selectedBackground') || 'none');
  localStorage.setItem('selectedBackground', activeBackground);
  applyBackgroundStyle(activeBackground, false);

  const savedTitle = localStorage.getItem('inactiveTabTitle');
  const savedFavicon = normalizeFaviconPath(localStorage.getItem('inactiveTabFavicon'), LOCAL_INACTIVE_FAVICON);
  if (savedTitle) document.getElementById('customTitle').value = savedTitle;
  if (savedFavicon) document.getElementById('customFavicon').value = savedFavicon;

  const savedLogo = localStorage.getItem('customLogo');
  const logoSource = savedLogo || LOCAL_DEFAULT_LOGO;
  const logoPreview = document.getElementById('logoPreview');
  if (logoPreview) {
    const previewImg = logoPreview.querySelector('img');
    if (previewImg) {
      previewImg.src = logoSource;
      previewImg.style.display = 'block';
      logoPreview.querySelector('i').style.display = 'none';
    }
  }
  setSiteLogos(logoSource);
  syncLogoThemeTone();
  updateBackgroundSelectionUI();
}

function setDefaultSettings() {
  if (!localStorage.getItem('activeThemePreset')) {
    localStorage.setItem('activeThemePreset', '0');
  }
  if (!localStorage.getItem('selectedTheme')) {
    localStorage.setItem('selectedTheme', 'custom');
  }
  if (!localStorage.getItem('customThemeColor')) {
    localStorage.setItem('customThemeColor', THEME_PRESET_DEFAULTS[0].accent);
  }
  if (!localStorage.getItem('selectedBackground')) {
    localStorage.setItem('selectedBackground', 'none');
  } else {
    localStorage.setItem('selectedBackground', normalizeBackgroundStyle(localStorage.getItem('selectedBackground')));
  }
  if (!localStorage.getItem('lessonGridColumns')) {
    localStorage.setItem('lessonGridColumns', '3');
  }
  localStorage.setItem('cursorEnabled', 'false');
  localStorage.setItem('cursorStyle', 'default');
  localStorage.setItem('mouseTrailEnabled', 'false');
  localStorage.setItem('mouseShapesEnabled', 'false');

  if (!localStorage.getItem('inactiveTabTitle')) {
    localStorage.setItem('inactiveTabTitle', 'Home');
  }

  if (!localStorage.getItem('inactiveTabFavicon')) {
    localStorage.setItem('inactiveTabFavicon', LOCAL_INACTIVE_FAVICON);
  }
}

const gameTabsState = {
  tabs: [],
  activeId: null,
  nextId: 1,
  hideTimer: null,
  maxTabs: 1
};

function getGameShellElements() {
  return {
    page: document.getElementById('gamePage'),
    main: document.getElementById('main-container'),
    tabsStrip: document.getElementById('gameTabsStrip'),
    views: document.getElementById('gameViews')
  };
}

function getGameTabById(tabId) {
  return gameTabsState.tabs.find(tab => tab.id === tabId) || null;
}

function getActiveGameTab() {
  return getGameTabById(gameTabsState.activeId);
}

function setGameOverlayVisible(visible) {
  const shell = getGameShellElements();
  if (!shell.page || !shell.main) return;

  if (gameTabsState.hideTimer) {
    clearTimeout(gameTabsState.hideTimer);
    gameTabsState.hideTimer = null;
  }

  if (visible) {
    shell.page.classList.remove('slide-down');
    shell.page.classList.add('active');
    shell.main.classList.add('slide-down');
    const activeTab = getActiveGameTab();
    if (activeTab) resumeGameTab(activeTab);
  } else {
    gameTabsState.tabs.forEach(tab => freezeGameTab(tab));
    shell.page.classList.add('slide-down');
    shell.main.classList.remove('slide-down');
    gameTabsState.hideTimer = setTimeout(() => {
      shell.page.classList.remove('active', 'slide-down');
    }, 500);
  }

  ensureNativeCursorState();
}

function pauseMediaInFrame(frame, reset = false) {
  if (!frame) return;
  try {
    const iframeDoc = frame.contentDocument || frame.contentWindow.document;
    if (!iframeDoc) return;
    const mediaEls = iframeDoc.querySelectorAll('video, audio');
    mediaEls.forEach(media => {
      media.pause();
      if (reset) media.currentTime = 0;
    });
  } catch (error) {
  }
}

function getGameFreezeHarnessScript() {
  return `<script>
        (function() {
          if (window.__noahFreezeHarnessInstalled) return;
          window.__noahFreezeHarnessInstalled = true;

          var frozen = false;
          var rafCallbacks = new Map();
          var rafPending = new Set();
          var intervals = new Map();
          var timeouts = new Map();
          var audioContexts = [];
          var nextRafId = 1;
          var nextIntervalId = 1;
          var nextTimeoutId = 1;
          var nativeRaf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : null;
          var nativeCancelRaf = window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : null;
          var nativeSetInterval = window.setInterval.bind(window);
          var nativeClearInterval = window.clearInterval.bind(window);
          var nativeSetTimeout = window.setTimeout.bind(window);
          var nativeClearTimeout = window.clearTimeout.bind(window);

          function invokeSafely(cb, args, ts) {
            try {
              if (typeof ts === 'number') cb(ts);
              else cb.apply(window, args || []);
            } catch (error) {
              nativeSetTimeout(function() { throw error; }, 0);
            }
          }

          function scheduleInterval(entry) {
            entry.nativeId = nativeSetInterval(function() {
              if (frozen || !entry.active) return;
              invokeSafely(entry.cb, entry.args);
            }, entry.delay);
          }

          function scheduleTimeout(entry, delayMs) {
            var wait = Math.max(0, delayMs);
            entry.startedAt = Date.now();
            entry.nativeId = nativeSetTimeout(function() {
              if (!entry.active) return;
              entry.nativeId = null;
              if (frozen) {
                entry.remaining = Math.max(0, entry.delay - (Date.now() - entry.startedAt));
                return;
              }
              invokeSafely(entry.cb, entry.args);
              timeouts.delete(entry.id);
            }, wait);
          }

          function scheduleRaf(rafId) {
            if (!nativeRaf) return;
            nativeRaf(function(ts) {
              if (!rafCallbacks.has(rafId)) return;
              if (frozen) {
                rafPending.add(rafId);
                return;
              }
              var cb = rafCallbacks.get(rafId);
              rafCallbacks.delete(rafId);
              invokeSafely(cb, null, ts);
            });
          }

          if (nativeRaf) {
            window.requestAnimationFrame = function(cb) {
              if (typeof cb !== 'function') return nativeRaf(cb);
              var rafId = nextRafId++;
              rafCallbacks.set(rafId, cb);
              if (frozen) {
                rafPending.add(rafId);
                return rafId;
              }
              scheduleRaf(rafId);
              return rafId;
            };

            window.cancelAnimationFrame = function(rafId) {
              rafCallbacks.delete(rafId);
              rafPending.delete(rafId);
              if (nativeCancelRaf) nativeCancelRaf(rafId);
            };
          }

          window.setInterval = function(cb, delay) {
            if (typeof cb !== 'function') return nativeSetInterval(cb, delay);
            var intervalId = nextIntervalId++;
            var entry = {
              id: intervalId,
              cb: cb,
              args: Array.prototype.slice.call(arguments, 2),
              delay: Math.max(0, Number(delay) || 0),
              nativeId: null,
              active: true
            };
            intervals.set(intervalId, entry);
            if (!frozen) scheduleInterval(entry);
            return intervalId;
          };

          window.clearInterval = function(intervalId) {
            var entry = intervals.get(intervalId);
            if (!entry) {
              nativeClearInterval(intervalId);
              return;
            }
            entry.active = false;
            if (entry.nativeId !== null) nativeClearInterval(entry.nativeId);
            intervals.delete(intervalId);
          };

          window.setTimeout = function(cb, delay) {
            if (typeof cb !== 'function') return nativeSetTimeout(cb, delay);
            var timeoutId = nextTimeoutId++;
            var entry = {
              id: timeoutId,
              cb: cb,
              args: Array.prototype.slice.call(arguments, 2),
              delay: Math.max(0, Number(delay) || 0),
              remaining: Math.max(0, Number(delay) || 0),
              startedAt: 0,
              nativeId: null,
              active: true
            };
            timeouts.set(timeoutId, entry);
            if (!frozen) scheduleTimeout(entry, entry.remaining);
            return timeoutId;
          };

          window.clearTimeout = function(timeoutId) {
            var entry = timeouts.get(timeoutId);
            if (!entry) {
              nativeClearTimeout(timeoutId);
              return;
            }
            entry.active = false;
            if (entry.nativeId !== null) nativeClearTimeout(entry.nativeId);
            timeouts.delete(timeoutId);
          };

          function trackAudioContext(ctorName) {
            var NativeCtor = window[ctorName];
            if (!NativeCtor) return;
            function WrappedAudioContext() {
              var ctx = new NativeCtor(...arguments);
              audioContexts.push(ctx);
              if (frozen && typeof ctx.suspend === 'function') {
                Promise.resolve().then(function() { return ctx.suspend(); }).catch(function() {});
              }
              return ctx;
            }
            WrappedAudioContext.prototype = NativeCtor.prototype;
            Object.setPrototypeOf(WrappedAudioContext, NativeCtor);
            window[ctorName] = WrappedAudioContext;
          };
          trackAudioContext('AudioContext');
          trackAudioContext('webkitAudioContext');

          function setFrozen(nextFrozen) {
            frozen = !!nextFrozen;
            window.__NOAH_FROZEN__ = frozen;

            if (frozen) {
              document.documentElement.style.animationPlayState = 'paused';
              document.documentElement.style.transitionProperty = 'none';

              intervals.forEach(function(entry) {
                if (entry.nativeId !== null) {
                  nativeClearInterval(entry.nativeId);
                  entry.nativeId = null;
                }
              });

              timeouts.forEach(function(entry) {
                if (entry.nativeId !== null) {
                  entry.remaining = Math.max(0, entry.delay - (Date.now() - entry.startedAt));
                  nativeClearTimeout(entry.nativeId);
                  entry.nativeId = null;
                }
              });

              audioContexts.forEach(function(ctx) {
                if (ctx && ctx.state === 'running' && typeof ctx.suspend === 'function') {
                  Promise.resolve().then(function() { return ctx.suspend(); }).catch(function() {});
                }
              });

              try {
                var mediaEls = document.querySelectorAll('video, audio');
                mediaEls.forEach(function(media) { media.pause(); });
              } catch (error) {}
              return;
            }

            document.documentElement.style.animationPlayState = '';
            document.documentElement.style.transitionProperty = '';

            intervals.forEach(function(entry) {
              if (entry.active && entry.nativeId === null) scheduleInterval(entry);
            });

            timeouts.forEach(function(entry) {
              if (entry.active && entry.nativeId === null) scheduleTimeout(entry, entry.remaining);
            });

            audioContexts.forEach(function(ctx) {
              if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
                Promise.resolve().then(function() { return ctx.resume(); }).catch(function() {});
              }
            });

            if (nativeRaf && rafPending.size) {
              var pendingIds = Array.from(rafPending);
              rafPending.clear();
              pendingIds.forEach(scheduleRaf);
            }
          }

          window.addEventListener('message', function(event) {
            if (!event || !event.data || event.data.type !== 'NOAH_TAB_STATE') return;
            setFrozen(!!event.data.frozen);
          });

          window.__NOAH_SET_FROZEN__ = setFrozen;
        })();
      <\/script>`;
}

function injectFreezeHarnessIntoHtml(html) {
  if (!html || typeof html !== 'string') return html;
  const harness = getGameFreezeHarnessScript();

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, match => `${match}\n${harness}`);
  }

  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body[^>]*>/i, match => `${match}\n${harness}`);
  }

  return `${harness}\n${html}`;
}

function postTabFreezeMessage(tab, frozen) {
  if (!tab || !tab.frame) return;
  try {
    if (tab.frame.contentWindow) {
      tab.frame.contentWindow.postMessage({ type: 'NOAH_TAB_STATE', frozen }, '*');
    }
  } catch (error) {
  }
  tab.frozen = frozen;
}

function freezeGameTab(tab) {
  if (!tab || !tab.frame) return;
  if (document.fullscreenElement === tab.frame && document.exitFullscreen) {
    document.exitFullscreen();
  }
  pauseMediaInFrame(tab.frame, false);
  postTabFreezeMessage(tab, true);
}

function resumeGameTab(tab) {
  if (!tab || !tab.frame) return;
  postTabFreezeMessage(tab, false);
}

function setActiveGameTab(tabId) {
  const target = getGameTabById(tabId);
  if (!target) return;

  const previous = getActiveGameTab();
  if (previous && previous.id !== tabId) {
    freezeGameTab(previous);
  }

  gameTabsState.activeId = tabId;
  gameTabsState.tabs.forEach(tab => {
    const isActive = tab.id === tabId;
    tab.button.classList.toggle('active', isActive);
    tab.frame.classList.toggle('active', isActive);
  });
  resumeGameTab(target);
}

function createGameTab(title, url) {
  const shell = getGameShellElements();
  if (!shell.tabsStrip || !shell.views) return null;

  const tabId = `game-tab-${gameTabsState.nextId++}`;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'game-tab';
  button.dataset.tabId = tabId;

  const titleEl = document.createElement('span');
  titleEl.className = 'game-tab-title';
  titleEl.textContent = title;

  const closeEl = document.createElement('span');
  closeEl.className = 'game-tab-close';
  closeEl.innerHTML = '<i class="fas fa-xmark"></i>';

  button.appendChild(titleEl);
  button.appendChild(closeEl);

  const frame = document.createElement('iframe');
  frame.className = 'game-frame';
  frame.dataset.tabId = tabId;
  frame.setAttribute('frameborder', '0');
  frame.setAttribute('name', tabId);
  frame.src = 'about:blank';

  const tab = {
    id: tabId,
    title,
    url,
    button,
    frame,
    loadingTimer: null,
    frozen: false,
    loadToken: 0
  };

  frame.addEventListener('load', () => {
    const liveTab = getGameTabById(tabId);
    if (!liveTab) return;
    if (liveTab.frozen) pauseMediaInFrame(liveTab.frame, false);
    postTabFreezeMessage(liveTab, !!liveTab.frozen);
  });

  button.addEventListener('click', (event) => {
    if (event.target.closest('.game-tab-close')) return;
    setActiveGameTab(tabId);
  });

  button.addEventListener('auxclick', (event) => {
    if (event.button === 1) {
      event.preventDefault();
      closeLesson(tabId);
    }
  });

  closeEl.addEventListener('click', (event) => {
    event.stopPropagation();
    closeLesson(tabId);
  });

  shell.tabsStrip.appendChild(button);
  shell.views.appendChild(frame);
  gameTabsState.tabs.push(tab);
  return tab;
}

function loadGameIntoTab(tab) {
  if (!tab || !tab.frame) return;

  if (tab.loadingTimer) {
    clearTimeout(tab.loadingTimer);
    tab.loadingTimer = null;
  }

  tab.loadToken += 1;
  const loadToken = tab.loadToken;
  const tabId = tab.id;
  tab.suspended = false;

  tab.frame.srcdoc = createGameLoadingScreen(tab.title);

  tab.loadingTimer = setTimeout(() => {
    const liveTab = getGameTabById(tabId);
    if (!liveTab || !liveTab.frame || liveTab.loadToken !== loadToken) return;

    const gameUrl = liveTab.url || '';
    
    const gameHTML = createGameFrameWithHarness(gameUrl, tab.title);
    liveTab.frame.srcdoc = gameHTML;
    
  }, 1500);
}

function createGameFrameWithHarness(gamePath, gameTitle) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gameTitle}</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
    ${getGameFreezeHarnessScript()}
</head>
<body>
    <iframe id="noah-inner-game-frame" src="${gamePath}" frameborder="0" allowfullscreen></iframe>
    <script>
        (function() {
            var innerFrame = document.getElementById('noah-inner-game-frame');
            var frozen = false;
            
            function applyFrozenState() {
                if (!innerFrame) return;
                innerFrame.style.pointerEvents = frozen ? 'none' : '';
                innerFrame.style.filter = frozen ? 'saturate(0.7) brightness(0.9)' : '';
                try {
                    if (innerFrame.contentWindow) {
                        innerFrame.contentWindow.postMessage({ type: 'NOAH_TAB_STATE', frozen: frozen }, '*');
                    }
                } catch (error) {}
            }

            innerFrame.addEventListener('load', function() {
                applyFrozenState();
            });

            window.addEventListener('message', function(event) {
                if (!event || !event.data || event.data.type !== 'NOAH_TAB_STATE') return;
                frozen = !!event.data.frozen;
                applyFrozenState();
            });
        })();
    </script>
</body>
</html>`;
}

function openLesson(t, u) {

  if (typeof gtag !== 'undefined') {
    gtag('event', 'game_launch', {
      'event_category': 'game_interaction',
      'event_label': t,
      'value': 1
    });
  }

  const timeOnSite = Math.round((Date.now() - window.pageLoadTime) / 1000);
  if (typeof gtag !== 'undefined') {
    gtag('event', 'timing_complete', {
      'name': 'time_to_first_game',
      'value': timeOnSite,
      'event_category': 'engagement'
    });
  }

  const normalizedUrl = (u || '').trim();
  const existingTab = gameTabsState.tabs.find(tab =>
    ((tab.url || '').trim() === normalizedUrl) ||
    (tab.title === t)
  );
  if (existingTab) {
    setGameOverlayVisible(true);
    setActiveGameTab(existingTab.id);
    ensureNativeCursorState();
    return;
  }

  if (gameTabsState.maxTabs <= 1 && gameTabsState.tabs.length) {
    const activeSlot = gameTabsState.tabs[0];
    if (!activeSlot) return;

    activeSlot.title = t;
    activeSlot.url = u;

    if (activeSlot.button) {
      activeSlot.button.title = t;
      const titleEl = activeSlot.button.querySelector('.game-tab-title');
      if (titleEl) titleEl.textContent = t;
    }

    setGameOverlayVisible(true);
    setActiveGameTab(activeSlot.id);
    loadGameIntoTab(activeSlot);
    ensureNativeCursorState();
    return;
  }

  const tab = createGameTab(t, u);
  if (!tab) return;
  setGameOverlayVisible(true);
  setActiveGameTab(tab.id);
  loadGameIntoTab(tab);
  ensureNativeCursorState();
}

function createSimpleIframeWrapper(url) {
  return `<!DOCTYPE html>
			                            <html>
			                            <head>
			                                <meta charset="UTF-8">
		                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
		                                <title>Game<\/title>
		                                <style>
		                                    body, html {
		                                        margin: 0;
		                                        padding: 0;
		                                        width: 100%;
		                                        height: 100%;
		                                        overflow: hidden;
		                                        background: #000;
		                                    }
			                                    iframe {
			                                        width: 100%;
			                                        height: 100%;
			                                        border: none;
			                                    }
			                                <\/style>
			                                ${getGameFreezeHarnessScript()}
			                            <\/head>
			                            <body>
			                                <iframe id="noah-inner-game-frame" src="${url}" frameborder="0" allowfullscreen><\/iframe>
			                                <script>
			                                  (function() {
			                                    var innerFrame = document.getElementById('noah-inner-game-frame');
			                                    var frozen = false;
			                                    function applyFrozenState() {
			                                      if (!innerFrame) return;
			                                      innerFrame.style.pointerEvents = frozen ? 'none' : '';
			                                      innerFrame.style.filter = frozen ? 'saturate(0.7) brightness(0.9)' : '';
			                                      try {
			                                        if (innerFrame.contentWindow) {
			                                          if (frozen && typeof innerFrame.contentWindow.stop === 'function') {
			                                            innerFrame.contentWindow.stop();
			                                          }
			                                          innerFrame.contentWindow.postMessage({ type: 'NOAH_TAB_STATE', frozen: frozen }, '*');
			                                        }
			                                      } catch (error) {}
			                                    }

			                                    innerFrame.addEventListener('load', function() {
			                                      applyFrozenState();
			                                    });

			                                    window.addEventListener('message', function(event) {
			                                      if (!event || !event.data || event.data.type !== 'NOAH_TAB_STATE') return;
			                                      frozen = !!event.data.frozen;
			                                      applyFrozenState();
			                                    });
			                                  })();
			                                <\/script>
			                            <\/body>
			                            <\/html>`;
}

function closeLesson(tabId = null) {
  const targetId = tabId || gameTabsState.activeId;
  const targetTab = getGameTabById(targetId);
  if (!targetTab) return;

  if (typeof gtag !== 'undefined') {
    gtag('event', 'game_exit', {
      'event_category': 'game_interaction',
      'event_label': targetTab.title,
      'value': 1
    });
  }

  const tabIndex = gameTabsState.tabs.findIndex(tab => tab.id === targetId);
  if (tabIndex === -1) return;

  if (targetTab.loadingTimer) {
    clearTimeout(targetTab.loadingTimer);
  }

  if (document.fullscreenElement === targetTab.frame && document.exitFullscreen) {
    document.exitFullscreen();
  }

  pauseMediaInFrame(targetTab.frame);
  targetTab.frame.src = 'about:blank';
  targetTab.frame.srcdoc = '';
  targetTab.frame.classList.remove('fullscreen');

  targetTab.button.remove();
  targetTab.frame.remove();
  gameTabsState.tabs.splice(tabIndex, 1);

  if (!gameTabsState.tabs.length) {
    gameTabsState.activeId = null;
    setGameOverlayVisible(false);
    return;
  }

  const fallbackTab = gameTabsState.tabs[tabIndex] || gameTabsState.tabs[tabIndex - 1] || gameTabsState.tabs[0];
  if (fallbackTab) {
    setActiveGameTab(fallbackTab.id);
  }
}

function exitGameBrowser() {
  setGameOverlayVisible(false);
}

function openTabInfoModal() {
  const modal = document.getElementById('tabInfoModal');
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function closeTabInfoModal() {
  const modal = document.getElementById('tabInfoModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

async function copyTabInfoLink(url, triggerEl) {
  const originalText = triggerEl ? triggerEl.textContent : '';
  const setCopiedState = (label) => {
    if (!triggerEl) return;
    triggerEl.textContent = label;
    triggerEl.disabled = true;
    setTimeout(() => {
      triggerEl.textContent = originalText || 'Copy';
      triggerEl.disabled = false;
    }, 1200);
  };

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const tempInput = document.createElement('textarea');
      tempInput.value = url;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    }
    setCopiedState('Copied');
  } catch (error) {
    alert('Copy failed. Link: ' + url);
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gameTabsState.tabs.forEach(tab => freezeGameTab(tab));
  } else if (document.getElementById('gamePage')?.classList.contains('active')) {
    const activeTab = getActiveGameTab();
    if (!activeTab) return;
    resumeGameTab(activeTab);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeTabInfoModal();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    openSettings();
  }
});

document.addEventListener('click', (event) => {
  const modal = document.getElementById('tabInfoModal');
  if (!modal || !modal.classList.contains('active')) return;
  if (event.target === modal) closeTabInfoModal();
});

document.addEventListener('DOMContentLoaded', function () {
  const sortSelect = document.getElementById('sortSelect');

  if (sortSelect) {
    sortSelect.addEventListener('change', function (e) {
      currentSortMethod = e.target.value;
      applySorting();
    });
  }

  currentSortMethod = 'default';
  bootstrapLessonsInterface();
});

function readStorageObject(storage) {
  const data = {};
  if (!storage) return data;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key !== null) data[key] = storage.getItem(key);
  }
  return data;
}

function parseCookiesToObject() {
  const cookieObject = {};
  const raw = document.cookie || '';
  if (!raw.trim()) return cookieObject;
  raw.split(';').forEach(cookiePart => {
    const [rawKey, ...rest] = cookiePart.split('=');
    const key = (rawKey || '').trim();
    if (!key) return;
    cookieObject[key] = rest.join('=').trim();
  });
  return cookieObject;
}

function getAllSettings() {
  const localData = readStorageObject(window.localStorage);
  const sessionData = readStorageObject(window.sessionStorage);
  const cookiesData = parseCookiesToObject();
  return {
    version: '2.0',
    exportDate: new Date().toISOString(),
    siteName: "Noah's Tutoring Hub",
    exportType: 'site-data',
    localStorageData: localData,
    sessionStorageData: sessionData,
    cookiesData: cookiesData,
    favorites: Array.isArray(favorites) ? favorites : [],
    settings: {
      selectedTheme: localData.selectedTheme || 'default',
      activeThemePreset: localData.activeThemePreset || '0',
      themePresets: localData.themePresets || null,
      selectedBackground: localData.selectedBackground || 'none',
      customThemeColor: localData.customThemeColor || '#c27c15',
      lessonGridColumns: localData.lessonGridColumns || '3',
      cursorEnabled: localData.cursorEnabled || 'false',
      cursorStyle: localData.cursorStyle || 'default',
      inactiveTabTitle: localData.inactiveTabTitle || 'Home',
      inactiveTabFavicon: normalizeFaviconPath(localData.inactiveTabFavicon, LOCAL_INACTIVE_FAVICON),
      customLogo: localData.customLogo || null,
      flashEnabled: localData.flashEnabled || 'true',
      lastSearchTerm: localData.lastSearchTerm || '',
      sortMethod: localData.sortMethod || 'default'
    }
  };
}

function exportSettings() {
  const settings = getAllSettings();
  const settingsJson = JSON.stringify(settings, null, 2);

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const filename = `noahstutoring-site-data-${timestamp}.json`;

  const blob = new Blob([settingsJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showImportStatus('Site data exported successfully!', 'success');

    if (typeof gtag !== 'undefined') {
      gtag('event', 'settings_export', {
        'event_category': 'settings',
        'event_label': 'export',
        'value': 1
      });
    }
  }, 100);
}

function importSettings() {
  const importContainer = document.getElementById('importFileContainer');
  const statusDiv = document.getElementById('settingsImportStatus');

  if (importContainer.style.display === 'none') {
    importContainer.style.display = 'flex';
    statusDiv.style.display = 'none';
    return;
  }

  const fileInput = document.getElementById('settingsFileInput');
  if (!fileInput.files || !fileInput.files[0]) {
    showImportStatus('Please select a data export file first.', 'error');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const importedSettings = JSON.parse(e.target.result);

      if (!validateSettings(importedSettings)) {
        showImportStatus('Invalid data export file format.', 'error');
        return;
      }

      if (confirm(`Import this site data backup? Current local data will be overwritten.`)) {
        applyImportedSettings(importedSettings);

        showImportStatus('Site data imported successfully!', 'success');

        closeSettings();

        if (fileInput) {
          fileInput.value = '';
          importContainer.style.display = 'none';
        }

        if (typeof gtag !== 'undefined') {
          gtag('event', 'settings_import', {
            'event_category': 'settings',
            'event_label': 'import',
            'value': 1
          });
        }
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      showImportStatus('Error reading data export file.', 'error');
    }
  };

  reader.onerror = function () {
    showImportStatus('Error reading file.', 'error');
  };

  reader.readAsText(file);
}

function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') return false;
  const hasLegacySettings = settings.settings && typeof settings.settings === 'object';
  const hasStorageSnapshot = settings.localStorageData && typeof settings.localStorageData === 'object';
  if (!hasLegacySettings && !hasStorageSnapshot) return false;
  if (settings.favorites !== undefined && !Array.isArray(settings.favorites)) {
    return false;
  }
  return true;
}

function applyImportedSettings(importedSettings) {
  if (importedSettings.localStorageData && typeof importedSettings.localStorageData === 'object') {
    localStorage.clear();
    Object.entries(importedSettings.localStorageData).forEach(([key, value]) => {
      if (typeof key === 'string' && key) {
        localStorage.setItem(key, value === null || value === undefined ? '' : String(value));
      }
    });
  }

  if (importedSettings.sessionStorageData && typeof importedSettings.sessionStorageData === 'object') {
    sessionStorage.clear();
    Object.entries(importedSettings.sessionStorageData).forEach(([key, value]) => {
      if (typeof key === 'string' && key) {
        sessionStorage.setItem(key, value === null || value === undefined ? '' : String(value));
      }
    });
  }

  if (importedSettings.cookiesData && typeof importedSettings.cookiesData === 'object') {
    Object.entries(importedSettings.cookiesData).forEach(([key, value]) => {
      if (typeof key === 'string' && key) {
        document.cookie = `${key}=${value ?? ''}; path=/; max-age=31536000`;
      }
    });
  }

  if (importedSettings.favorites && Array.isArray(importedSettings.favorites)) {
    favorites = importedSettings.favorites;
    localStorage.setItem('gameFavorites', JSON.stringify(favorites));
  }

  const settings = importedSettings.settings && typeof importedSettings.settings === 'object'
    ? importedSettings.settings
    : {
      selectedTheme: localStorage.getItem('selectedTheme') || 'default',
      activeThemePreset: localStorage.getItem('activeThemePreset') || '0',
      themePresets: localStorage.getItem('themePresets') || null,
      selectedBackground: localStorage.getItem('selectedBackground') || 'none',
      customThemeColor: localStorage.getItem('customThemeColor') || '#c27c15',
      lessonGridColumns: localStorage.getItem('lessonGridColumns') || '3',
      cursorEnabled: localStorage.getItem('cursorEnabled') || 'false',
      cursorStyle: localStorage.getItem('cursorStyle') || 'default',
      inactiveTabTitle: localStorage.getItem('inactiveTabTitle') || 'Home',
      inactiveTabFavicon: normalizeFaviconPath(localStorage.getItem('inactiveTabFavicon'), LOCAL_INACTIVE_FAVICON),
      customLogo: localStorage.getItem('customLogo') || null,
      flashEnabled: localStorage.getItem('flashEnabled') || 'true',
      lastSearchTerm: localStorage.getItem('lastSearchTerm') || '',
      sortMethod: localStorage.getItem('sortMethod') || 'default'
    };

  Object.keys(settings).forEach(key => {
    if (settings[key] !== null && settings[key] !== undefined) {
      const value = key === 'themePresets' && typeof settings[key] !== 'string'
        ? JSON.stringify(settings[key])
        : String(settings[key]);
      localStorage.setItem(key, value);
    }
  });

  localStorage.setItem('cursorEnabled', 'false');
  localStorage.setItem('cursorStyle', 'default');
  localStorage.setItem('mouseTrailEnabled', 'false');
  localStorage.setItem('mouseShapesEnabled', 'false');
  destroyMouseFx();
  setCursorStyle('default');
  if (!localStorage.getItem('activeThemePreset')) {
    const legacyPresetIndex = getLegacyThemePresetIndex(settings.selectedTheme);
    localStorage.setItem('activeThemePreset', String(legacyPresetIndex === null ? 0 : legacyPresetIndex));
  }

  initializeSettings();
  applyLessonGridColumns(settings.lessonGridColumns || localStorage.getItem('lessonGridColumns') || '3');
  refreshActiveBackground();
}

function showImportStatus(message, type) {
  const statusDiv = document.getElementById('settingsImportStatus');
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.style.display = 'block';
  statusDiv.style.color = type === 'success' ? 'var(--accent-orange)' : '#ff4444';

  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000);
}

document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('settingsFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        const statusDiv = document.getElementById('settingsImportStatus');
        statusDiv.textContent = `Selected: ${this.files[0].name}`;
        statusDiv.style.display = 'block';
        statusDiv.style.color = 'var(--primary-orange)';
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      exportSettings();
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const adToggle = document.getElementById('adToggle');
  if (adToggle) {
    adToggle.checked = localStorage.getItem('adsDisabled') === 'true';
  }
});

function openSiteInAboutBlank() {
  const newWindow = window.open('about:blank', '_blank');

  if (newWindow) {
    const aboutBlankHTML = `
		                                <!DOCTYPE html>
		                                <html>
		                                <head>
		                                   <title>Noah's Tutoring Hub<\/title>
		                                <\/head>
		                                <body>
		                                   <script>
		                                       fetch('/')
		                                           .then(response => response.text())
		                                           .then(data => {
		                                               document.open();
		                                               document.write(data);
		                                               document.close();
		                                           })
		                                           .catch(error => {
		                                               console.error('Error:', error);
		                                               document.body.innerHTML = '<div style="padding: 20px; color: white; background: black; font-family: monospace;">Error loading site. Please visit manually.<\/div>';
		                                           });
		                                   <\/script>
		                                <\/body>
		                                <\/html>`;

    newWindow.document.open();
    newWindow.document.write(aboutBlankHTML);
    newWindow.document.close();

    try {
      window.close();
    } catch (e) {
    }
  } else {
    alert("Turn ur popups on mf");
  }
}

const backToTopBtn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  const gamePage = document.getElementById('gamePage');
  const backToTopBtn = document.getElementById("backToTop");

  if (!backToTopBtn) return;

  if (gamePage && gamePage.classList.contains('active')) {
    backToTopBtn.classList.remove("show");
    return;
  }

  if (window.scrollY > 14000) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
});

function loadGameWithCompatibleUrl(title, originalUrl) {
  const compatibleUrl = convertToCompatibleUrl(originalUrl);
  openLesson(title, compatibleUrl);
}

function createGameLoadingScreen(gameTitle) {
  let primaryColor, accentColor, darkColor;
  const currentTheme = localStorage.getItem('selectedTheme') || 'default';

  if (currentTheme === 'custom') {
    const customColor = localStorage.getItem('customThemeColor') || '#c27c15';
    primaryColor = customColor;

    const hex = customColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const accentR = Math.min(255, Math.floor(r * 1.2));
    const accentG = Math.min(255, Math.floor(g * 1.2));
    const accentB = Math.min(255, Math.floor(b * 1.2));
    accentColor = `rgb(${accentR}, ${accentG}, ${accentB})`;

    const darkR = Math.max(0, Math.floor(r * 0.3));
    const darkG = Math.max(0, Math.floor(g * 0.3));
    const darkB = Math.max(0, Math.floor(b * 0.3));
    darkColor = `rgb(${darkR}, ${darkG}, ${darkB})`;
  } else {
    const themeColors = {
      'default': { primary: '#f4f4f6', accent: '#c79a67', dark: '#030303' },
      'legacy-orange': { primary: '#c27c15', accent: '#e69500', dark: '#1a1a1a' },
      'rainbow': { primary: '#ff0080', accent: '#ff00ff', dark: '#0a0a0a' },
      'cyber-green': { primary: '#00ff00', accent: '#00cc00', dark: '#000000' },
      'ice-blue': { primary: '#00ccff', accent: '#0088cc', dark: '#001122' },
      'solarized': { primary: '#2aa198', accent: '#268bd2', dark: '#002b36' },
      'purple-haze': { primary: '#9b59b6', accent: '#6c3483', dark: '#1a1a2e' }
    };

    const colors = themeColors[currentTheme] || themeColors['default'];
    primaryColor = colors.primary;
    accentColor = colors.accent;
    darkColor = colors.dark;
  }

  function colorToHex(color) {
    if (color.startsWith('#')) {
      return color;
    }
    if (color.startsWith('rgb(')) {
      const rgb = color.match(/\d+/g);
      return '#' + rgb.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }
    return '#c27c15';
  }

  function rgbToNumber(color) {
    if (color.startsWith('#')) {
      return parseInt(color.replace('#', '0x'));
    }
    if (color.startsWith('rgb(')) {
      const rgb = color.match(/\d+/g);
      return (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2]);
    }
    return 0xc27c15;
  }

  const primaryHex = colorToHex(primaryColor);
  const accentHex = colorToHex(accentColor);
  const darkHex = colorToHex(darkColor);

  const highlightColor = rgbToNumber(accentColor);
  const midtoneColor = rgbToNumber(primaryColor);
  const lowlightColor = rgbToNumber(accentColor);
  const baseColor = rgbToNumber(darkColor);

  const quotes = [
    "Cmon we all know that Marval Rivals is overrated",
    "Everyone knows ur a furry buddy",
    "For the love of god go touch some grass",
    "Are you enjoying the site? You better be or else...",
    "Join my discord I have funny things on there",
    "Tell me your favorite game in discord",
    "Call 911!! Whats the Number?",
    "Access Denied - You are Gay",
    "HELPPPPPPP HELPPPP MEEE",
    "Linganguliguliwatalingagoolingangoo",
    "Make sure the one homie that doesnt hop on knows who hate him",
    "Make sure you do your homework buddy im watching you",
    "Does your mom know you're gay?",
    "If you can read this you're too close",
    "I see you looking at my code",
    "This game is way better than Fortnite",
    "This game is way worse than Fortnite",
    "I like turtles",
    "Why are you still reading these?",
    "Press F to thank the bus driver",
    "I said wait mf....",
    "Fun fact: your chopped",
    "Yoooo whats up",
    "Stop @ing me on discord bruh",
    "Isnt this loading screen cool?",
    "This site was made with love <3",
    "FAHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH",
    "These edibles ain't shit",
    "Game will load in just a moment",
    "Are we there yet",
    "You know I have to type of of these",
    "I wish my dad came back with the milk",
    "Uhhh my mom said I have to do my homework first",
    "Hey siri whats the name of this site",
    "Should've used adblock",
    "That's what she said",
    "Who made this piece of shit",
    "It's not a bug it's a feature",
    "The numbers Mason, what do they mean",
    "Mila wheela the greatest!!",
    "Bacon Bacon Bacon",
    "My name is anderdingus",
    "Goo goo ga ga",
    "Why is this taking so long?",
    "Mane fawk you mama huevo",
    "Ill give you 5$ to say the n-word",
    "Meow",
    "Take your pants off in 3... 2... 1...",
    "Is it okay if I touch you....?",
    "AAAAAAAAAAAAAHHHHHHHHHHHHHHHHHH",
    "did you know Thugalicious is a young cracka?",
    "all hail daddy T (thugalicious)",
    "I hope you like my games",
    "getting thuggy wit it by King. T",
    "not the hub😎😎😎",
    "fih",
    "sponsored by Benjamin N.",
    "Securly is a bitch",
    "ion want no damn pickle",
    "I WAKE UP TO GO TO SLEEP",
    "I drink soda I eat pizza!",
    "Dude just said \"I drink soda I eat pizza\"",
    "Someone make a black pill edit of me",
    "Go to bed it's a school night",
    "I am not in danger skyler, I am the danger",
    "Guys stop saying im in the files",
    "focking glizzy just bit me man",
    "just a heads up this game is pretty bad ngl",
    "I hope you like this loading screen because it took way too long to make",
    "quotes are hard to come up with",
    "I should be working on my next game but here we are",
    "I have to type out 50 of these for the loading screen",
    "cmon just load the game already",
    "this is the last quote I promise",
    "uhhh I ran out of quotes",
    "if you want your own quote on here join my discord 🥺",
    "MIII BOMBOCLATTTT",
    "my name is retep and I hate...",
    "ay why yall put cheese on my cheese burger?",
    "Yeah, its my birthday, what can i get for free? Uhh nothing? You a BICTH",
    "that focking bird that I hate",
    "I am Tanka Jahari but I would NEVER order a whole pizza for myself.",
    "Vat is dis? I did not vant dis!",
    "Is it was almond of the Walnut?",
    "Is they squeezing it out of the penut?",
    "I swear its bigger, its really cold",
    "fun Fact, twerking burns 285.43 calories a second, make sure to send proof in the typing section!",
    "dame tu culo",
    "ronaldo is the best soccer player ever",
    "im gay -joseph beltran",
    "this is all a simulation, ur not real",
    "are u alright? No! You are all left",
    "What is the difference between a baked potato and an apple? Im very homosexual!",
    "you lie! I crack your ass",
    "messi is better than ronaldo",
    "if theres a hole theres a goal",
    "they ripped off my pepino",
    "your chromebook will self destruct in 5 seconds",
    "Virus installing....",
    "uploading device to epstein files...",
    "digging in ass...",
    "hey siri how do you pronnounce spontaneity?",
    "everyday we eatin good",
    "it wraps around not ONCE, not TWICE, but THRICE!",
    "shutup MOMMMMMM, silence from YOUU, your cut OFF from TALKING",
    "Do everything like your name is on it -Joya",
    "eh pretty cool site",
    "in the big 2026",
    "big yahu",
    "sink let that in",
    "This site won't give you a virus trust",
    "giggity",
    "read this if you like boys",
    "jiggle my balls to niagra falls and before u do that, take off my drawls",
    "I heard if you type in epstein something CRAZY happens...",
    "You can't be shit if you don't start shit",
    "You can’t spell thug without hug",
    "2026 is the new 2016",
    "made by the thugs for the thugs",
    "u can touch shit and shit will be on your hands -holydih120",
    "play our games",
    "Some people don’t realize there worth until their worth nothing -joe",
    "Anything but doing work",
    "Sometimes you gotta fart in order to shart",
    "black on black on black",
    "Keep calm and swag on",
    "can’t let go is the hardest geometry dash level -holydih120",
    "call me thugalicious cus all my homies cant keep their hands to themselves 🥵",
    "HE CANT KEEP GETTING AWAY WITH THISSSS",
    "Dany Slicer will take down this site",
    "Yall need to stop spiking my corisol frl",
    "can I please have a water, please?",
    "Clavicular CASSUALY ran in to ASU frat leader and gets BRUTALLY frame mogged",
    "But when IIIIIIII win a 40v1 I get -1000 AURAAAAA",
    "lwk gotta take a shit brb",
    "Call me DL the way I can’t get out the closet” -Bae da Philosopher",
    "my homies ask if im gay, but the closet is made of glass.",
    "Big yahu, DESTROY HIM",
    "i’m really horny -98corbins",
    "BOMBOCLATTTTTTTT",
    "It is better to shit in the sink... than to sink... in the shit...",
    "You know it's cold outside, when you go outside, and it's cold",
    "deltarune tomorrow",
    "I woke up today in this morning in the morning I woke up this morning I woke up and remember that every morning that I wake up",
    "Never back down never what -nick eh 30",
    "ts website lowk comp",
    "Keep you head down and your chin up",
    "lil bro hop off ma dihh",
    "this is this, and that is that",
    "If im gay you're gay too",
    "Ima be under your bed tonight, be ready",
    "Who TF lives in Nebraska",
    "Better to cum in the sink, than sink in the cum -Gdkbeetlethugaming",
    "My teacher ate his own shit",
    "did he just say his last name's BURDER?",
    "does he come with a side of FRIES?",
    "Cake is cake even if it has a candle",
    "Hope you have a nice gaming session -NRGmason48",
    "if this was real life you’d be dead -angelmag1980",
    "vete para alla -angelmag1980",
    "i like men -Raul ulloa",
    "I am kevin G btw",
    "thug should pay me",
    "I should be payed frfr",
    "teachers literally behind you",
    "some dude in the back of the walmart told me to suck his dih for a 2 dollar bill, idek know who would take that deal, anyway i found this 2 dollar bill -midgetfucker53",
    "ay bro, u tryna f*ck?",
    "lemme crack -thugalicious120",
    "If u goon in class goon quietly",
    "make sure your teacher aint lookin gang -jubihat",
    "thugalicious is a femboy in disguise",
    "alt+tab to get away from the teachers catching you playing gamrs",
    "if you get caught you get caught",
    "contentkeeper sucks",
    "Jay likes diddy partys",
    "I have to go to the bathroom but I also want to keep playing",
    "Do your work gng",
    "Math class is boring why do you think i made this site?",
    "If a black person got BBC, then what does a white person have?",
    "They would have a BWC",
    "You should be listening to the teacher.",
    "If you don't do your work, you will never succeed in life.",
    "This site is for educational purposes only, please don't get in trouble.",
    "I hope you learn something new today",
    "I want goth babe",
    "CTRL+D bookmark this shi",
    "thugalicious abuses me",
  ];

  const loadingSteps = [
    { status: "Stealing Lesson....", progress: 15, time: 800 },
    { status: "Aquiring HTML assets..", progress: 30, time: 700 },
    { status: "Putting in the thingamabobs...", progress: 45, time: 900 },
    { status: "Screwing in the doohickeys..", progress: 60, time: 1200 },
    { status: "Establishing tarbonator...", progress: 75, time: 600 },
    { status: "Contacting Netanyahu....", progress: 85, time: 800 },
    { status: "Finalizing...", progress: 95, time: 1000 },
    { status: "Ready to launch...", progress: 100, time: 1200 }
  ];

  function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  return `
		                                    <!DOCTYPE html>
		                                    <html lang="en">
		                                    <head>
		                                        <meta charset="UTF-8">
		                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
		                                        <title>Loading ${gameTitle}<\/title>
		                                        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"><\/script>
		                                        <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js"><\/script>
		                                        <style>
		                                            * {
		                                                margin: 0;
		                                                padding: 0;
		                                                box-sizing: border-box;
		                                            }

		                                            body {
		                                                margin: 0;
		                                                padding: 0;
		                                                width: 100%;
		                                                height: 100vh;
		                                                overflow: hidden;
		                                                font-family: 'Courier New', monospace;
		                                                background: ${darkColor};
		                                            }

		                                            #vanta-bg {
		                                                position: absolute;
		                                                top: 0;
		                                                left: 0;
		                                                width: 100%;
		                                                height: 100%;
		                                                z-index: 1;
		                                            }

		                                            .loading-content {
		                                                text-align: center;
		                                                width: 90%;
		                                                max-width: 500px;
		                                                z-index: 2;
		                                                position: relative;
		                                                margin: 0 auto;
		                                                padding-top: 25vh;
		                                            }

		                                            .game-title {
		                                                color: ${accentColor};
		                                                font-size: 1.8rem;
		                                                margin-bottom: 5px;
		                                                font-weight: 600;
		                                                letter-spacing: 1px;
		                                                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		                                            }

		                                            .game-subtitle {
		                                                color: ${accentColor}70;
		                                                font-size: 0.9rem;
		                                                margin-bottom: 30px;
		                                                font-weight: 400;
		                                                letter-spacing: 3px;
		                                                text-transform: uppercase;
		                                            }

		                                            .status {
		                                                color: ${primaryColor};
		                                                font-size: 1rem;
		                                                margin-bottom: 30px;
		                                                font-weight: 500;
		                                                height: 20px;
		                                                letter-spacing: 0.5px;
		                                                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		                                            }

		                                            .loading-bar-container {
		                                                width: 100%;
		                                                height: 4px;
		                                                background: rgba(255, 255, 255, 0.1);
		                                                border-radius: 2px;
		                                                margin: 30px 0 20px;
		                                                overflow: hidden;
		                                                position: relative;
		                                            }

		                                            .loading-bar {
		                                                position: absolute;
		                                                top: 0;
		                                                left: 0;
		                                                width: 30%;
		                                                height: 100%;
		                                                background: linear-gradient(90deg,
		                                                    transparent,
		                                                    ${primaryColor}80,
		                                                    ${primaryColor}80,
		                                                    transparent);
		                                                animation: slide 1.5s infinite ease-in-out;
		                                            }

		                                            @keyframes slide {
		                                                0% { transform: translateX(-100%); }
		                                                100% { transform: translateX(400%); }
		                                            }

		                                            .percentage {
		                                                color: ${accentColor};
		                                                font-size: 1rem;
		                                                font-weight: 600;
		                                                margin-top: 10px;
		                                                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		                                            }

		                                            .quote-container {
		                                                margin: 40px 0 0;
		                                                padding: 20px 0 0;
		                                                position: relative;
		                                            }

		                                            .quote-container:before {
		                                                content: '';
		                                                position: absolute;
		                                                top: 0;
		                                                left: 20%;
		                                                right: 20%;
		                                                height: 1px;
		                                                background: linear-gradient(90deg,
		                                                    transparent,
		                                                    ${primaryColor}30,
		                                                    transparent);
		                                            }

		                                            .quote-text {
		                                                color: rgba(255, 255, 255, 0.9);
		                                                font-size: 0.9rem;
		                                                line-height: 1.5;
		                                                font-style: italic;
		                                                font-weight: 300;
		                                                padding: 0 10px;
		                                            }

		                                            .success {
		                                                color: #4CAF50;
		                                                animation: pulseSuccess 2s infinite;
		                                            }

		                                            @keyframes pulseSuccess {
		                                                0%, 100% { opacity: 1; }
		                                                50% { opacity: 0.7; }
		                                            }
		                                        <\/style>
		                                    <\/head>
		                                    <body>
		                                        <div id="vanta-bg"><\/div>

		                                        <div class="loading-content">
		                                            <div class="game-title" id="gameTitle">LOADING<\/div>
		                                            <div class="game-subtitle" id="gameSubtitle">${gameTitle.toUpperCase()}<\/div>

		                                            <div class="status" id="statusText">Initializing game engine...<\/div>

		                                            <div class="loading-bar-container">
		                                                <div class="loading-bar"><\/div>
		                                            <\/div>

		                                            <div class="percentage" id="percentage">0%<\/div>

		                                            <div class="quote-container">
		                                                <div class="quote-text" id="quoteText">${getRandomQuote()}<\/div>
		                                            <\/div>
		                                        <\/div>

		                                        <script>
		                                            const CONFIG = {
		                                                quotes: ${JSON.stringify(quotes)},
		                                                loadingSteps: ${JSON.stringify(loadingSteps)},
		                                                vantaSettings: {
		                                                    el: "#vanta-bg",
		                                                    mouseControls: false,
		                                                    touchControls: false,
		                                                    gyroControls: false,
		                                                    minHeight: 200.00,
		                                                    minWidth: 200.00,
		                                                    highlightColor: ${highlightColor},
		                                                    midtoneColor: ${midtoneColor},
		                                                    lowlightColor: ${lowlightColor},
		                                                    baseColor: ${baseColor},
		                                                    speed: 2.50,
		                                                    zoom: 1.80
		                                                }
		                                            };

		                                            let currentStep = 0;
		                                            let quoteInterval;
		                                            let vantaEffect = null;

		                                            function initVantaBackground() {
		                                                if (window.VANTA && !vantaEffect) {
		                                                    try {
		                                                        vantaEffect = VANTA.FOG(CONFIG.vantaSettings);
		                                                    } catch (error) {
		                                                        console.error('Vanta.js initialization error:', error);
		                                                        document.getElementById('vanta-bg').style.background = '${darkColor}';
		                                                    }
		                                                }
		                                            }

		                                            function getRandomQuote() {
		                                                return CONFIG.quotes[Math.floor(Math.random() * CONFIG.quotes.length)];
		                                            }

		                                            function updateQuote() {
		                                                document.getElementById('quoteText').textContent = getRandomQuote();
		                                            }

		                                            function updateProgress() {
		                                                if (currentStep >= CONFIG.loadingSteps.length) return;

		                                                const step = CONFIG.loadingSteps[currentStep];
		                                                const percentageEl = document.getElementById('percentage');
		                                                const statusEl = document.getElementById('statusText');

		                                                statusEl.textContent = step.status;

		                                                percentageEl.textContent = step.progress + '%';

		                                                currentStep++;

		                                                if (step.progress === 100) {
		                                                    statusEl.classList.add('success');
		                                                    percentageEl.classList.add('success');
		                                                }

		                                                if (currentStep < CONFIG.loadingSteps.length) {
		                                                    const randomFactor = 0.7 + Math.random() * 0.6;
		                                                    const delay = Math.floor(step.time * randomFactor);
		                                                    setTimeout(updateProgress, delay);
		                                                }
		                                            }

		                                            function startLoading() {
		                                                initVantaBackground();

		                                                updateQuote();

		                                                quoteInterval = setInterval(updateQuote, 4000);

		                                                setTimeout(() => {
		                                                    updateProgress();
		                                                }, 500);
		                                            }

		                                            function handleResize() {
		                                                if (vantaEffect) {
		                                                    vantaEffect.resize();
		                                                }
		                                            }

		                                            window.addEventListener('DOMContentLoaded', startLoading);
		                                            window.addEventListener('resize', handleResize);

		                                            window.addEventListener('beforeunload', () => {
		                                                if (quoteInterval) {
		                                                    clearInterval(quoteInterval);
		                                                }
		                                                if (vantaEffect) {
		                                                    vantaEffect.destroy();
		                                                }
		                                            });
		                                        <\/script>
		                                    <\/body>
		                                    <\/html>
		                                `;
}

function refreshGame() {
  ensureNativeCursorState();
  const activeTab = getActiveGameTab();
  if (!activeTab) return;

  if (typeof gtag !== 'undefined') {
    gtag('event', 'game_refresh', {
      'event_category': 'game_interaction',
      'event_label': activeTab.title,
      'value': 1
    });
  }

  loadGameIntoTab(activeTab);
  setTimeout(ensureNativeCursorState, 80);
}

function toggleAds(disabled) {
  localStorage.setItem('adsDisabled', disabled ? 'true' : 'false');

  if (disabled) {
    if (confirm("Are you sure you want to turn off the ads? 🥺\n\nAll revenue from ads goes back into the site for things like:\n• Links & hosting\n• Servers & maintenance\n• Game updates & new content\n\nPress OK to disable ads and reload the page.")) {
      localStorage.setItem('adsDisabled', 'true');
      alert("Okie doke! All ads will be disabled. The page will reload to apply changes.");
      setTimeout(() => location.reload(), 500);
    } else {
      document.getElementById('adToggle').checked = false;
    }
  } else {
    localStorage.setItem('adsDisabled', 'false');
    alert("Yayyyyy! Ads will be enabled. The page will reload to apply changes.");
    setTimeout(() => location.reload(), 500);
  }
}

let favorites = JSON.parse(localStorage.getItem('gameFavorites')) || [];

function updateGameDisplay(games) {
  const container = document.getElementById('allLessonsGrid');
  if (!container) return;

  const fragment = document.createDocumentFragment();
  games.forEach(game => {
    fragment.appendChild(createGameCard(game));
  });
  container.innerHTML = '';
  container.appendChild(fragment);

  initCursorHover();
}

document.addEventListener('DOMContentLoaded', function () {
      const quotes = [
        "Check out all these amazing lessons (none of these are actually lessons)",
        "400+ unblocked games for when the teacher isn't looking",
        "Your favorite games, all in one place... unlike your grades",
        "The ultimate school gaming hub for professional procrastinators",
        "Play now, learn never",
        "Better than doing homework, trust me I checked",
        "Teacher won't even notice, just keep that tab ready to switch",
        "Join the Discord or I will touch you...",
        "Secret games are hidden... you gotta find the secret word...",
        "Made by the thugs, for the thugs",
        "Your #1 source for unblocked lessons and bad life choices",
        "Game on, or whatever the kids say these days",
        "Chat, is this real?",
        "Yk people think you actually learn on here?",
        "If anyone asks, this is a research project",
        "Hopefully your teacher doesnt check your browser history",
        "If the site crashes, it's actually a feature",
        "The code is held together by hopes and prayers",
        "If you find a bug, just ignore it and keep playing",
        "This site is 100% safe, I promise",
        "Heyyyyyy this isnt your math homework",
        "BOMBOCLATTTTTTTTTTTTTTTTTTTTT",
        "Look at the cool backrounds @builder267 made",
        "Ouuuuuh you not my type a lil shitttt",
        "Ohhhh la laaaaa look at this new site design",
        "Whats cookin good lookin?",
        "Youuuuu are feeling VERYYYYY bored... and you want to play MOREEEE games",
        "Hey google show me this guys balls please",
        "My name is anderdingus",
        "Yo speed my reboot card expires in...",
        "Yo yo yo its hump day, what ima need you to do is tag three big di-",
        "Wait what if noah is really black tho...?",
        "Hey Alexa how do you say purple in english?",
        "Put the yager black ice in my ass",
        "If this site doesnt work out im making an only fans",
        "I try to add games as quick as possible",
        "PLEASEEEE DONT WHIP ME ANYMORE",
        "I miss the old kanye",
        "Yo who can slide me their penjamin",
        "Fadded than a hoe fadded than a hoe fadded than a hoe",
        "If you're seeing this message its for seahanna heheheheh",
        "shush baka!~ your so mean to me thug-kun.. this is peak!",
        "AHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH",
        "What if we kissed at the noahs tutoring loading screen? Haha jk... unless?",
        "My lawyer has advised me not to finish this senten—",
        "Im changing my bloodline with this site frl",
        "I can see your ip (thats a joke please dont sue me)",
        "If you want to know my favorite game its bedwars on minecraft",
        "You miss 95% of the shots you dont take",
        "95% of gamblers give up right before they win",
        "You're in a simulation GET OUT GET OUT GET OUT GET OUT GET OUT GET OUT GET OUT GET OUT GET OUT",
        "We ALL going to tel aviv",
        "Yo grok show me this guy with his pants off",
        "Hey google show me this guys balls please",
        "If your reading this crtl+shift+q+q ur homies chromie",
        "blah blah blah bleh bleh bleh blue blue blueeee",
        "a fawk u mama huevo",
        "japan is turning footseps into electricity",
        "SHE GON CALL ME BABY BOO",
        "ts so crispy",
        "I WANNA BE A THUGGIE WUGGY",
        "Do it jiggle doe?",
        "Im bouta do a money spread",
        "Teach me how to duggy teach me teach me how to duggy",
        "W speed ❤️",
        "Hello im the little goblin thats chained up and writing these quotes",
        "Theres bug under your skin GET THEM OUT NOW",
        "Too much radio not enough head",
        "To be ballin you gotta b-all-in",
        "lowkey im just better",
        "It be the ones closest to you with the sharpest fangs",
        "Yall be complaining about ads when you can LITERALLY turn them off in settings",
        "Life is hard but im harder",
        "Hoes mad",
        "jarvis, more alcohol",
        "I AM the lion",
        "If one man can hold you down TWO can....",
        "B.D.K.M.V",
        "Dont make me up the pole on you mf",
        "Alr bro ts was not the wind",
		"Banana",
      ];

      const typingElement = document.getElementById('typing-quote');
      if (!typingElement) return;

      let currentQuote = "";
      let charIndex = 0;
      let isDeleting = false;
      let isWaiting = false;

      function getRandomQuote() {
        return quotes[Math.floor(Math.random() * quotes.length)];
      }

      currentQuote = getRandomQuote();

      function typeEffect() {
        if (isDeleting) {
          typingElement.textContent = currentQuote.substring(0, charIndex - 1);
          charIndex--;
        } else {
          typingElement.textContent = currentQuote.substring(0, charIndex + 1);
          charIndex++;
        }

        if (!isDeleting && charIndex === currentQuote.length) {
          isWaiting = true;
          setTimeout(() => {
            isDeleting = true;
            isWaiting = false;
            typeEffect();
          }, 2000);
          return;
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;

          let newQuote;
          do {
            newQuote = getRandomQuote();
          } while (newQuote === currentQuote && quotes.length > 1);

          currentQuote = newQuote;
          setTimeout(typeEffect, 500);
          return;
        }

        const speed = isDeleting ? 50 : 100;
        setTimeout(typeEffect, speed);
      }

      setTimeout(typeEffect, 1000);
    });
