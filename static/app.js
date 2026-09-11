```javascript
console.log("Support CRM app.js loaded");

const API_BASE = "/api/tickets";

let searchInput = null;
let statusFilter = null;
let ticketList = null;


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

    if (isNaN(date.getTime())) {
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
// IMPORTANT: window. is required because index.html
// uses onclick="showCreateForm()"
// =====================================================

window.showCreateForm = function () {
    console.log("showCreateForm() called");

    const modal = document.getElementById("createModal");

    if (!modal) {
        console.error("createModal not found");
        alert("Create ticket window could not be opened.");
        return;
    }

    modal.classList.remove("hidden");

    const nameInput = document.getElementById("customer_name");

    if (nameInput) {
        setTimeout(function () {
            nameInput.focus();
        }, 100);
    }
};


window.hideCreateForm = function () {
    console.log("hideCreateForm() called");

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
    console.log("loadTickets() called");

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
            params.append("search", search);
        }

        if (
            status &&
            status !== "All" &&
            status !== "All Statuses"
        ) {
            params.append("status", status);
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
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("Tickets received:", data);

        if (!Array.isArray(data)) {
            throw new Error("Invalid API response");
        }

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
                    class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        `;

        updateCounters([]);
    }
}


// Make available to inline HTML onclick
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

    const list = Array.isArray(tickets)
        ? tickets
        : [];

    if (totalCount) {
        totalCount.textContent = list.length;
    }

    if (openCount) {
        openCount.textContent =
            list.filter(function (ticket) {
                return ticket.status === "Open";
            }).length;
    }

    if (progressCount) {
        progressCount.textContent =
            list.filter(function (ticket) {
                return ticket.status === "In Progress";
            }).length;
    }

    if (closedCount) {
        closedCount.textContent =
            list.filter(function (ticket) {
                return ticket.status === "Closed";
            }).length;
    }
}


// =====================================================
// CREATE TICKET
// =====================================================

