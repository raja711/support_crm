console.log("Support CRM app.js loaded");

const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("status");
const ticketList = document.getElementById("ticketList");


// ===============================
// HELPER FUNCTIONS
// ===============================

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


function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
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


// ===============================
// CREATE TICKET MODAL
// ===============================

function showCreateForm() {
    const modal = document.getElementById("createModal");

    if (modal) {
        modal.classList.remove("hidden");
    }
}


function hideCreateForm() {
    const modal = document.getElementById("createModal");

    if (modal) {
        modal.classList.add("hidden");
    }
}


// Keep compatibility with existing HTML
function showCreateModal() {
    const modal = document.getElementById("createModal");

    if (modal) {
        modal.classList.remove("hidden");
    }
}


function hideCreateModal() {
    const modal = document.getElementById("createModal");

    if (modal) {
        modal.classList.add("hidden");
    }
}


// ===============================
// LOAD TICKETS
// ===============================

async function loadTickets() {

    if (!ticketList) {
        return;
    }

    try {

        const params = new URLSearchParams();

        const search = searchInput?.value.trim();
        const status = statusFilter?.value;

        if (search) {
            params.append("search", search);
        }

        if (status && status !== "All") {
            params.append("status", status);
        }

        const queryString = params.toString();

        const url = queryString
            ? `/api/tickets?${queryString}`
            : `/api/tickets`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const tickets = await response.json();

        renderTickets(tickets);
        updateCounters(tickets);

    } catch (error) {

        console.error("Load tickets error:", error);

        ticketList.innerHTML = `
            <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <p class="font-semibold">Unable to load tickets.</p>
                <p class="text-sm mt-1">
                    Please refresh the page and try again.
                </p>
            </div>
        `;
    }
}


// ===============================
// RENDER TICKETS
// ===============================

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


    ticketList.innerHTML = tickets.map(ticket => {

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


                    <div class="flex-shrink-0">

                        <button
                            type="button"
                            onclick="showDetails('${encodedTicketId}')"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            View Details
                        </button>

                    </div>

                </div>

            </div>
        `;

    }).join("");
}


// ===============================
// COUNTERS
// ===============================

function updateCounters(tickets) {

    const totalCount = document.getElementById("totalCount");
    const openCount = document.getElementById("openCount");
    const progressCount = document.getElementById("progressCount");
    const closedCount = document.getElementById("closedCount");


    const total = tickets?.length || 0;

    const open = tickets
        ? tickets.filter(ticket => ticket.status === "Open").length
        : 0;

    const progress = tickets
        ? tickets.filter(ticket => ticket.status === "In Progress").length
        : 0;

    const closed = tickets
        ? tickets.filter(ticket => ticket.status === "Closed").length
        : 0;


    if (totalCount) {
        totalCount.textContent = total;
    }

    if (openCount) {
        openCount.textContent = open;
    }

    if (progressCount) {
        progressCount.textContent = progress;
    }

    if (closedCount) {
        closedCount.textContent = closed;
    }
}


// ===============================
// CREATE TICKET
// ===============================

async function createTicket(event) {

    if (event) {
        event.preventDefault();
    }


    const name =
        document.querySelector('[name="customer_name"]')
            ?.value.trim();

    const email =
        document.querySelector('[name="customer_email"]')
            ?.value.trim();

    const subject =
        document.querySelector('[name="subject"]')
            ?.value.trim();

    const description =
        document.querySelector('[name="description"]')
            ?.value.trim();


    if (!name || !email || !subject || !description) {

        alert("Please fill all fields.");

        return;
    }


    try {

        const response = await fetch("/api/tickets", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                customer_name: name,

                customer_email: email,

                subject: subject,

                description: description

            })

        });


        const data = await response.json();


        if (!response.ok) {

            console.error("Create ticket API error:", data);

            alert(
                data.detail
                    ? JSON.stringify(data.detail)
                    : "Failed to create ticket."
            );

            return;
        }


        alert(
            `Ticket ${data.ticket_id} created successfully.`
        );


        const form =
            document.getElementById("createTicketForm");


        if (form) {
            form.reset();
        }


        hideCreateModal();

        await loadTickets();


    } catch (error) {

        console.error(
            "Create ticket error:",
            error
        );

        alert(
            "Server error. Please try again."
        );
    }
}


// ===============================
// SHOW TICKET DETAILS
// ===============================

async function showDetails(ticketId) {

    const decodedTicketId =
        decodeURIComponent(ticketId);


    const detailsModal =
        document.getElementById("detailsModal");

    const ticketDetails =
        document.getElementById("ticketDetails");


    if (!detailsModal || !ticketDetails) {
        return;
    }


    ticketDetails.innerHTML = `
        <div class="p-6 text-center">
            <p class="text-gray-500">
                Loading ticket...
            </p>
        </div>
    `;


    detailsModal.classList.remove("hidden");


    try {

        const response =
            await fetch(
                `/api/tickets/${encodeURIComponent(decodedTicketId)}`
            );


        const ticket =
            await response.json();


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

                <div class="flex items-center justify-between gap-4">

                    <div>

                        <p class="text-sm text-gray-500">
                            Ticket ID
                        </p>

                        <h2 class="text-xl font-bold text-gray-900">
                            ${escapeHTML(ticket.ticket_id)}
                        </h2>

                    </div>

                    <div>
                        ${statusBadge(ticket.status)}
                    </div>

                </div>


                <div class="grid md:grid-cols-2 gap-4">

                    <div>

                        <label class="block text-sm font-medium text-gray-700 mb-1">
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

                        <label class="block text-sm font-medium text-gray-700 mb-1">
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

                    <label class="block text-sm font-medium text-gray-700 mb-1">
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

                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>

                    <textarea
                        id="detail_description"
                        rows="4"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >${escapeHTML(ticket.description)}</textarea>

                </div>


                <div>

                    <label class="block text-sm font-medium text-gray-700 mb-1">
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

                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>

                    <textarea
                        id="detail_notes"
                        rows="4"
                        placeholder="Add notes..."
                        class="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >${escapeHTML(notesText)}</textarea>

                </div>


                <div class="grid md:grid-cols-2 gap-4 text-sm text-gray-500">

                    <div>
                        <span class="font-medium">
                            Created:
                        </span>

                        ${formatDate(ticket.created_at)}
                    </div>


                    <div>
                        <span class="font-medium">
                            Updated:
                        </span>

                        ${formatDate(ticket.updated_at)}
                    </div>

                </div>


                <div class="flex justify-end gap-3 pt-4">

                    <button
                        type="button"
                        onclick="hideDetails()"
                        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>


                    <button
                        type="button"
                        onclick="saveTicketUpdate('${encodeURIComponent(ticket.ticket_id)}')"
                        class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            <div class="p-6">

                <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    ${escapeHTML(error.message)}
                </div>

            </div>
        `;
    }
}


