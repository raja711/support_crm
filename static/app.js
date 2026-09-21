console.log("Support CRM app.js loaded");

const API_BASE = "/api/tickets";

let searchInput = null;
let statusFilter = null;
let ticketList = null;

let currentTicketId = null;
let currentAISuggestedReply = "";


// =====================================================
// HELPERS
// =====================================================

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return date.toLocaleString();
}


function statusBadge(status) {
    const value = status || "Open";

    if (value === "Open") {
        return `
            <span class="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                Open
            </span>
        `;
    }

    if (value === "In Progress") {
        return `
            <span class="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                In Progress
            </span>
        `;
    }

    if (value === "Closed") {
        return `
            <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
                Closed
            </span>
        `;
    }

    return `
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
            ${escapeHTML(value)}
        </span>
    `;
}


// =====================================================
// CREATE MODAL
// =====================================================

window.showCreateForm = function () {

    const modal = document.getElementById("createModal");

    if (!modal) {
        alert("Create ticket window could not be opened.");
        return;
    }

    modal.classList.remove("hidden");

    const nameInput = document.getElementById("customer_name");

    if (nameInput) {
        setTimeout(() => {
            nameInput.focus();
        }, 100);
    }
};


window.hideCreateForm = function () {

    const modal = document.getElementById("createModal");

    if (modal) {
        modal.classList.add("hidden");
    }
};


window.showCreateModal = function () {
    window.showCreateForm();
};


window.hideCreateModal = function () {
    window.hideCreateForm();
};


// =====================================================
// LOAD TICKETS
// =====================================================

