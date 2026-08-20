// ==========================================================
// SaMaWi
// Heute-Archiv
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    initHeuteArchiv
);


// ==========================================================
// KONFIGURATION
// ==========================================================

function getConfig() {

    if (!window.SaMaWiConfig) {

        throw new Error(
            "SaMaWi-Konfiguration wurde nicht geladen."
        );

    }

    if (!window.SaMaWiConfig.todayApiUrl) {

        throw new Error(
            "todayApiUrl fehlt in der SaMaWi-Konfiguration."
        );

    }

    return window.SaMaWiConfig;
}


// ==========================================================
// TODAY-API-URL ERZEUGEN
// ==========================================================

function getTodayApiUrl(relativeUrl) {

    const config =
        getConfig();

    return new URL(
        relativeUrl,
        config.todayApiUrl
    );
}


// ==========================================================
// DATUM FORMATIEREN
// ==========================================================

function formatDate(value) {

    return new Intl.DateTimeFormat(
        "de-AT",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(
        new Date(
            value +
            "T12:00:00"
        )
    );
}


// ==========================================================
// TODAY-INDEX LADEN
// ==========================================================

async function loadTodayIndex() {

    const url =
        getTodayApiUrl(
            "today"
        );

    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            `Today-Index konnte nicht geladen werden: ` +
            `HTTP ${response.status}`
        );

    }

    return await response.json();
}


// ==========================================================
// EINZELNEN TODAY-EINTRAG LADEN
// ==========================================================

async function loadTodayEntry(date) {

    const url =
        getTodayApiUrl(
            "today"
        );

    url.searchParams.set(
        "date",
        date
    );

    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            `Today-Eintrag ${date} konnte nicht geladen werden: ` +
            `HTTP ${response.status}`
        );

    }

    const result =
        await response.json();

    if (
        !result.found ||
        !result.data
    ) {

        return null;

    }

    return result.data;
}


// ==========================================================
// ARCHIV INITIALISIEREN
// ==========================================================

