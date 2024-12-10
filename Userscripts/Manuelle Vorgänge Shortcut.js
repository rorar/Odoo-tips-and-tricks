 // ==UserScript==
 // @name         Manuelle Vorgänge Shortcut mit erweitertem Logging, Observer, Dropdown-Klick und Verzögerung
 // @namespace    http://tampermonkey.net/
 // @version      2.4
 // @description  Aktiviert mit Strg+Shift+. den "Manuelle Vorgänge" Tab, wartet auf das Input-Feld, löscht den Text, gibt "2180 Privateinlagen" ein, drückt Enter, klickt auf ein Dropdown-Item, wartet und führt dann eine weitere Tastenkombination aus. Variablen und Selektoren können angepasst werden. Inklusive erweiterter Logging-Funktionalität.
 // @author       Dein Name
 // @match        *://*/odoo/accounting/*/reconciliation
 // @grant        none
 // ==/UserScript==

/**
 * ===========================================
 * Skript: Manuelle Vorgänge Shortcut
 * ===========================================
 * 
 * **Anleitung zur Verwendung:**
 * 
 * - **Kurzbefehle:**
 *   - Drücke **Strg + Shift + .** (Punkt), um den "Manuelle Vorgänge" Tab zu aktivieren.
 *   - Das Skript wartet auf das Eingabefeld, löscht den vorhandenen Text, gibt "2180 Privateinlagen" ein und drückt Enter.
 *   - Anschließend wird ein Dropdown-Item ausgewählt, gewartet und eine weitere Tastenkombination ausgeführt.
 * 
 * - **Anpassungen:**
 *   - Die **Variablen** und **Selektoren** im Skript können nach Bedarf geändert werden, um das Verhalten anzupassen.
 *   - Die **Tab-Namen**, **Eingabetexte** und **Tastenkombinationen** sind konfigurierbar über das `CONFIG` Objekt.
 *   - Die **@description** im Metadata-Block wurde entsprechend angepasst, um die Funktionalität und Anpassbarkeit des Skripts zu beschreiben.
 * 
 * **Hinweis:** Stelle sicher, dass Tampermonkey (oder ein ähnlicher Userscript-Manager) installiert und aktiviert ist, um dieses Skript auszuführen.
 */