async function loadTickets() {

    if (!ticketList) {
        ticketList = document.getElementById("ticketList");
    }

    if (!ticketList) {
        console.error("ticketList not found");
        return;
    }

    try {

        ticketList.innerHTML = `
            <div class="p-8 text-center text-gray-500">
                Loading tickets...
            </div>
        `;

        const params = new URLSearchParams();

        const search = searchInput
            ? searchInput.value.trim()
            : "";

        const status = statusFilter
            ? statusFilter.value
            : "";

        if (search) {
            params.set("search", search);
        }

        if (
            status &&
            status !== "All" &&
            status !== "All Statuses"
        ) {
            params.set("status", status);
        }

        const query = params.toString();

        const url = query
            ? `${API_BASE}?${query}`
            : API_BASE;

        console.log("GET:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });

        const responseText = await response.text();

        let data;

        try {
            data = responseText
                ? JSON.parse(responseText)
                : [];
        } catch (error) {
            console.error("JSON parse error:", error);
            throw new Error("Invalid server response.");
        }

        if (!response.ok) {
            const message =
                data && data.detail
                    ? data.detail
                    : `HTTP ${response.status}`;

            throw new Error(message);
        }

        if (!Array.isArray(data)) {
            throw new Error("Invalid API response.");
        }

        console.log("Tickets received:", data);

        renderTickets(data);
        updateCounters(data);

    } catch (error) {

        console.error("Load tickets error:", error);

        ticketList.innerHTML = `
            <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">

                <p class="font-semibold">
                    Failed to load tickets.
                </p>

                <p class="text-sm mt-1">
                    ${escapeHTML(error.message)}
                </p>

                <button
                    type="button"
                    onclick="loadTickets()"
                    class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Retry
                </button>

            </div>
        `;

        updateCounters([]);
    }
}


window.loadTickets = loadTickets;


// =====================================================
// RENDER TICKETS
// =====================================================

function renderTickets(tickets) {

    if (!ticketList) {
        return;
    }

    if (!tickets || tickets.length === 0) {

        ticketList.innerHTML = `
            <div class="p-8 text-center bg-white rounded-xl border border-gray-200">

                <div class="text-gray-400 text-4xl mb-3">
                    🎫
                </div>

                <h3 class="text-lg font-semibold text-gray-700">
                    No tickets found
                </h3>

                <p class="text-gray-500 text-sm mt-1">
                    Create a new ticket to get started.
                </p>

            </div>
        `;

        return;
    }

    ticketList.innerHTML = tickets.map(function (ticket) {

        const ticketId = escapeHTML(ticket.ticket_id);
        const customerName = escapeHTML(ticket.customer_name);
        const customerEmail = escapeHTML(ticket.customer_email);
        const subject = escapeHTML(ticket.subject);
        const description = escapeHTML(ticket.description);

        const status = ticket.status || "Open";

        const encodedTicketId =
            encodeURIComponent(ticket.ticket_id);

        return `
            <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">

                <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                    <div class="flex-1">

                        <div class="flex items-center gap-3 flex-wrap">

                            <span class="font-bold text-gray-900">
                                ${ticketId}
                            </span>

                            ${statusBadge(status)}

                        </div>

                        <h3 class="text-lg font-semibold text-gray-900 mt-3">
                            ${subject}
                        </h3>

                        <p class="text-gray-600 text-sm mt-2">
                            ${description}
                        </p>

                        <div class="mt-4 space-y-1 text-sm">

                            <p>
                                <span class="font-medium text-gray-700">
                                    Customer:
                                </span>
                                ${customerName}
                            </p>

                            <p>
                                <span class="font-medium text-gray-700">
                                    Email:
                                </span>
                                ${customerEmail}
                            </p>

                            <p class="text-gray-500">
                                Created:
                                ${formatDate(ticket.created_at)}
                            </p>

                        </div>

                    </div>

                    <div>

                        <button
                            type="button"
                            onclick="showDetails('${encodedTicketId}')"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            View Details
                        </button>

                    </div>

                </div>

            </div>
        `;

    }).join("");
}


// =====================================================
// COUNTERS
// =====================================================

function updateCounters(tickets) {

    const totalCount =
        document.getElementById("totalCount");

    const openCount =
        document.getElementById("openCount");

    const progressCount =
        document.getElementById("progressCount");

    const closedCount =
        document.getElementById("closedCount");

    const list =
        Array.isArray(tickets)
            ? tickets
            : [];

    if (totalCount) {
        totalCount.textContent = list.length;
    }

    if (openCount) {
        openCount.textContent =
            list.filter(ticket =>
                ticket.status === "Open"
            ).length;
    }

    if (progressCount) {
        progressCount.textContent =
            list.filter(ticket =>
                ticket.status === "In Progress"
            ).length;
    }

    if (closedCount) {
        closedCount.textContent =
            list.filter(ticket =>
                ticket.status === "Closed"
            ).length;
    }
}


// =====================================================
// CREATE TICKET
// =====================================================

async function createTicket(event) {

    if (event) {
        event.preventDefault();
    }

    const nameInput =
        document.getElementById("customer_name");

    const emailInput =
        document.getElementById("customer_email");

    const subjectInput =
        document.getElementById("subject");

    const descriptionInput =
        document.getElementById("description");

    if (
        !nameInput ||
        !emailInput ||
        !subjectInput ||
        !descriptionInput
    ) {
        alert("Create ticket form is not configured correctly.");
        return;
    }

    const name =
        nameInput.value.trim();

    const email =
        emailInput.value.trim();

    const subject =
        subjectInput.value.trim();

    const description =
        descriptionInput.value.trim();

    if (
        !name ||
        !email ||
        !subject ||
        !description
    ) {
        alert("Please fill all fields.");
        return;
    }

    const submitButton =
        document.querySelector(
            '#createTicketForm button[type="submit"]'
        );

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Creating...";
    }

    try {

        const response = await fetch(API_BASE, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({

                customer_name: name,

                customer_email: email,

                subject: subject,

                description: description
            })
        });

        const responseText =
            await response.text();

        let data = {};

        try {
            data = responseText
                ? JSON.parse(responseText)
                : {};
        } catch {
            data = {
                detail: responseText
            };
        }

        if (!response.ok) {
            throw new Error(
                data.detail ||
                `HTTP ${response.status}`
            );
        }

        alert(
            `${data.ticket_id || "Ticket"} created successfully.`
        );

        const form =
            document.getElementById(
                "createTicketForm"
            );

        if (form) {
            form.reset();
        }

        window.hideCreateForm();

        await loadTickets();

    } catch (error) {

        console.error(
            "Create ticket error:",
            error
        );

        alert(
            `Failed to create ticket: ${error.message}`
        );

    } finally {

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Create Ticket";
        }
    }
}


window.createTicket = createTicket;


// =====================================================
// SHOW DETAILS
// =====================================================

