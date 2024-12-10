// ==UserScript==
// @name         Rechnung- und Steuersatz-Anpassung mit Shortcut (mit Alt+S und Alt+Q)
// @namespace    http://tampermonkey.net/
// @version      3.6
// @description  Ändert Buchungskonto und Steuersatz per Tastenkombination. STRG+SHIFT+Ü löscht beide Felder, STRG+SHIFT+Ä überschreibt Konto und löscht Steuersatz. Enthält echte Textlöschung und sequenzielle POST-Aktionen (ALT+S und ALT+Q).
// @match        *://*/*/odoo/accounting/*/reconciliation/*/account.move/*
// @match        *://*/*/odoo/bills/*
// @grant        none
// ==/UserScript==

/**
 * === Anleitung zur Verwendung ===
 *
 * Dieses Userscript ermöglicht das schnelle Ändern und Löschen von Buchungskonto und Steuersatz in Odoo durch die Verwendung von Tastenkombinationen.
 *
 * **Shortcuts:**
 *
 * 1. **STRG + SHIFT + Ü**
 *    - **Aktion:** Löscht sowohl das Buchungskonto als auch den Steuersatz.
 *    - **Ablauf:**
 *        a. Aktiviert den "Rechnungszeilen"-Tab.
 *        b. Leert das Konto-Feld.
 *        c. Löscht alle vorhandenen Steuertags.
 *        d. Führt die POST-Aktionen durch: ALT+S (Speichern), kurz warten, ALT+Q (Anwenden).
 *
 * 2. **STRG + SHIFT + Ä**
 *    - **Aktion:** Überschreibt das Buchungskonto und löscht den Steuersatz.
 *    - **Ablauf:**
 *        a. Aktiviert den "Rechnungszeilen"-Tab.
 *        b. Überschreibt das Konto-Feld mit dem `TARGET_ACCOUNT_TEXT`.
 *        c. Löscht alle vorhandenen Steuertags.
 *        d. Führt die POST-Aktionen durch: ALT+S (Speichern), kurz warten, ALT+Q (Anwenden).
 *
 * 3. **STRG + SHIFT + Ö** (Optional, beibehalten)
 *    - **Aktion:** Überschreibt sowohl das Buchungskonto als auch den Steuersatz.
 *    - **Ablauf:** Ähnlich zu den anderen Shortcuts.
 *
 * **Anpassung der Zieltexte:**
 *
 * - `TARGET_ACCOUNT_TEXT`: Der Text, der als neues Buchungskonto eingetragen werden soll.
 * - `TARGET_TAX_TEXT`: Der Text, der als neuer Steuersatz eingetragen werden soll.
 *
 * **Hinweise:**
 * - **Wildcard @match-Regeln:** Die `@match`-Regeln sind so konfiguriert, dass sie alle Subdomains und Hauptdomains abdecken, die auf die Odoo-Pfade `/odoo/accounting/*/reconciliation/*/account.move/*` und `/odoo/bills/*` passen.
 * - **Simulation echter Tastatureingaben:** Das Skript simuliert echte Tastatureingaben, um eine zuverlässige Interaktion mit Odoo sicherzustellen.
 * - **Anpassung der Delays:** Falls Ihre Odoo-Instanz langsamer reagiert, passen Sie die Delay-Zeiten (`PRE_ACTION_DELAY` und `POST_SAVE_DELAY`) im `CONFIG`-Objekt entsprechend an.
 * - **Fehlerbehandlung:** Überprüfen Sie die Browser-Konsole auf Logs, um den Status der Aktionen nachzuvollziehen oder Fehlermeldungen zu erkennen.
 * - **Installation:**
 *   1. Installieren Sie Tampermonkey oder ein ähnliches Userscript-Manager-Addon in Ihrem Browser.
 *   2. Fügen Sie dieses Userscript in Tampermonkey hinzu.
 *   3. Konfigurieren Sie bei Bedarf die `TARGET_ACCOUNT_TEXT` und `TARGET_TAX_TEXT` Werte im Skript.
 *   4. Navigieren Sie zu den entsprechenden Odoo-Seiten und verwenden Sie die definierten Shortcuts.
 */

