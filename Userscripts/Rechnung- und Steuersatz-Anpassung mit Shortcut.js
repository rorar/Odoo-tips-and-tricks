// ==UserScript==
// @name         Rechnung- und Steuersatz-Anpassung mit Shortcut (mit Alt+S, Alt+Q, optional Alt+N)
// @namespace    http://tampermonkey.net/
// @version      3.6
// @description  Ändert Konto und Steuersatz per Shortcuts in Odoo. Nach den Änderungen wird zuerst ein kleiner Delay eingefügt, dann ALT+S (Speichern), dann nochmal Delay, dann ALT+Q (Anwenden), optional danach ALT+N.
// @match        *://*/odoo/accounting/*/reconciliation/*/account.move/*
// @match        *://*.*/odoo/accounting/*/reconciliation/*/account.move/*
// @match        *://*/odoo/bills/*
// @match        *://*.*/odoo/bills/*
// @match        *://*/odoo/accounting/*/bills/*
// @match        *://*.*/odoo/accounting/*/bills/*
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
        SHORTCUT_TAX_OVERRIDE: { ctrlKey: true, shiftKey: true, key: 'Ö' },  // Konto + Alle Steuern löschen + neuen Steuersatz setzen
        SHORTCUT_RESET_BOTH: { ctrlKey: true, shiftKey: true, key: 'Ü' },
        SHORTCUT_OVERRIDE_ACCOUNT_RESET_TAX: { ctrlKey: true, shiftKey: true, key: 'Ä' }, // Konto überschreiben + alle Steuern löschen

        TARGET_ACCOUNT_TEXT: '5900 Fremdleistungen',
        TARGET_TAX_TEXT: '19% EU O S',

        ACCOUNT_CELL_SELECTOR: 'td[name="account_id"]',
        TAX_CELL_SELECTOR: 'td[name="tax_ids"]',

        TAB_SEARCH_TIMEOUT: 5000,
        INPUT_SEARCH_TIMEOUT: 5000,
        POST_ENTER_KEY_DELAY: 500,
        POST_CLICK_DELAY: 1500,
        POST_ENTER_DELAY: 1500,

        PRE_ACTION_DELAY: 500,
        POST_SAVE_DELAY: 500,
        POST_APPLY_DELAY: 500,

        ENABLE_ALT_N: true,
        ROW_SELECTOR: 'table.o_list_table tbody tr.o_data_row.o_row_draggable.o_is_product'
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

    function waitForElement(selector, parent = document, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = parent.querySelector(selector);
            if (element) {
                logInfo(`Element gefunden: ${selector}`);
                return resolve(element);
            }

            logInfo(`Warte auf Element: ${selector}`);

            const observer = new MutationObserver((mutations, obs) => {
                const el = parent.querySelector(selector);
                if (el) {
                    logInfo(`Element gefunden durch MutationObserver: ${selector}`);
                    resolve(el);
                    obs.disconnect();
                }
            });

            observer.observe(parent, { childList: true, subtree: true });

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
            await waitForElement(CONFIG.TAB_LOAD_SELECTOR, document, CONFIG.TAB_SEARCH_TIMEOUT);
            logInfo(`"${CONFIG.TAB_NAME}" Tab ist nun vollständig geladen.`);
        } catch (error) {
            logError(error);
            throw error;
        }
    }

    // Funktion zur Verarbeitung jeder Zeile mit optionalen Aktionen
    async function processRow(row, actions) {
        const { setAccount, clearTaxes, setTax } = actions;
        const dataId = row.getAttribute('data-id') || 'kein data-id';
        const productNameSpan = row.querySelector('td[name="product_id"] span.text-truncate');
        const productName = productNameSpan ? productNameSpan.textContent.trim() : 'Kein Produktname';

        logInfo(`Verarbeite Zeile mit data-id="${dataId}" und Produktname="${productName}"`);

        if (setAccount) {
            await changeAccountInRow(row);
        }

        if (clearTaxes) {
            await clearTaxesInRow(row);
        }

        if (setTax) {
            await changeTaxInRow(row);
        }

        await sleep(300); // Kurzer Delay zwischen den Zeilen
    }

    // Funktion zum Ändern des Kontos in einer spezifischen Zeile
    async function changeAccountInRow(row) {
        const accountCell = row.querySelector(CONFIG.ACCOUNT_CELL_SELECTOR);
        if (!accountCell) {
            logWarn('Konto-Zelle nicht gefunden in der Zeile.');
            return;
        }

        accountCell.click();
        logInfo('Konto-Zelle angeklickt. Warte auf Eingabefeld ...');

        const inputSelector = `${CONFIG.ACCOUNT_CELL_SELECTOR} input.o-autocomplete--input.o_input.pe-3`;
        let input;
        try {
            input = await waitForElement(inputSelector, row, CONFIG.INPUT_SEARCH_TIMEOUT);
        } catch (error) {
            logWarn('Eingabefeld für Konto nicht gefunden.');
            return;
        }

        // Lösche den bestehenden Kontotext
        simulateTextDeletion(input);
        logInfo('Bestehenden Kontotext gelöscht.');

        // Setze den neuen Kontotext
        input.value = CONFIG.TARGET_ACCOUNT_TEXT;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        logInfo(`Neuen Kontotext "${CONFIG.TARGET_ACCOUNT_TEXT}" eingegeben.`);

        await sleep(CONFIG.POST_ENTER_KEY_DELAY);
        simulateKeyPress('Enter');
        logInfo('Enter-Taste simuliert (Konto). Warte auf Dropdown ...');

        // Kleine Verzögerung hinzufügen, um sicherzustellen, dass das Dropdown-Menü gerendert wird
        await sleep(500);

        try {
            await clickDropdownItem(CONFIG.TARGET_ACCOUNT_TEXT, row);
        } catch (error) {
            logWarn(`Kein Dropdown-Menü gefunden oder Item "${CONFIG.TARGET_ACCOUNT_TEXT}" nicht gefunden. Prüfe, ob das Konto bereits gesetzt ist.`);

            if (accountCell.textContent.trim() === CONFIG.TARGET_ACCOUNT_TEXT) {
                logInfo(`Konto bereits korrekt auf "${CONFIG.TARGET_ACCOUNT_TEXT}" gesetzt. Fahre ohne Dropdown-Auswahl fort.`);
            } else {
                simulateKeyPress('Enter');
                await sleep(CONFIG.POST_ENTER_KEY_DELAY);

                if (accountCell.textContent.trim() === CONFIG.TARGET_ACCOUNT_TEXT) {
                    logInfo(`Konto nach erneutem Enter auf "${CONFIG.TARGET_ACCOUNT_TEXT}" gesetzt.`);
                } else {
                    logWarn(`Konto konnte nicht automatisch auf "${CONFIG.TARGET_ACCOUNT_TEXT}" gesetzt werden. Bitte manuell prüfen.`);
                }
            }
        }
    }

    // Funktion zum Löschen aller Steuern in einer spezifischen Zeile
    async function clearTaxesInRow(row) {
        const taxCell = row.querySelector(CONFIG.TAX_CELL_SELECTOR);
        if (!taxCell) {
            logWarn('Steuer-Zelle nicht gefunden in der Zeile.');
            return;
        }

        const deleteButtons = taxCell.querySelectorAll('a.o_delete');
        if (deleteButtons.length > 0) {
            logInfo(`Lösche ${deleteButtons.length} Steuertag(e) in der Zeile.`);
            // Da das DOM sich nach jedem Klick ändert, konvertieren wir die NodeList in ein Array
            const buttons = Array.from(deleteButtons);
            for (const btn of buttons) {
                btn.click();
                logInfo('Steuertag gelöscht.');
                await sleep(300); // Wartezeit nach jedem Klick
            }
            logInfo(`Alle Steuertags in der Zeile wurden gelöscht.`);
        } else {
            logInfo('Keine Steuertags zum Löschen gefunden.');
        }
        await sleep(200);
    }

    // Funktion zum Ändern des Steuersatzes in einer spezifischen Zeile
    async function changeTaxInRow(row) {
        const taxCell = row.querySelector(CONFIG.TAX_CELL_SELECTOR);
        if (!taxCell) {
            logWarn('Steuer-Zelle nicht gefunden in der Zeile.');
            return;
        }

        // Aktiviere das Steuer-Eingabefeld
        taxCell.click();
        logInfo('Steuer-Zelle angeklickt. Warte auf Steuer-Eingabefeld ...');

        const inputSelector = `${CONFIG.TAX_CELL_SELECTOR} input.o-autocomplete--input.o_input.pe-3`;
        let taxInput;
        try {
            taxInput = await waitForElement(inputSelector, row, CONFIG.INPUT_SEARCH_TIMEOUT);
        } catch (error) {
            logWarn('Steuer-Inputfeld nicht gefunden.');
            return;
        }

        taxInput.value = CONFIG.TARGET_TAX_TEXT;
        taxInput.dispatchEvent(new Event('input', { bubbles: true }));
        logInfo(`Neuen Steuersatz "${CONFIG.TARGET_TAX_TEXT}" eingegeben.`);

        await sleep(CONFIG.POST_ENTER_KEY_DELAY);
        simulateKeyPress('Enter');
        logInfo('Enter-Taste simuliert (Steuer).');

        // Kleine Verzögerung hinzufügen, um sicherzustellen, dass das Dropdown-Menü gerendert wird
        await sleep(500);

        try {
            await clickDropdownItem(CONFIG.TARGET_TAX_TEXT, row);
        } catch (error) {
            logWarn(`Kein Dropdown-Menü oder Item "${CONFIG.TARGET_TAX_TEXT}" nicht gefunden. Prüfe manuell.`);
        }
    }

    // Funktion zum Klicken auf ein Dropdown-Item innerhalb einer spezifischen Zeile
    async function clickDropdownItem(desiredText, row) {
        logInfo('Versuche, das Dropdown-Item zu finden und zu klicken.');

        // Suchen Sie alle Dropdown-Menüs innerhalb der spezifischen Zeile
        const dropdownMenus = row.querySelectorAll('ul.o-autocomplete--dropdown-menu.ui-widget.show.dropdown-menu.ui-autocomplete');

        if (dropdownMenus.length === 0) {
            logError('Dropdown-Menü nicht gefunden.');
            throw 'Dropdown-Menü nicht gefunden.';
        }

        // Nehmen Sie das zuletzt geöffnete Dropdown-Menü an
        const dropdownMenu = dropdownMenus[dropdownMenus.length -1];
        logInfo(`Dropdown-Menü gefunden: ${dropdownMenu}`);

        // Finden Sie das gewünschte Dropdown-Item innerhalb dieses Dropdown-Menüs
        const dropdownItem = Array.from(dropdownMenu.querySelectorAll('a.dropdown-item.ui-menu-item-wrapper.text-truncate'))
            .find(a => a.textContent.trim() === desiredText);

        if (dropdownItem) {
            dropdownItem.click();
            logInfo(`Dropdown-Item mit Text "${desiredText}" angeklickt.`);
        } else {
            logError(`Dropdown-Item mit Text "${desiredText}" nicht gefunden.`);
            throw `Dropdown-Item mit Text "${desiredText}" nicht gefunden.`;
        }
    }

    // Funktion zur Überprüfung und Rücksetzung in den Entwurf-Modus, falls möglich
    async function resetToDraftIfPossible() {
        const draftButton = document.querySelector('button[name="button_draft"]');
        if (draftButton) {
            logInfo('Reset-to-Draft-Button gefunden. Simuliere ALT+R, um das Dokument in den Entwurf-Modus zurückzusetzen.');
            simulateKeyCombination('r', 'Alt');
            logInfo('Tastenkombination ALT+R simuliert.');

            // Wartezeit, um sicherzustellen, dass das Dokument in den Entwurf-Modus zurückgesetzt wurde
            await sleep(1000);

            // Optional: Überprüfen, ob der Zustand tatsächlich auf 'Entwurf' geändert wurde
            // Dies erfordert spezifische Kenntnisse über die DOM-Struktur nach dem Reset
            // Hier ist eine generische Wartezeit implementiert
            logInfo('Warte auf die Fertigstellung des Entwurf-Rücksetzens.');
            await sleep(1000); // Anpassbar je nach Systemreaktion
        } else {
            logInfo('Reset-to-Draft-Button nicht gefunden. Überspringe Entwurf-Rücksetzung.');
        }
    }

    // Überarbeitete Funktion zur Verarbeitung aller relevanten Zeilen mit konfigurierbaren Aktionen
    async function processAllRows(actions) {
        logInfo('Beginne, alle relevanten <tr> Elemente zu zählen und zu verarbeiten.');
        const allRows = Array.from(document.querySelectorAll(CONFIG.ROW_SELECTOR));
        const rowCount = allRows.length;
        logInfo(`Gefundene relevante Tabellenzeilen: ${rowCount}`);

        if (rowCount === 0) {
            logWarn('Keine Tabellenzeilen gefunden, die verarbeitet werden können.');
            return;
        }

        for (let index = 0; index < rowCount; index++) {
            const row = allRows[index];
            await processRow(row, actions);
        }

        logInfo('Alle relevanten <tr> Elemente wurden verarbeitet.');
    }

    async function performPostActions() {
        await sleep(CONFIG.PRE_ACTION_DELAY);

        simulateKeyCombination('s', 'Alt');
        logInfo('Tastenkombination ALT + S (Speichern) simuliert.');

        await sleep(CONFIG.POST_SAVE_DELAY);

        simulateKeyCombination('q', 'Alt');
        logInfo('Tastenkombination ALT + Q (Anwenden) simuliert.');

        await sleep(CONFIG.POST_APPLY_DELAY);

        if (CONFIG.ENABLE_ALT_N) {
            simulateKeyCombination('n', 'Alt');
            logInfo('Tastenkombination ALT + N ausgeführt (optional).');
        }
    }

    async function handleShortcut(e) {
        // Strg+Shift+Ö: Konto + Alle Steuern löschen + Steuersatz setzen
        // Strg+Shift+Ä: Konto + Alle Steuern löschen
        // Strg+Shift+: Konto ändern
        // Strg+Shift+Ü: Konto und Steuersatz zurücksetzen (Konto clearen, Steuern entfernen, aber kein neuer Steuersatz)

        // Definiere die Shortcuts mit ihren jeweiligen Aktionen
        const shortcuts = [
            {
                keys: { ctrlKey: true, shiftKey: true, key: ':' },
                description: 'Shortcut für Konto-Änderung (Strg+Shift+:)',
                actions: { setAccount: true, clearTaxes: false, setTax: false }
            },
            {
                keys: { ctrlKey: true, shiftKey: true, key: 'Ö' },
                description: 'Shortcut für Steuer-Überschreibung + Konto-Änderung (Strg+Shift+Ö)',
                actions: { setAccount: true, clearTaxes: true, setTax: true }
            },
            {
                keys: { ctrlKey: true, shiftKey: true, key: 'Ü' },
                description: 'Shortcut für Konto und Steuersatz löschen (Strg+Shift+Ü)',
                actions: { setAccount: false, clearTaxes: true, setTax: false }
            },
            {
                keys: { ctrlKey: true, shiftKey: true, key: 'Ä' },
                description: 'Shortcut für Konto überschreiben und Steuersatz zurücksetzen (Strg+Shift+Ä)',
                actions: { setAccount: true, clearTaxes: true, setTax: false }
            }
        ];

        // Überprüfe, ob der gedrückte Shortcut einem der definierten Shortcuts entspricht
        for (const shortcut of shortcuts) {
            if (e.ctrlKey === shortcut.keys.ctrlKey &&
                e.shiftKey === shortcut.keys.shiftKey &&
                e.key === shortcut.keys.key) {

                e.preventDefault();
                logInfo(`${shortcut.description} ausgelöst.`);

                try {
                    // Überprüfe und setze gegebenenfalls in den Entwurf-Modus zurück
                    await resetToDraftIfPossible();

                    await clickTab();
                    await waitForTabToLoad();

                    // Führe die definierten Aktionen aus
                    await processAllRows(shortcut.actions);

                    await performPostActions();

                    logInfo(`${shortcut.description} erfolgreich ausgeführt.`);
                } catch (error) {
                    logWarn(`${shortcut.description} fehlgeschlagen.`);
                }

                // Nachdem der passende Shortcut gefunden und verarbeitet wurde, breche die Schleife ab
                return;
            }
        }
    }

    async function init() {
        logInfo('Userscript initialisiert und bereit.');
        document.addEventListener('keydown', handleShortcut, false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