async function showDetails(ticketId) {

    const decodedTicketId =
        decodeURIComponent(ticketId);

    currentTicketId =
        decodedTicketId;

    currentAISuggestedReply = "";

    const detailsModal =
        document.getElementById("detailsModal");

    const ticketDetails =
        document.getElementById("ticketDetails");

    if (
        !detailsModal ||
        !ticketDetails
    ) {
        console.error(
            "Details modal elements not found"
        );
        return;
    }

    detailsModal.classList.remove("hidden");

    ticketDetails.innerHTML = `
        <div class="p-8 text-center text-gray-500">
            Loading ticket...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API_BASE}/${encodeURIComponent(decodedTicketId)}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );

        const responseText =
            await response.text();

        let ticket = {};

        try {
            ticket = responseText
                ? JSON.parse(responseText)
                : {};
        } catch {
            throw new Error(
                "Invalid ticket response."
            );
        }

        if (!response.ok) {
            throw new Error(
                ticket.detail ||
                "Ticket not found."
            );
        }


        // =================================================
        // EXISTING NOTES
        // =================================================

        let notesHTML = "";

        if (
            Array.isArray(ticket.notes) &&
            ticket.notes.length > 0
        ) {

            notesHTML = ticket.notes
                .map(function (note) {

                    const noteText =
                        typeof note === "object"
                            ? note.note
                            : note;

                    const noteDate =
                        typeof note === "object"
                            ? note.created_at
                            : null;

                    return `
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">

                            <p class="text-sm text-gray-700">
                                ${escapeHTML(noteText)}
                            </p>

                            ${
                                noteDate
                                    ? `
                                        <p class="text-xs text-gray-400 mt-2">
                                            ${formatDate(noteDate)}
                                        </p>
                                      `
                                    : ""
                            }

                        </div>
                    `;

                })
                .join("");

        } else {

            notesHTML = `
                <p class="text-sm text-gray-400">
                    No notes yet.
                </p>
            `;
        }


        // =================================================
        // DETAILS HTML
        // =================================================

        ticketDetails.innerHTML = `

            <div class="space-y-6">


                <!-- HEADER -->

                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div>

                        <p class="text-sm text-gray-500">
                            Ticket ID
                        </p>

                        <h2 class="text-2xl font-bold text-gray-900">
                            ${escapeHTML(ticket.ticket_id)}
                        </h2>

                    </div>

                    ${statusBadge(ticket.status)}

                </div>


                <!-- CUSTOMER -->

                <div class="grid md:grid-cols-2 gap-4">

                    <div>

                        <label
                            class="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name
                        </label>

                        <input
                            id="detail_customer_name"
                            type="text"
                            value="${escapeHTML(ticket.customer_name)}"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >

                    </div>


                    <div>

                        <label
                            class="block text-sm font-medium text-gray-700 mb-1">
                            Customer Email
                        </label>

                        <input
                            id="detail_customer_email"
                            type="email"
                            value="${escapeHTML(ticket.customer_email)}"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >

                    </div>

                </div>


                <!-- SUBJECT -->

                <div>

                    <label
                        class="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                    </label>

                    <input
                        id="detail_subject"
                        type="text"
                        value="${escapeHTML(ticket.subject)}"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >

                </div>


                <!-- DESCRIPTION -->

                <div>

                    <label
                        class="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>

                    <textarea
                        id="detail_description"
                        rows="4"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >${escapeHTML(ticket.description)}</textarea>

                </div>


                <!-- STATUS -->

                <div>

                    <label
                        class="block text-sm font-medium text-gray-700 mb-1">
                        Status
                    </label>

                    <select
                        id="detail_status"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >

                        <option value="Open"
                            ${ticket.status === "Open" ? "selected" : ""}>
                            Open
                        </option>

                        <option value="In Progress"
                            ${ticket.status === "In Progress" ? "selected" : ""}>
                            In Progress
                        </option>

                        <option value="Closed"
                            ${ticket.status === "Closed" ? "selected" : ""}>
                            Closed
                        </option>

                    </select>

                </div>


                <!-- EXISTING NOTES -->

                <div>

                    <label
                        class="block text-sm font-medium text-gray-700 mb-2">
                        Existing Notes
                    </label>

                    <div class="space-y-2">
                        ${notesHTML}
                    </div>

                </div>


                <!-- ADD NEW NOTE -->

                <div>

                    <label
                        for="detail_notes"
                        class="block text-sm font-medium text-gray-700 mb-1">
                        Add New Note
                    </label>

                    <textarea
                        id="detail_notes"
                        rows="3"
                        placeholder="Write a new internal note..."
                        class="w-full border border-gray-300 rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>

                </div>


                <!-- =================================================
                     AI ANALYSIS
                ================================================== -->

                <div
                    class="border border-purple-200 bg-purple-50 rounded-2xl p-5"
                >

                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                        <div>

                            <h3 class="text-lg font-bold text-gray-900">
                                🤖 AI Ticket Analysis
                            </h3>

                            <p class="text-sm text-gray-500 mt-1">
                                Analyze this support ticket using AI.
                            </p>

                        </div>


                        <button
                            id="aiAnalyzeButton"
                            type="button"
                            onclick="analyzeTicket()"
                            class="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700
                                   text-white font-semibold transition"
                        >
                            🤖 Analyze with AI
                        </button>

                    </div>


                    <div
                        id="aiAnalysis"
                        class="mt-5"
                    ></div>

                </div>


                <!-- ACTION BUTTONS -->

                <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">

                    <button
                        type="button"
                        onclick="hideDetails()"
                        class="px-5 py-3 rounded-xl border border-gray-200
                               text-gray-700 font-semibold hover:bg-gray-50"
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        onclick="saveTicketUpdate()"
                        class="px-5 py-3 rounded-xl bg-blue-600
                               hover:bg-blue-700 text-white font-semibold"
                    >
                        Save Update
                    </button>

                </div>

            </div>
        `;

    } catch (error) {

        console.error(
            "Show details error:",
            error
        );

        ticketDetails.innerHTML = `

            <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">

                <p class="font-semibold">
                    Failed to load ticket.
                </p>

                <p class="text-sm mt-1">
                    ${escapeHTML(error.message)}
                </p>

                <button
                    type="button"
                    onclick="showDetails('${encodeURIComponent(decodedTicketId)}')"
                    class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Retry
                </button>

            </div>
        `;
    }
}


window.showDetails = showDetails;


// =====================================================
// HIDE DETAILS
// =====================================================

function hideDetails() {

    const modal =
        document.getElementById("detailsModal");

    if (modal) {
        modal.classList.add("hidden");
    }

    currentTicketId = null;
    currentAISuggestedReply = "";
}


window.hideDetails = hideDetails;


// =====================================================
// SAVE TICKET UPDATE
// =====================================================

async function saveTicketUpdate() {

    if (!currentTicketId) {
        alert("No ticket selected.");
        return;
    }

    const nameInput =
        document.getElementById(
            "detail_customer_name"
        );

    const emailInput =
        document.getElementById(
            "detail_customer_email"
        );

    const subjectInput =
        document.getElementById(
            "detail_subject"
        );

    const descriptionInput =
        document.getElementById(
            "detail_description"
        );

    const statusInput =
        document.getElementById(
            "detail_status"
        );

    const notesInput =
        document.getElementById(
            "detail_notes"
        );

    if (
        !nameInput ||
        !emailInput ||
        !subjectInput ||
        !descriptionInput ||
        !statusInput
    ) {
        alert("Ticket form is incomplete.");
        return;
    }

    const saveButton =
        document.querySelector(
            '#ticketDetails button[onclick="saveTicketUpdate()"]'
        );

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    try {

        const response = await fetch(
            `${API_BASE}/${encodeURIComponent(currentTicketId)}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body: JSON.stringify({

                    customer_name:
                        nameInput.value.trim(),

                    customer_email:
                        emailInput.value.trim(),

                    subject:
                        subjectInput.value.trim(),

                    description:
                        descriptionInput.value.trim(),

                    status:
                        statusInput.value,

                    notes:
                        notesInput
                            ? notesInput.value.trim()
                            : ""
                })
            }
        );

        const responseText =
            await response.text();

        let data = {};

        try {
            data = responseText
                ? JSON.parse(responseText)
                : {};
        } catch {
            data = {
                detail: responseText
            };
        }

        if (!response.ok) {
            throw new Error(
                data.detail ||
                `HTTP ${response.status}`
            );
        }

        alert("Ticket updated successfully.");

        await loadTickets();

        await showDetails(
            encodeURIComponent(currentTicketId)
        );

    } catch (error) {

        console.error(
            "Update ticket error:",
            error
        );

        alert(
            `Failed to update ticket: ${error.message}`
        );

    } finally {

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Update";
        }
    }
}


