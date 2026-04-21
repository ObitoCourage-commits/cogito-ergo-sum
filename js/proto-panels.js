"use strict";
const bindings = [
    {
        selectors: [
            "#home-section",
            "#all-lessons",
            "#info-section",
            "#chat-section",
            "#account-section",
            "#admin-section",
            "#settings-section"
        ],
        classes: ["proto-shell"]
    },
    {
        selectors: [
            "#all-lessons .search-stats",
            "#info-section .info-hero-copy",
            "#home-section .home-logo-wrap"
        ],
        classes: ["proto-clear"]
    },
    {
        selectors: [
            ".top-bar",
            ".nav-tabs",
            ".live-counter",
            "#home-section .home-hero",
            "#home-section .home-stats-row",
            "#home-section .home-popular-wrap",
            "#home-section .home-carousel",
            "#all-lessons .lessons-header",
            "#all-lessons .search-container",
            "#all-lessons .sorter-wrapper",
            "#info-section .info-hero",
            "#info-section .partners-grid",
            "#chat-section .chat-app-shell",
            "#chat-section .chat-room-panel",
            "#account-section .account-shell",
            "#account-section .modal-content",
            "#admin-section .admin-shell",
            "#admin-section .modal-content"
        ],
        classes: ["proto-fog"]
    },
    {
        selectors: [
            "#info-section .info-socials-panel",
            "#info-section .partner-card",
            "#chat-section .chat-sidebar-card",
            "#chat-section .chat-main-card",
            "#chat-section .chat-lock-card",
            "#chat-section .chat-modal-card",
            "#chat-section .chat-room-top",
            "#chat-section .chat-composer",
            "#chat-section .chat-clear-banner",
            "#chat-section .chat-pinned-banner",
            "#chat-section .chat-status-banner",
            "#account-section .setting-item",
            "#admin-section .setting-item",
            "#settings-section .settings-docs-nav",
            "#settings-section .settings-docs-panel"
        ],
        classes: ["proto-card"]
    }
];
function applyBindings(root = document) {
    bindings.forEach(({ selectors, classes }) => {
        selectors.forEach((selector) => {
            root.querySelectorAll(selector).forEach((element) => {
                element.classList.add(...classes);
            });
        });
    });
}
function initProtoPanels() {
    document.body.classList.add("proto-ui");
    document.documentElement.classList.add("proto-ui-root");
    applyBindings();
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) {
                    return;
                }
                applyBindings(node);
                bindings.forEach(({ selectors, classes }) => {
                    selectors.forEach((selector) => {
                        if (node.matches(selector)) {
                            node.classList.add(...classes);
                        }
                    });
                });
            });
        });
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProtoPanels, { once: true });
}
else {
    initProtoPanels();
}