(function() {
    'use strict';

    // === Konfigurierbare Einstellungen ===
    const CONFIG = {
        DEBUG: true, // Setze auf `false`, um erweitertes Logging auszuschalten
        SHORTCUT: {
            ctrlKey: true,
            shiftKey: true,
            key: '.' // Strg + Shift + .
        },
        TARGET_TEXT: '2180 Privateinlagen',
        TAB_NAME: 'Manuelle Vorgänge',
        TAB_SELECTOR_NAME: 'manual_operations_tab',
        INPUT_SELECTOR: 'div[name="account_id"] input.o-autocomplete--input.o_input.pe-3',
        TAB_LOAD_SELECTOR: 'div[name="account_id"]', // Ein spezifisches Element im Tab, um sicherzustellen, dass der Tab geladen ist
        TAB_SEARCH_TIMEOUT: 5000, // in Millisekunden
        INPUT_SEARCH_TIMEOUT: 5000, // in Millisekunden
        POST_ENTER_KEY_DELAY: 500, // in Millisekunden (z.B., 500 ms) – Verzögerung zwischen Texteingabe und Enter-Taste
        POST_CLICK_DELAY: 1500, // in Millisekunden (1,5 Sekunden) nach dem Klick auf das Dropdown-Item
        POST_ENTER_DELAY: 1500, // in Millisekunden (1,5 Sekunden) nach Enter-Tastendruck
        POST_ENTER_ACTION: 'alt_v', // 'alt_v' oder 'alt_e'
    };

    // === Logging-Funktionen ===
    function logInfo(message) {
        if (CONFIG.DEBUG) {
            console.info(`[INFO]: ${message}`);
        }
    }

    function logWarn(message) {
        if (CONFIG.DEBUG) {
            console.warn(`[WARN]: ${message}`);
        }
    }

    function logError(message) {
        if (CONFIG.DEBUG) {
            console.error(`[ERROR]: ${message}`);
        }
    }

    // === Utility-Funktionen ===

    /**
     * Wartet für eine bestimmte Zeit.
     * @param {number} ms - Die Zeit in Millisekunden, für die gewartet werden soll.
     * @returns {Promise} - Ein Promise, das nach der angegebenen Zeit erfüllt wird.
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Wartet auf das Vorhandensein eines Elements im DOM.
     * @param {string} selector - Der CSS-Selektor des zu wartenden Elements.
     * @param {number} timeout - Maximale Wartezeit in Millisekunden.
     * @returns {Promise<Element>} - Das gefundene Element.
     */
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                logInfo(`Element gefunden: ${selector}`);
                return resolve(element);
            }

            logInfo(`Warte auf Element: ${selector}`);

            const observer = new MutationObserver((mutations, obs) => {
                const el = document.querySelector(selector);
                if (el) {
                    logInfo(`Element gefunden durch MutationObserver: ${selector}`);
                    resolve(el);
                    obs.disconnect();
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                reject(`Timeout: Element ${selector} nicht gefunden.`);
            }, timeout);
        });
    }

    /**
     * Simuliert einen Tastendruck.
     * @param {string} key - Der Schlüssel, der gedrückt werden soll.
     * @param {Object} options - Zusätzliche Optionen für das KeyboardEvent.
     */
    function simulateKeyPress(key, options = {}) {
        let keyCode;
        if (key === 'Enter') {
            keyCode = 13;
        } else {
            keyCode = key.charCodeAt(0);
        }

        const eventOptions = {
            key: key,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
            ...options
        };
        const keydown = new KeyboardEvent('keydown', eventOptions);
        const keyup = new KeyboardEvent('keyup', eventOptions);
        document.dispatchEvent(keydown);
        document.dispatchEvent(keyup);
    }

    /**
     * Simuliert eine Kombination von Tasten (z.B. ALT + V).
     * @param {string} key - Der Schlüssel, der in Kombination gedrückt werden soll.
     * @param {string} modifier - Der Modifikator (z.B. 'Alt').
     */
    function simulateKeyCombination(key, modifier) {
        const modifierLower = modifier.toLowerCase();
        const eventOptions = {
            key: key,
            keyCode: key.charCodeAt(0),
            which: key.charCodeAt(0),
            bubbles: true,
            cancelable: true,
            [`${modifierLower}Key`]: true
        };
        const keydown = new KeyboardEvent('keydown', eventOptions);
        const keyup = new KeyboardEvent('keyup', eventOptions);
        document.dispatchEvent(keydown);
        document.dispatchEvent(keyup);
    }

    /**
     * Simuliert einen Klick auf den "Manuelle Vorgänge" Tab.
     */
    async function clickManualOperationsTab() {
        logInfo('Versuche, den "Manuelle Vorgänge" Tab zu klicken.');

        try {
            // Primäre Suche nach dem Tab über das `name`-Attribut
            let tab = document.querySelector(`a[name="${CONFIG.TAB_SELECTOR_NAME}"]`);

            if (!tab) {
                // Fallback: Suche nach dem Tab anhand des Link-Texts
                logWarn(`Tab mit name="${CONFIG.TAB_SELECTOR_NAME}" nicht gefunden. Fallback zur Textsuche.`);
                const tabs = document.querySelectorAll('a.nav-link');
                tabs.forEach(t => {
                    if (t.textContent.trim() === CONFIG.TAB_NAME) {
                        tab = t;
                    }
                });
            }

            if (tab) {
                tab.click();
                logInfo(`"${CONFIG.TAB_NAME}" Tab angeklickt.`);
            } else {
                throw `Tab "${CONFIG.TAB_NAME}" nicht gefunden.`;
            }
        } catch (error) {
            logError(error);
            throw error;
        }
    }

    /**
     * Wartet darauf, dass der Tab vollständig geladen ist, indem ein spezifisches Element überwacht wird.
     */
    async function waitForTabToLoad() {
        logInfo('Warte darauf, dass der "Manuelle Vorgänge" Tab vollständig geladen ist.');

        try {
            await waitForElement(CONFIG.TAB_LOAD_SELECTOR, CONFIG.TAB_SEARCH_TIMEOUT);
            logInfo('"Manuelle Vorgänge" Tab ist nun vollständig geladen.');
        } catch (error) {
            logError(error);
            throw error;
        }
    }

    /**
     * Löscht den aktuellen Text im Eingabefeld und gibt den konfigurierten Text ein.
     */
    async function clearAndInputText() {
        logInfo('Versuche, das Texteingabefeld zu bearbeiten.');

        try {
            const input = await waitForElement(CONFIG.INPUT_SELECTOR, CONFIG.INPUT_SEARCH_TIMEOUT);
            if (input) {
                input.focus();
                logInfo('Fokussiert auf das Eingabefeld.');

                // Löschen des aktuellen Inhalts
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                logInfo('Bestehenden Text im Eingabefeld gelöscht.');

                // Eingeben des neuen Textes
                input.value = CONFIG.TARGET_TEXT;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                logInfo(`Text "${CONFIG.TARGET_TEXT}" in das Eingabefeld eingegeben.`);

                // Warten vor dem Drücken der Enter-Taste
                await sleep(CONFIG.POST_ENTER_KEY_DELAY);
                logInfo(`Warte ${CONFIG.POST_ENTER_KEY_DELAY} ms vor dem Simulieren der Enter-Taste.`);

                // Simuliere das Drücken der Enter-Taste
                simulateKeyPress('Enter');
                logInfo('Enter-Taste simuliert.');
            } else {
                throw `Eingabefeld "${CONFIG.INPUT_SELECTOR}" nicht gefunden.`;
            }
        } catch (error) {
            logError(error);
            throw error;
        }
    }

    /**
     * Simuliert einen Klick auf das Dropdown-Item mit dem TEXT, der im TARGET_TEXT definiert ist.
     */
    async function clickDropdownItem() {
        logInfo('Versuche, das Dropdown-Item zu finden und zu klicken.');

        try {
            // Selector for the dropdown menu
            const dropdownMenuSelector = 'ul.o-autocomplete--dropdown-menu.ui-widget.show.dropdown-menu.ui-autocomplete';
            const dropdownMenu = await waitForElement(dropdownMenuSelector, 5000);
            logInfo(`Dropdown-Menü gefunden: ${dropdownMenuSelector}`);

            // Warte auf das Dropdown-Item mit dem gewünschten Text
            const desiredText = CONFIG.TARGET_TEXT;
            const dropdownItem = await waitForDropdownItem(desiredText, dropdownMenu, 5000);

            if (dropdownItem) {
                dropdownItem.click();
                logInfo(`Dropdown-Item mit Text "${desiredText}" angeklickt.`);
            } else {
                throw `Dropdown-Item mit Text "${desiredText}" nicht gefunden.`;
            }
        } catch (error) {
            logError(error);
            throw error;
        }
    }

    /**
     * Wartet auf das Vorhandensein eines Dropdown-Items mit dem gewünschten Text.
     * @param {string} text - Der Text des gesuchten Dropdown-Items.
     * @param {Element} dropdownMenu - Das Dropdown-Menü Element.
     * @param {number} timeout - Maximale Wartezeit in Millisekunden.
     * @returns {Promise<Element>} - Das gefundene Dropdown-Item.
     */
    function waitForDropdownItem(text, dropdownMenu, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();

            const check = () => {
                const items = Array.from(dropdownMenu.querySelectorAll('a.dropdown-item.ui-menu-item-wrapper.text-truncate'));
                const desiredItem = items.find(a => a.textContent.trim() === text);
                if (desiredItem) {
                    resolve(desiredItem);
                } else if (Date.now() - start > timeout) {
                    // Optional: Log alle verfügbaren Items für Debugging
                    const availableTexts = items.map(a => a.textContent.trim());
                    logInfo(`Verfügbare Dropdown-Items: ${availableTexts.join(', ')}`);
                    reject(`Dropdown-Item mit Text "${text}" nicht gefunden.`);
                } else {
                    setTimeout(check, 100); // Check every 100 ms
                }
            };

            check();
        });
    }

    /**
     * Führt eine zusätzliche Tastenkombination nach einer Verzögerung aus.
     */
    async function performPostEnterAction() {
        if (CONFIG.POST_ENTER_ACTION === 'alt_v') {
            simulateKeyCombination('v', 'Alt');
            logInfo('Tastenkombination ALT + V simuliert.');
        } else if (CONFIG.POST_ENTER_ACTION === 'alt_e') {
            simulateKeyCombination('e', 'Alt');
            logInfo('Tastenkombination ALT + E simuliert.');
        } else {
            logWarn(`Unbekannte POST_ENTER_ACTION: ${CONFIG.POST_ENTER_ACTION}`);
        }
    }

    /**
     * Event Listener für die definierte Tastenkombination.
     */
    async function handleShortcut(e) {
        if (
            e.ctrlKey === CONFIG.SHORTCUT.ctrlKey &&
            e.shiftKey === CONFIG.SHORTCUT.shiftKey &&
            e.key === CONFIG.SHORTCUT.key
        ) {
            e.preventDefault();
            logInfo(`Shortcut Strg+Shift+${CONFIG.SHORTCUT.key} ausgelöst.`);

            try {
                await clickManualOperationsTab();
                await waitForTabToLoad();
                await clearAndInputText();

                // Führe die zusätzliche Aktion: Klick auf Dropdown-Item
                await clickDropdownItem();

                // Warte für die Verzögerung nach dem Dropdown-Klick
                await sleep(CONFIG.POST_CLICK_DELAY);
                logInfo(`Warte ${CONFIG.POST_CLICK_DELAY} ms nach dem Klicken des Dropdown-Items.`);

                // Führe die zusätzliche Tastenkombination aus
                await performPostEnterAction();

                logInfo('Alle Aktionen erfolgreich ausgeführt.');
            } catch (error) {
                logWarn('Ein oder mehrere Schritte konnten nicht ausgeführt werden.');
            }
        }
    }

    // === Initialisierung ===
    function init() {
        logInfo('Userscript initialisiert und bereit.');
        document.addEventListener('keydown', handleShortcut, false);
    }

    // Starte das Skript, sobald das DOM vollständig geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