window.saveTicketUpdate =
    saveTicketUpdate;


// =====================================================
// AI TICKET ANALYSIS
// =====================================================

async function analyzeTicket() {

    if (!currentTicketId) {
        alert("No ticket selected.");
        return;
    }

    const button =
        document.getElementById(
            "aiAnalyzeButton"
        );

    const resultBox =
        document.getElementById(
            "aiAnalysis"
        );

    if (!resultBox) {
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "🤖 Analyzing...";
    }

    resultBox.innerHTML = `
        <div class="bg-white border border-purple-100 rounded-xl p-5">

            <div class="flex items-center gap-3">

                <div
                    class="w-6 h-6 border-4 border-purple-200 border-t-purple-600
                           rounded-full animate-spin">
                </div>

                <p class="text-sm text-gray-600">
                    AI is analyzing the ticket...
                </p>

            </div>

        </div>
    `;

    try {

        const response =
            await fetch(
                `${API_BASE}/${encodeURIComponent(currentTicketId)}/ai-analysis`,
                {
                    method: "POST",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );

        const responseText =
            await response.text();

        let data = {};

        try {
            data = responseText
                ? JSON.parse(responseText)
                : {};
        } catch {
            data = {
                detail: responseText
            };
        }

        if (!response.ok) {

            throw new Error(
                data.detail ||
                `HTTP ${response.status}`
            );
        }

        const analysis =
            data.analysis || {};

        currentAISuggestedReply =
            analysis.suggested_reply || "";


        // =================================================
        // AI RESULT
        // =================================================

        resultBox.innerHTML = `

            <div class="bg-white border border-purple-200 rounded-xl p-5 space-y-5">


                <!-- TOP TAGS -->

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">


                    <div class="bg-blue-50 rounded-xl p-4">

                        <p class="text-xs font-semibold text-blue-600 uppercase">
                            Category
                        </p>

                        <p class="font-bold text-gray-900 mt-1">
                            ${escapeHTML(
                                analysis.category || "-"
                            )}
                        </p>

                    </div>


                    <div class="bg-red-50 rounded-xl p-4">

                        <p class="text-xs font-semibold text-red-600 uppercase">
                            Priority
                        </p>

                        <p class="font-bold text-gray-900 mt-1">
                            ${escapeHTML(
                                analysis.priority || "-"
                            )}
                        </p>

                    </div>


                    <div class="bg-green-50 rounded-xl p-4">

                        <p class="text-xs font-semibold text-green-600 uppercase">
                            Sentiment
                        </p>

                        <p class="font-bold text-gray-900 mt-1">
                            ${escapeHTML(
                                analysis.sentiment || "-"
                            )}
                        </p>

                    </div>

                </div>


                <!-- SUMMARY -->

                <div>

                    <p class="text-sm font-semibold text-gray-700 mb-2">
                        📝 AI Summary
                    </p>

                    <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">

                        <p class="text-sm text-gray-700 leading-6">
                            ${escapeHTML(
                                analysis.summary || "-"
                            )}
                        </p>

                    </div>

                </div>


                <!-- SUGGESTED REPLY -->

                <div>

                    <div class="flex items-center justify-between gap-3 mb-2">

                        <p class="text-sm font-semibold text-gray-700">
                            💬 Suggested Customer Reply
                        </p>

                        <button
                            type="button"
                            onclick="copyAIReply()"
                            class="px-3 py-1.5 text-xs font-semibold
                                   rounded-lg bg-gray-900 text-white
                                   hover:bg-gray-800"
                        >
                            📋 Copy Reply
                        </button>

                    </div>


                    <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">

                        <p
                            id="aiSuggestedReply"
                            class="text-sm text-gray-700 leading-6 whitespace-pre-line"
                        >
                            ${escapeHTML(
                                currentAISuggestedReply || "-"
                            )}
                        </p>

                    </div>

                </div>

            </div>
        `;

    } catch (error) {

        console.error(
            "AI analysis error:",
            error
        );

        resultBox.innerHTML = `

            <div class="bg-red-50 border border-red-200 rounded-xl p-5">

                <p class="font-semibold text-red-700">
                    AI analysis failed
                </p>

                <p class="text-sm text-red-600 mt-2">
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = "🤖 Analyze with AI";
        }
    }
}


window.analyzeTicket =
    analyzeTicket;


// =====================================================
// COPY AI REPLY
// =====================================================

async function copyAIReply() {

    const reply =
        currentAISuggestedReply;

    if (!reply) {
        alert("No AI reply available.");
        return;
    }

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                reply
            );

        } else {

            const textarea =
                document.createElement("textarea");

            textarea.value = reply;

            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(
                textarea
            );

            textarea.focus();
            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();
        }

        alert("AI reply copied.");

    } catch (error) {

        console.error(
            "Copy error:",
            error
        );

        alert(
            "Could not copy the reply."
        );
    }
}


window.copyAIReply =
    copyAIReply;


// =====================================================
// SEARCH + STATUS EVENTS
// =====================================================

function initializeApp() {

    console.log(
        "Initializing Support CRM..."
    );

    searchInput =
        document.getElementById(
            "search"
        );

    statusFilter =
        document.getElementById(
            "status"
        );

    ticketList =
        document.getElementById(
            "ticketList"
        );

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {
                loadTickets();
            }
        );
    }

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            function () {
                loadTickets();
            }
        );
    }

    loadTickets();
}


// =====================================================
// START APPLICATION
// =====================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();
}