// ===============================
// SAVE TICKET UPDATE
// ===============================

async function saveTicketUpdate(ticketId) {

    const decodedTicketId =
        decodeURIComponent(ticketId);


    const customerName =
        document.getElementById("detail_customer_name")
            ?.value.trim();

    const customerEmail =
        document.getElementById("detail_customer_email")
            ?.value.trim();

    const subject =
        document.getElementById("detail_subject")
            ?.value.trim();

    const description =
        document.getElementById("detail_description")
            ?.value.trim();

    const status =
        document.getElementById("detail_status")
            ?.value;

    const notes =
        document.getElementById("detail_notes")
            ?.value.trim();


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

        const response =
            await fetch(
                `/api/tickets/${encodeURIComponent(decodedTicketId)}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
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


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Update ticket API error:",
                data
            );

            alert(
                data.detail
                    ? JSON.stringify(data.detail)
                    : "Failed to update ticket."
            );

            return;
        }


        alert("Ticket updated successfully.");


        hideDetails();

        await loadTickets();


    } catch (error) {

        console.error(
            "Save update error:",
            error
        );

        alert(
            "Server error. Please try again."
        );
    }
}


// ===============================
// QUICK STATUS UPDATE
// ===============================

async function updateStatus(ticketId, newStatus) {

    const decodedTicketId =
        decodeURIComponent(ticketId);


    try {

        const getResponse =
            await fetch(
                `/api/tickets/${encodeURIComponent(decodedTicketId)}`
            );


        const ticket =
            await getResponse.json();


        if (!getResponse.ok) {
            throw new Error(
                ticket.detail || "Ticket not found"
            );
        }


        const notesText =
            Array.isArray(ticket.notes)
                ? ticket.notes.join("\n")
                : (ticket.notes || "");


        const response =
            await fetch(
                `/api/tickets/${encodeURIComponent(decodedTicketId)}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        customer_name:
                            ticket.customer_name,

                        customer_email:
                            ticket.customer_email,

                        subject:
                            ticket.subject,

                        description:
                            ticket.description,

                        status:
                            newStatus,

                        notes:
                            notesText || null

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Status update error:",
                data
            );

            alert(
                data.detail
                    ? JSON.stringify(data.detail)
                    : "Failed to update status."
            );

            return;
        }


        await loadTickets();


    } catch (error) {

        console.error(
            "Update status error:",
            error
        );

        alert(
            "Unable to update status."
        );
    }
}


// ===============================
// HIDE DETAILS MODAL
// ===============================

function hideDetails() {

    const modal =
        document.getElementById("detailsModal");

    if (modal) {
        modal.classList.add("hidden");
    }
}


// ===============================
// SEARCH
// ===============================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {
            loadTickets();
        }
    );
}


// ===============================
// STATUS FILTER
// ===============================

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        function () {
            loadTickets();
        }
    );
}


// ===============================
// ESC KEY
// ===============================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            hideCreateModal();

            hideDetails();
        }

    }
);


// ===============================
// MODAL BACKDROP CLICK
// ===============================

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

            hideCreateModal();
        }


        if (
            detailsModal &&
            event.target === detailsModal
        ) {

            hideDetails();
        }

    }
);


// ===============================
// PAGE LOAD
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadTickets();

    }
);