async function initHeuteArchiv() {

    const host =
        document.getElementById(
            "heute-calendar"
        );

    if (!host) {
        return;
    }

    try {

        /*
         * Der Kalender benötigt zunächst nur
         * Datum und Titel.
         */
        const index =
            await loadTodayIndex();

        if (
            !Array.isArray(index.entries) ||
            index.entries.length === 0
        ) {

            host.innerHTML =
                "<p>Noch gibt es keine Einträge.</p>";

            return;
        }

        /*
         * Schneller Zugriff anhand des Datums.
         *
         * Enthält bewusst nur die Indexinformationen:
         * datum + titel.
         */
        const byDate =
            Object.fromEntries(
                index.entries.map(
                    entry => [
                        entry.datum,
                        entry
                    ]
                )
            );

        /*
         * Der Kalender startet im Monat
         * des neuesten Eintrags.
         */
        const initialDate =
            index.latest ||
            index.entries[
                index.entries.length - 1
            ].datum;

        let current =
            new Date(
                initialDate +
                "T12:00:00"
            );

        current =
            new Date(
                current.getFullYear(),
                current.getMonth(),
                1
            );


        // ======================================================
        // KALENDER RENDERN
        // ======================================================

        function render() {

            const year =
                current.getFullYear();

            const month =
                current.getMonth();

            /*
             * Montag = erster Wochentag.
             */
            const first =
                (
                    new Date(
                        year,
                        month,
                        1
                    ).getDay() +
                    6
                ) % 7;

            const days =
                new Date(
                    year,
                    month + 1,
                    0
                ).getDate();

            let html = `

                <div class="calendar-nav">

                    <button
                        id="prev"
                        aria-label="Vorheriger Monat">

                        ←

                    </button>


                    <h1>

                        ${new Intl.DateTimeFormat(
                "de-AT",
                {
                    month: "long",
                    year: "numeric"
                }
            ).format(
                current
            )
                }

                    </h1>


                    <button
                        id="next"
                        aria-label="Nächster Monat">

                        →

                    </button>

                </div>


                <div class="calendar-head">

                    ${[
                    "Mo",
                    "Di",
                    "Mi",
                    "Do",
                    "Fr",
                    "Sa",
                    "So"
                ]
                    .map(
                        value =>
                            `<span>${value}</span>`
                    )
                    .join("")
                }

                </div>


                <div class="calendar-grid">
            `;


            /*
             * Leere Felder vor dem ersten Tag.
             */
            for (
                let i = 0;
                i < first;
                i++
            ) {

                html +=
                    "<span></span>";

            }


            /*
             * Kalendertage.
             */
            for (
                let day = 1;
                day <= days;
                day++
            ) {

                const key =
                    `${year}-` +
                    `${String(month + 1).padStart(2, "0")}-` +
                    `${String(day).padStart(2, "0")}`;

                const entry =
                    byDate[key];


                if (entry) {

                    /*
                     * Der Titel aus index.json wird
                     * als Tooltip verwendet.
                     */
                    html += `

                        <button
                            class="calendar-day has-entry"
                            data-date="${key}"
                            title="${escapeHtmlAttribute(
                        entry.titel ?? ""
                    )}"
                            aria-label="${day}. ${escapeHtmlAttribute(
                        entry.titel ?? ""
                    )}">

                            ${day}

                            <i></i>

                        </button>
                    `;

                }
                else {

                    html += `

                        <span class="calendar-day">
                            ${day}
                        </span>
                    `;

                }

            }


            html +=
                `</div>` +
                `<div id="calendar-entry"></div>`;

            host.innerHTML =
                html;


            /*
             * Vorheriger Monat.
             */
            host
                .querySelector(
                    "#prev"
                )
                .onclick =
                () => {

                    current =
                        new Date(
                            year,
                            month - 1,
                            1
                        );

                    render();

                };


            /*
             * Nächster Monat.
             */
            host
                .querySelector(
                    "#next"
                )
                .onclick =
                () => {

                    current =
                        new Date(
                            year,
                            month + 1,
                            1
                        );

                    render();

                };


            /*
             * Eintrag erst beim Klick vollständig laden.
             */
            host
                .querySelectorAll(
                    "[data-date]"
                )
                .forEach(
                    button => {

                        button.onclick =
                            async () => {

                                await showEntry(
                                    button.dataset.date
                                );

                            };

                    }
                );

        }


        // ======================================================
        // TAGESEINTRAG ANZEIGEN
        // ======================================================

        async function showEntry(date) {

            const element =
                document.getElementById(
                    "calendar-entry"
                );

            if (!element) {
                return;
            }

            /*
             * Während des Ladens keine alte
             * Tagesinformation stehen lassen.
             */
            element.innerHTML = `
                <div class="calendar-entry-loading">
                    Eintrag wird geladen …
                </div>
            `;

            try {

                const entry =
                    await loadTodayEntry(
                        date
                    );

                if (!entry) {

                    element.innerHTML = `
                        <p>
                            Der Eintrag wurde nicht gefunden.
                        </p>
                    `;

                    return;
                }

                /*
                 * bild ist bereits eine vollständige
                 * Base64-Data-URL.
                 */
                element.innerHTML = `

                    <article class="calendar-entry">

                        <img
                            src="${entry.bild}"
                            alt="${escapeHtmlAttribute(
                    entry.titel ?? ""
                )}">


                        <div>

                            <div class="section-label">

                                ${formatDate(
                    entry.datum
                )}

                            </div>


                            <h2>
                                ${escapeHtml(
                    entry.titel ?? ""
                )}
                            </h2>


                            <div class="section-location">
                                ${escapeHtml(
                    entry.ort ?? ""
                )}
                            </div>


                            <p>
                                ${escapeHtml(
                    entry.text ?? ""
                )}
                            </p>

                        </div>

                    </article>
                `;

                element.scrollIntoView(
                    {
                        behavior: "smooth",
                        block: "start"
                    }
                );

            }
            catch (error) {

                console.error(
                    `SaMaWi: Eintrag ${date} konnte nicht geladen werden.`,
                    error
                );

                element.innerHTML = `
                    <p>
                        Der Eintrag konnte gerade
                        nicht geladen werden.
                    </p>
                `;

            }

        }


        render();

    }
    catch (error) {

        console.error(
            "SaMaWi: Heute-Archiv konnte nicht geladen werden.",
            error
        );

        host.innerHTML = `
            <p>
                Das Heute-Archiv konnte gerade
                nicht geladen werden.
            </p>
        `;

    }
}


// ==========================================================
// HTML MASKIEREN
// ==========================================================

function escapeHtml(value) {

    return value
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            "\"",
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function escapeHtmlAttribute(value) {

    return escapeHtml(
        value
    );
}