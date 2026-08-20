// ==========================================================
// SaMaWi
// Allgemeine Funktionen der Website
// ==========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadHeader();
        await loadFooter();
        await loadToday();

    });


// ==========================================================
// STAMMVERZEICHNIS DER WEBSITE ERMITTELN
// ==========================================================

function getSiteRoot() {

    const script =
        document.querySelector(
            'script[src*="samawi.js"]'
        );

    if (!script) {

        console.error(
            "SaMaWi: samawi.js konnte nicht lokalisiert werden."
        );

        return new URL(
            "/",
            window.location.href
        );

    }

    return new URL(
        "../",
        script.src
    );
}


// ==========================================================
// KONFIGURATION PRÜFEN
// ==========================================================

function getSaMaWiConfig() {

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
        getSaMaWiConfig();

    return new URL(
        relativeUrl,
        config.todayApiUrl
    );
}


// ==========================================================
// HEADER LADEN
// ==========================================================

async function loadHeader() {

    const headerContainer =
        document.getElementById(
            "site-header"
        );

    if (!headerContainer) {
        return;
    }

    const siteRoot =
        getSiteRoot();

    const headerUrl =
        new URL(
            "components/header.html",
            siteRoot
        );

    try {

        const response =
            await fetch(
                headerUrl,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status} ${response.statusText}`
            );

        }

        let html =
            await response.text();

        html =
            html.replaceAll(
                "{{ROOT}}",
                siteRoot.href
            );

        headerContainer.innerHTML =
            html;

    }
    catch (error) {

        console.error(
            "SaMaWi: Header konnte nicht geladen werden.",
            error
        );

    }
}


// ==========================================================
// FOOTER LADEN
// ==========================================================

async function loadFooter() {

    const footerContainer =
        document.getElementById(
            "site-footer"
        );

    if (!footerContainer) {
        return;
    }

    const siteRoot =
        getSiteRoot();

    const footerUrl =
        new URL(
            "components/footer.html",
            siteRoot
        );

    try {

        const response =
            await fetch(
                footerUrl,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status} ${response.statusText}`
            );

        }

        let html =
            await response.text();

        html =
            html.replaceAll(
                "{{ROOT}}",
                siteRoot.href
            );

        footerContainer.innerHTML =
            html;

    }
    catch (error) {

        console.error(
            "SaMaWi: Footer konnte nicht geladen werden.",
            error
        );

    }
}


// ==========================================================
// TODAY-INDEX LADEN
// ==========================================================

async function getTodayIndex() {

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

async function getTodayEntry(date) {

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
// DATUM FORMATIEREN
// ==========================================================

function formatDate(dateValue) {

    const date =
        new Date(
            dateValue +
            "T12:00:00"
        );

    return new Intl.DateTimeFormat(
        "de-AT",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(
        date
    );
}


// ==========================================================
// JÜNGSTEN TODAY-EINTRAG AUF DER STARTSEITE ANZEIGEN
// ==========================================================

async function loadToday() {

    const target =
        document.getElementById(
            "heute-content"
        );

    if (!target) {
        return;
    }

    try {

        /*
         * Zuerst nur den kleinen Index laden.
         */
        const index =
            await getTodayIndex();

        if (
            !index.latest ||
            !Array.isArray(index.entries) ||
            index.entries.length === 0
        ) {

            target.innerHTML = `
                <div class="section-text">
                    <p>
                        Noch gibt es hier keinen Eintrag.
                    </p>
                </div>
            `;

            return;
        }

        /*
         * Danach nur den neuesten vollständigen
         * Tagesdatensatz laden.
         */
        const newestEntry =
            await getTodayEntry(
                index.latest
            );

        if (!newestEntry) {

            throw new Error(
                `Der aktuelle Today-Eintrag ${index.latest} wurde nicht gefunden.`
            );

        }

        const siteRoot =
            getSiteRoot();

        const calendarUrl =
            new URL(
                "pages/heute/",
                siteRoot
            );

        target.innerHTML = `

            <div class="row align-items-center g-5">

                <div class="col-lg-5">

                    <div class="section-label">
                        Heute
                    </div>


                    <h2 class="section-title">
                        ${formatDate(
            newestEntry.datum
        )}
                    </h2>


                    <div class="section-location">
                        ${newestEntry.ort ?? ""}
                    </div>


                    <div class="section-text">

                        <p>
                            ${newestEntry.text ?? ""}
                        </p>


                        <p class="mt-4">

                            <a
                                href="${calendarUrl.href}"
                                class="calendar-link">

                                Im Kalender stöbern →

                            </a>

                        </p>

                    </div>

                </div>


                <div class="col-lg-7">

                    <div class="image-frame">

                        <img
                            src="${newestEntry.bild}"
                            alt="${newestEntry.titel ?? ""}"
                            class="section-image">

                    </div>

                </div>

            </div>
        `;

    }
    catch (error) {

        console.error(
            "SaMaWi: Heute konnte nicht geladen werden.",
            error
        );

        target.innerHTML = `

            <div class="section-text">

                <p>
                    Der heutige Eintrag konnte gerade
                    nicht geladen werden.
                </p>

            </div>
        `;

    }
}