async function createTicket(event) {

    console.log("createTicket() called");

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
        console.error("Create form fields not found");
        alert("Create ticket form is not configured correctly.");
        return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!name || !email || !subject || !description) {
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

        console.log("POST:", API_BASE);

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

        console.log("Create ticket response:", data);

        if (!response.ok) {
            throw new Error(
                data.detail || `HTTP ${response.status}`
            );
        }

        alert(
            `${data.ticket_id || "Ticket"} created successfully.`
        );

        const form =
            document.getElementById("createTicketForm");

        if (form) {
            form.reset();
        }

        window.hideCreateForm();

        await loadTickets();

    } catch (error) {

        console.error("Create ticket error:", error);

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


// IMPORTANT: make inline onsubmit="createTicket(event)" work
window.createTicket = createTicket;


// =====================================================
// SHOW DETAILS
// =====================================================

async function showDetails(ticketId) {

    const decodedTicketId =
        decodeURIComponent(ticketId);

    const detailsModal =
        document.getElementById("detailsModal");

    const ticketDetails =
        document.getElementById("ticketDetails");

    if (!detailsModal || !ticketDetails) {
        console.error("Details modal elements not found");
        return;
    }

    detailsModal.classList.remove("hidden");

    ticketDetails.innerHTML = `
        <div class="p-6 text-center text-gray-500">
            Loading ticket...
        </div>
    `;

    try {

        const response = await fetch(
            `${API_BASE}/${encodeURIComponent(decodedTicketId)}`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
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
            ticket = {
                detail: responseText
            };
        }

        if (!response.ok) {
            throw new Error(
                ticket.detail || "Ticket not found"
            );
        }

        const notesText =
            Array.isArray(ticket.notes)
                ? ticket.notes.join("\n")
                : (ticket.notes || "");

        ticketDetails.innerHTML = `

            <div class="space-y-5">

                <div class="flex items-center justify-between">

                    <div>
                        <p class="text-sm text-gray-500">
                            Ticket ID
                        </p>

                        <h2 class="text-xl font-bold">
                            ${escapeHTML(ticket.ticket_id)}
                        </h2>
                    </div>

                    ${statusBadge(ticket.status)}

                </div>

                <div class="grid md:grid-cols-2 gap-4">

                    <div>
                        <label class="block text-sm font-medium mb-1">
                            Customer Name
                        </label>

                        <input
                            id="detail_customer_name"
                            type="text"
                            value="${escapeHTML(ticket.customer_name)}"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-1">
                            Customer Email
                        </label>

                        <input
                            id="detail_customer_email"
                            type="email"
                            value="${escapeHTML(ticket.customer_email)}"
                            class="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                    </div>

                </div>

                <div>
                    <label class="block text-sm font-medium mb-1">
                        Subject
                    </label>

                    <input
                        id="detail_subject"
                        type="text"
                        value="${escapeHTML(ticket.subject)}"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                </div>

                <div>
                    <label class="block text-sm font-medium mb-1">
                        Description
                    </label>

                    <textarea
                        id="detail_description"
                        rows="4"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >${escapeHTML(ticket.description)}</textarea>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-1">
                        Status
                    </label>

                    <select
                        id="detail_status"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2"
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

                <div>
                    <label class="block text-sm font-medium mb-1">
                        Notes
                    </label>

                    <textarea
                        id="detail_notes"
                        rows="4"
                        placeholder="Add notes..."
                        class="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >${escapeHTML(notesText)}</textarea>
                </div>

                <div class="flex justify-end gap-3 pt-4">

                    <button
                        type="button"
                        onclick="hideDetails()"
                        class="px-4 py-2 border rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onclick="saveTicketUpdate('${encodeURIComponent(ticket.ticket_id)}')"
                        class="px-5 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Save Update
                    </button>

                </div>

            </div>
        `;

    } catch (error) {

        console.error("Show details error:", error);

        ticketDetails.innerHTML = `
            <div class="p-6 bg-red-50 text-red-700 rounded-lg">
                ${escapeHTML(error.message)}
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
}

window.hideDetails = hideDetails;


// =====================================================
// SAVE UPDATE
// =====================================================

async function saveTicketUpdate(ticketId) {

    const decodedTicketId =
        decodeURIComponent(ticketId);

    const customerName =
        document.getElementById(
            "detail_customer_name"
        )?.value.trim();

    const customerEmail =
        document.getElementById(
            "detail_customer_email"
        )?.value.trim();

    const subject =
        document.getElementById(
            "detail_subject"
        )?.value.trim();

    const description =
        document.getElementById(
            "detail_description"
        )?.value.trim();

    const status =
        document.getElementById(
            "detail_status"
        )?.value;

    const notes =
        document.getElementById(
            "detail_notes"
        )?.value.trim();

    if (
        !customerName ||
        !customerEmail ||
        !subject ||
        !description
    ) {
        alert("Please fill all required fields.");
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/${encodeURIComponent(decodedTicketId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    customer_name: customerName,
                    customer_email: customerEmail,
                    subject: subject,
                    description: description,
                    status: status,
                    notes: notes || null
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
                data.detail || `HTTP ${response.status}`
            );
        }

        alert("Ticket updated successfully.");

        hideDetails();

        await loadTickets();

    } catch (error) {

        console.error("Save update error:", error);

        alert(
            `Failed to update ticket: ${error.message}`
        );
    }
}


window.saveTicketUpdate = saveTicketUpdate;


// =====================================================
// FILTERS
// =====================================================

function setupFilters() {

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
}


// =====================================================
// KEYBOARD
// =====================================================

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {
                window.hideCreateForm();
                window.hideDetails();
            }

        }
    );
}


// =====================================================
// MODAL BACKDROP
// =====================================================

function setupModalBackdrop() {

    document.addEventListener(
        "click",
        function (event) {

            const createModal =
                document.getElementById("createModal");

            const detailsModal =
                document.getElementById("detailsModal");

            if (
                createModal &&
                event.target === createModal
            ) {
                window.hideCreateForm();
            }

            if (
                detailsModal &&
                event.target === detailsModal
            ) {
                window.hideDetails();
            }
        }
    );
}


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "DOM loaded - initializing Support CRM"
        );

        searchInput =
            document.getElementById("search");

        statusFilter =
            document.getElementById("status");

        ticketList =
            document.getElementById("ticketList");

        console.log("searchInput:", searchInput);
        console.log("statusFilter:", statusFilter);
        console.log("ticketList:", ticketList);

        setupFilters();
        setupKeyboard();
        setupModalBackdrop();

        loadTickets();
    }
);
```