(function() {
    'use strict';

    const CONFIG = {
        DEBUG: true,
        TAB_NAME: 'Rechnungszeilen',
        TAB_SELECTOR_NAME: 'invoice_tab',
        TAB_LOAD_SELECTOR: 'td[name="account_id"]',

        SHORTCUT_ACCOUNT_CHANGE: { ctrlKey: true, shiftKey: true, key: ':' },
        SHORTCUT_TAX_OVERRIDE: { ctrlKey: true, shiftKey: true, key: 'Ö' },
        SHORTCUT_RESET_BOTH: { ctrlKey: true, shiftKey: true, key: 'Ü' },
        SHORTCUT_OVERRIDE_ACCOUNT_RESET_TAX: { ctrlKey: true, shiftKey: true, key: 'Ä' },

        TARGET_ACCOUNT_TEXT: '6837 Aufwendungen für die zeitlich befristete Überlassung von Rechten (Lizenzen, Konzessionen)',
        TARGET_TAX_TEXT: '19% EU O S',

        ACCOUNT_CELL_SELECTOR: 'td[name="account_id"]',
        TAX_CELL_SELECTOR: 'td[name="tax_ids"]',

        TAB_SEARCH_TIMEOUT: 5000,
        INPUT_SEARCH_TIMEOUT: 5000,
        POST_ENTER_KEY_DELAY: 500,
        POST_CLICK_DELAY: 1500,
        POST_ENTER_DELAY: 1500,

        // Neue Delays für die Aktionen
        PRE_ACTION_DELAY: 500,  // Delay vor allen Änderungen (ALT+S und ALT+Q)
        POST_SAVE_DELAY: 500,   // Delay zwischen ALT+S und ALT+Q
    };

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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

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

    function simulateTextDeletion(input) {
        input.focus();
        input.select();

        const deleteEvent = new KeyboardEvent('keydown', {
            key: 'Delete',
            code: 'Delete',
            keyCode: 46,
            which: 46,
            bubbles: true,
            cancelable: true
        });
        input.dispatchEvent(deleteEvent);

        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    async function clickTab() {
        logInfo(`Versuche, den "${CONFIG.TAB_NAME}" Tab zu klicken.`);

        try {
            let tab = document.querySelector(`a[name="${CONFIG.TAB_SELECTOR_NAME}"]`);

            if (!tab) {
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

    async function waitForTabToLoad() {
        logInfo(`Warte darauf, dass der "${CONFIG.TAB_NAME}" Tab vollständig geladen ist.`);
        try {
            await waitForElement(CONFIG.TAB_LOAD_SELECTOR, CONFIG.TAB_SEARCH_TIMEOUT);
            logInfo(`"${CONFIG.TAB_NAME}" Tab ist nun vollständig geladen.`);
        } catch (error) {
            logError(error);
            throw error;
        }
    }

    async function activateAccountField() {
        const accountCell = document.querySelector(CONFIG.ACCOUNT_CELL_SELECTOR);
        if (!accountCell) throw 'Konto-Zelle nicht gefunden.';

        accountCell.click();
        logInfo('Konto-Zelle angeklickt. Warte auf Eingabefeld ...');

        const inputSelector = `${CONFIG.ACCOUNT_CELL_SELECTOR} input.o-autocomplete--input.o_input.pe-3`;
        const input = await waitForElement(inputSelector, CONFIG.INPUT_SEARCH_TIMEOUT);
        return input;
    }

    async function changeAccount() {
        const input = await activateAccountField();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        logInfo('Bestehenden Kontotext gelöscht.');

        input.value = CONFIG.TARGET_ACCOUNT_TEXT;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        logInfo(`Neuen Kontotext "${CONFIG.TARGET_ACCOUNT_TEXT}" eingegeben.`);

        await sleep(CONFIG.POST_ENTER_KEY_DELAY);
        simulateKeyPress('Enter');
        logInfo('Enter-Taste simuliert (Konto). Warte auf Dropdown ...');

        await clickDropdownItem(CONFIG.TARGET_ACCOUNT_TEXT);
    }

    async function clearAccount() {
        const input = await activateAccountField();
        simulateTextDeletion(input);

        await sleep(CONFIG.POST_ENTER_KEY_DELAY);
        simulateKeyPress('Enter');
        logInfo('Enter-Taste simuliert (Konto-leer). Sollte nun kein Konto gesetzt sein.');
    }

    async function activateTaxField() {
        const taxCell = document.querySelector(CONFIG.TAX_CELL_SELECTOR);
        if (!taxCell) throw 'Steuer-Zelle nicht gefunden.';

        taxCell.click();
        logInfo('Steuer-Zelle angeklickt. Warte auf Steuer-Eingabefeld ...');

        const inputSelector = `${CONFIG.TAX_CELL_SELECTOR} input.o-autocomplete--input.o_input.pe-3`;
        await waitForElement(inputSelector, CONFIG.INPUT_SEARCH_TIMEOUT);
        return taxCell;
    }

    async function clearAllTaxTags() {
        const taxCell = await activateTaxField();
        const deleteButtons = taxCell.querySelectorAll('a.o_delete');
        deleteButtons.forEach(btn => btn.click());
        if (deleteButtons.length > 0) {
            logInfo(`${deleteButtons.length} Steuertags gelöscht.`);
        } else {
            logInfo('Keine Steuertags zum Löschen gefunden.');
        }
        await sleep(200);
    }

    async function changeTax() {
        await clearAllTaxTags();

        const inputSelector = `${CONFIG.TAX_CELL_SELECTOR} input.o-autocomplete--input.o_input.pe-3`;
        const input = document.querySelector(inputSelector);
        if (!input) throw 'Steuer-Inputfeld nach Tag-Löschung nicht gefunden.';

        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        input.value = CONFIG.TARGET_TAX_TEXT;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        logInfo(`Neuer Steuersatz-Text "${CONFIG.TARGET_TAX_TEXT}" eingegeben.`);

        await sleep(CONFIG.POST_ENTER_KEY_DELAY);
        simulateKeyPress('Enter');
        logInfo('Enter-Taste simuliert (Steuer). Warte auf Dropdown ...');

        await clickDropdownItem(CONFIG.TARGET_TAX_TEXT);
    }

    async function removeTaxesOnly() {
        await clearAllTaxTags();
    }

    async function clickDropdownItem(desiredText) {
        logInfo('Versuche, das Dropdown-Item zu finden und zu klicken.');
        const dropdownMenuSelector = 'ul.o-autocomplete--dropdown-menu.ui-widget.show.dropdown-menu.ui-autocomplete';
        const dropdownMenu = await waitForElement(dropdownMenuSelector, 5000);

        logInfo(`Dropdown-Menü gefunden: ${dropdownMenuSelector}`);
        const dropdownItem = await waitForDropdownItem(desiredText, dropdownMenu, 5000);

        if (dropdownItem) {
            dropdownItem.click();
            logInfo(`Dropdown-Item mit Text "${desiredText}" angeklickt.`);
        } else {
            throw `Dropdown-Item mit Text "${desiredText}" nicht gefunden.`;
        }
    }

    function waitForDropdownItem(text, dropdownMenu, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();

            const check = () => {
                const items = Array.from(dropdownMenu.querySelectorAll('a.dropdown-item.ui-menu-item-wrapper.text-truncate'));
                const desiredItem = items.find(a => a.textContent.trim() === text);
                if (desiredItem) {
                    resolve(desiredItem);
                } else if (Date.now() - start > timeout) {
                    const availableTexts = items.map(a => a.textContent.trim());
                    logInfo(`Verfügbare Dropdown-Items: ${availableTexts.join(', ')}`);
                    reject(`Dropdown-Item mit Text "${text}" nicht gefunden.`);
                } else {
                    setTimeout(check, 100);
                }
            };

            check();
        });
    }

    async function performPostActions() {
        // 1. kleiner Delay vor allen Änderungen
        await sleep(CONFIG.PRE_ACTION_DELAY);

        // 2. ALT+S (Speichern)
        simulateKeyCombination('s', 'Alt');
        logInfo('Tastenkombination ALT + S (Speichern) simuliert.');

        // 3. kleiner Delay
        await sleep(CONFIG.POST_SAVE_DELAY);

        // 4. ALT+Q (Anwenden)
        simulateKeyCombination('q', 'Alt');
        logInfo('Tastenkombination ALT + Q (Anwenden) simuliert.');
    }

    async function handleShortcut(e) {
        // Konto ändern: STRG+SHIFT+:
        if (e.ctrlKey && e.shiftKey && e.key === ':') {
            e.preventDefault();
            logInfo('Shortcut für Konto-Änderung ausgelöst (Strg+Shift+:)');
            try {
                await clickTab();
                await waitForTabToLoad();
                await changeAccount();

                await sleep(CONFIG.POST_CLICK_DELAY);
                await performPostActions();

                logInfo('Konto erfolgreich geändert.');
            } catch (error) {
                logWarn('Konto-Änderung fehlgeschlagen.');
            }
        }

        // Steuersatz überschreiben + Konto ändern: STRG+SHIFT+Ö
        if (e.ctrlKey && e.shiftKey && e.key === 'Ö') {
            e.preventDefault();
            logInfo('Shortcut für Steuer-Überschreibung + Konto-Änderung ausgelöst (Strg+Shift+Ö)');
            try {
                await clickTab();
                await waitForTabToLoad();

                await changeAccount();
                await changeTax();

                await sleep(CONFIG.POST_CLICK_DELAY);
                await performPostActions();

                logInfo('Steuersatz und Konto erfolgreich überschrieben.');
            } catch (error) {
                logWarn('Überschreibung fehlgeschlagen.');
            }
        }

        // Konto und Steuersatz löschen/zurücksetzen: STRG+SHIFT+Ü
        if (e.ctrlKey && e.shiftKey && e.key === 'Ü') {
            e.preventDefault();
            logInfo('Shortcut für Konto und Steuersatz löschen ausgelöst (Strg+Shift+Ü)');
            try {
                await clickTab();
                await waitForTabToLoad();

                await clearAccount();
                await removeTaxesOnly();

                await sleep(CONFIG.POST_CLICK_DELAY);
                await performPostActions();

                logInfo('Steuersatz und Konto erfolgreich zurückgesetzt.');
            } catch (error) {
                logWarn('Zurücksetzen fehlgeschlagen.');
            }
        }

        // Konto überschreiben und Steuersatz löschen/zurücksetzen: STRG+SHIFT+Ä
        if (e.ctrlKey && e.shiftKey && e.key === 'Ä') {
            e.preventDefault();
            logInfo('Shortcut für Konto überschreiben und Steuersatz zurücksetzen ausgelöst (Strg+Shift+Ä)');
            try {
                await clickTab();
                await waitForTabToLoad();

                await changeAccount();
                await removeTaxesOnly();

                await sleep(CONFIG.POST_CLICK_DELAY);
                await performPostActions();

                logInfo('Konto überschrieben und Steuersatz zurückgesetzt.');
            } catch (error) {
                logWarn('Operation fehlgeschlagen.');
            }
        }
    }

    function init() {
        logInfo('Userscript initialisiert und bereit.');
        document.addEventListener('keydown', handleShortcut, false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
