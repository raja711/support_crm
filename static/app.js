console.log("Support CRM app.js loaded");

const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("status");
const ticketList = document.getElementById("ticketList");


// ===============================
// Helper Functions
// ===============================

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function statusBadge(status) {

    if (status === "Open") {
        return `
            <span class="px-3 py-1 rounded-full text-xs font-medium
                         bg-blue-100 text-blue-700">
                Open
            </span>
        `;
    }

    if (status === "In Progress") {
        return `
            <span class="px-3 py-1 rounded-full text-xs font-medium
                         bg-yellow-100 text-yellow-700">
                In Progress
            </span>
        `;
    }

    if (status === "Closed") {
        return `
            <span class="px-3 py-1 rounded-full text-xs font-medium
                         bg-green-100 text-green-700">
                Closed
            </span>
        `;
    }

    return `
        <span class="px-3 py-1 rounded-full text-xs font-medium
                     bg-gray-100 text-gray-700">
            ${escapeHTML(status)}
        </span>
    `;
}


// ===============================
// Load Tickets
// ===============================

async function loadTickets() {

    try {

        const search = searchInput
            ? searchInput.value.trim()
            : "";

        const status = statusFilter
            ? statusFilter.value
            : "";

        const params = new URLSearchParams();

        if (search) {
            params.append("search", search);
        }

        if (status) {
            params.append("status", status);
        }

        const url = `/api/tickets?${params.toString()}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to load tickets");
        }

        const tickets = await response.json();

        renderTickets(tickets);

    } catch (error) {

        console.error("Load tickets error:", error);

        if (ticketList) {
            ticketList.innerHTML = `
                <div class="p-6 text-center text-red-500">
                    Failed to load tickets.
                    Please refresh the page.
                </div>
            `;
        }
    }
}


// ===============================
// Render Tickets
// ===============================

function renderTickets(tickets) {

    if (!ticketList) return;

    updateCounters(tickets);

    if (!tickets.length) {

        ticketList.innerHTML = `
            <div class="p-10 text-center">
                <div class="text-gray-400 text-4xl mb-3">
                    🎫
                </div>

                <h3 class="text-lg font-semibold text-gray-700">
                    No tickets found
                </h3>

                <p class="text-sm text-gray-500 mt-1">
                    Try another search or create a new ticket.
                </p>
            </div>
        `;

        return;
    }


    ticketList.innerHTML = tickets.map(ticket => {

        return `
            <div
                class="bg-white border border-gray-200 rounded-xl
                       p-5 mb-4 hover:shadow-md transition"
            >

                <div class="flex flex-col md:flex-row
                            md:items-center md:justify-between gap-4">

                    <div class="flex-1">

                        <div class="flex items-center gap-3 mb-2">

                            <span class="text-sm font-semibold text-blue-600">
                                ${escapeHTML(ticket.ticket_id)}
                            </span>

                            ${statusBadge(ticket.status)}

                        </div>


                        <h3 class="text-lg font-semibold text-gray-800">
                            ${escapeHTML(ticket.subject)}
                        </h3>


                        <p class="text-sm text-gray-500 mt-1">
                            ${escapeHTML(ticket.customer_name)}
                            •
                            ${escapeHTML(ticket.customer_email)}
                        </p>


                        <p class="text-sm text-gray-600 mt-3 line-clamp-2">
                            ${escapeHTML(ticket.description)}
                        </p>


                        <p class="text-xs text-gray-400 mt-3">
                            Created: ${formatDate(ticket.created_at)}
                        </p>

                    </div>


                    <div>

                        <button
                            onclick="showDetails('${encodeURIComponent(ticket.ticket_id)}')"
                            class="px-4 py-2 bg-gray-900 text-white
                                   rounded-lg text-sm font-medium
                                   hover:bg-gray-700 transition"
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
// Dashboard Counters
// ===============================

function updateCounters(tickets) {

    const totalCount = document.getElementById("totalCount");
    const openCount = document.getElementById("openCount");
    const progressCount = document.getElementById("progressCount");
    const closedCount = document.getElementById("closedCount");


    if (totalCount) {
        totalCount.textContent = tickets.length;
    }

    if (openCount) {
        openCount.textContent =
            tickets.filter(ticket => ticket.status === "Open").length;
    }

    if (progressCount) {
        progressCount.textContent =
            tickets.filter(ticket => ticket.status === "In Progress").length;
    }

    if (closedCount) {
        closedCount.textContent =
            tickets.filter(ticket => ticket.status === "Closed").length;
    }
}


// ===============================
// Create Ticket
// ===============================

async function createTicket(event) {

    if (event) {
        event.preventDefault();
    }


    const name = document.querySelector(
        '[name="customer_name"]'
    )?.value.trim();

    const email = document.querySelector(
        '[name="customer_email"]'
    )?.value.trim();

    const subject = document.querySelector(
        '[name="subject"]'
    )?.value.trim();

    const description = document.querySelector(
        '[name="description"]'
    )?.value.trim();


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

            console.error(data);

            alert(
                data.detail
                    ? JSON.stringify(data.detail)
                    : "Failed to create ticket."
            );

            return;
        }


        alert(`Ticket ${data.ticket_id} created successfully.`);


        const form = document.getElementById("createTicketForm");

        if (form) {
            form.reset();
        }


        hideCreateModal();

        await loadTickets();


    } catch (error) {

        console.error("Create ticket error:", error);

        alert("Server error. Please try again.");
    }
}


// ===============================
// Show Ticket Details
// ===============================

async function showDetails(ticketId) {

    ticketId = decodeURIComponent(ticketId);


    try {

        const response = await fetch(
            `/api/tickets/${encodeURIComponent(ticketId)}`
        );


        if (!response.ok) {
            throw new Error("Ticket not found");
        }


        const ticket = await response.json();


        const details = document.getElementById("ticketDetails");

        if (!details) return;


        const notesHTML =
            ticket.notes && ticket.notes.length
                ? ticket.notes.map(note => `
                    <div class="border-l-4 border-blue-500
                                bg-gray-50 p-3 rounded-r-lg mb-3">

                        <p class="text-sm text-gray-700">
                            ${escapeHTML(note.note)}
                        </p>

                        <p class="text-xs text-gray-400 mt-2">
                            ${formatDate(note.created_at)}
                        </p>

                    </div>
                `).join("")
                : `
                    <p class="text-sm text-gray-400">
                        No notes yet.
                    </p>
                `;


        details.innerHTML = `

            <div class="space-y-5">

                <!-- Ticket ID -->

                <div>

                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">
                        Ticket ID
                    </label>

                    <input
                        type="text"
                        value="${escapeHTML(ticket.ticket_id)}"
                        disabled
                        class="w-full px-3 py-2 border rounded-lg
                               bg-gray-100 text-gray-600"
                    >

                </div>


                <!-- Customer -->

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>

                        <label class="block text-sm font-medium
                                      text-gray-700 mb-1">
                            Customer Name
                        </label>

                        <input
                            id="detailCustomerName"
                            type="text"
                            value="${escapeHTML(ticket.customer_name)}"
                            class="w-full px-3 py-2 border rounded-lg
                                   focus:ring-2 focus:ring-blue-500
                                   outline-none"
                        >

                    </div>


                    <div>

                        <label class="block text-sm font-medium
                                      text-gray-700 mb-1">
                            Customer Email
                        </label>

                        <input
                            id="detailCustomerEmail"
                            type="email"
                            value="${escapeHTML(ticket.customer_email)}"
                            class="w-full px-3 py-2 border rounded-lg
                                   focus:ring-2 focus:ring-blue-500
                                   outline-none"
                        >

                    </div>

                </div>


                <!-- Subject -->

                <div>

                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">
                        Subject
                    </label>

                    <input
                        id="detailSubject"
                        type="text"
                        value="${escapeHTML(ticket.subject)}"
                        class="w-full px-3 py-2 border rounded-lg
                               focus:ring-2 focus:ring-blue-500
                               outline-none"
                    >

                </div>


                <!-- Description -->

                <div>

                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">
                        Description
                    </label>

                    <textarea
                        id="detailDescription"
                        rows="4"
                        class="w-full px-3 py-2 border rounded-lg
                               focus:ring-2 focus:ring-blue-500
                               outline-none"
                    >${escapeHTML(ticket.description)}</textarea>

                </div>


                <!-- Status -->

                <div>

                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">
                        Status
                    </label>

                    <select
                        id="detailStatus"
                        class="w-full px-3 py-2 border rounded-lg
                               focus:ring-2 focus:ring-blue-500
                               outline-none"
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


                <!-- Dates -->

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div class="bg-gray-50 rounded-lg p-3">

                        <p class="text-xs text-gray-400">
                            Created
                        </p>

                        <p class="text-sm font-medium text-gray-700">
                            ${formatDate(ticket.created_at)}
                        </p>

                    </div>


                    <div class="bg-gray-50 rounded-lg p-3">

                        <p class="text-xs text-gray-400">
                            Last Updated
                        </p>

                        <p class="text-sm font-medium text-gray-700">
                            ${formatDate(ticket.updated_at)}
                        </p>

                    </div>

                </div>


                <!-- Previous Notes -->

                <div>

                    <h3 class="font-semibold text-gray-800 mb-3">
                        Notes / Comments
                    </h3>

                    ${notesHTML}

                </div>


                <!-- Add Note -->

                <div>

                    <label class="block text-sm font-medium
                                  text-gray-700 mb-1">
                        Add Note
                    </label>

                    <textarea
                        id="newNote"
                        rows="3"
                        placeholder="Write a note or comment..."
                        class="w-full px-3 py-2 border rounded-lg
                               focus:ring-2 focus:ring-blue-500
                               outline-none"
                    ></textarea>

                </div>


                <!-- Save -->

                <div class="flex justify-end">

                    <button
                        onclick="saveTicketUpdate('${encodeURIComponent(ticket.ticket_id)}')"
                        class="px-5 py-2.5 bg-blue-600 text-white
                               rounded-lg font-medium
                               hover:bg-blue-700 transition"
                    >
                        Save Update
                    </button>

                </div>

            </div>
        `;


        const modal = document.getElementById("detailsModal");

        if (modal) {
            modal.classList.remove("hidden");
        }


    } catch (error) {

        console.error("Show details error:", error);

        alert("Unable to load ticket details.");
    }
}


// ===============================
// Save Ticket Update
// ===============================

async function saveTicketUpdate(ticketId) {

    ticketId = decodeURIComponent(ticketId);


    const customerName =
        document.getElementById("detailCustomerName")?.value.trim();

    const customerEmail =
        document.getElementById("detailCustomerEmail")?.value.trim();

    const subject =
        document.getElementById("detailSubject")?.value.trim();

    const description =
        document.getElementById("detailDescription")?.value.trim();

    const status =
        document.getElementById("detailStatus")?.value;

    const notes =
        document.getElementById("newNote")?.value.trim();


    if (
        !customerName ||
        !customerEmail ||
        !subject ||
        !description ||
        !status
    ) {

        alert("Please fill all required fields.");

        return;
    }


    try {

        const response = await fetch(
            `/api/tickets/${encodeURIComponent(ticketId)}`,
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


        const data = await response.json();


        if (!response.ok) {

            console.error(data);

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

        console.error("Update ticket error:", error);

        alert("Server error. Please try again.");
    }
}


// ===============================
// Quick Status Update
// ===============================

async function updateStatus(ticketId, newStatus) {

    ticketId = decodeURIComponent(ticketId);


    try {

        // First get existing ticket data
        const getResponse = await fetch(
            `/api/tickets/${encodeURIComponent(ticketId)}`
        );


        if (!getResponse.ok) {
            throw new Error("Ticket not found");
        }


        const ticket = await getResponse.json();


        // PUT requires all fields
        const response = await fetch(
            `/api/tickets/${encodeURIComponent(ticketId)}`,
            {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    customer_name: ticket.customer_name,

                    customer_email: ticket.customer_email,

                    subject: ticket.subject,

                    description: ticket.description,

                    status: newStatus,

                    notes: null

                })
            }
        );


        if (!response.ok) {

            const errorData = await response.json();

            console.error(errorData);

            alert("Failed to update status.");

            return;
        }


        await loadTickets();


    } catch (error) {

        console.error("Status update error:", error);

        alert("Server error. Please try again.");
    }
}


// ===============================
// Create Modal
// ===============================

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
// Details Modal
// ===============================

function hideDetails() {

    const modal = document.getElementById("detailsModal");

    if (modal) {
        modal.classList.add("hidden");
    }
}


// ===============================
// Search
// ===============================

let searchTimer;

if (searchInput) {

    searchInput.addEventListener("input", function () {

        clearTimeout(searchTimer);

        searchTimer = setTimeout(() => {
            loadTickets();
        }, 300);

    });
}


// ===============================
// Status Filter
// ===============================

if (statusFilter) {

    statusFilter.addEventListener("change", function () {
        loadTickets();
    });
}


// ===============================
// ESC Key
// ===============================

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        hideCreateModal();

        hideDetails();
    }

});


// ===============================
// Modal Backdrop Click
// ===============================

document.addEventListener("click", function (event) {

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

});


// ===============================
// Create Form Submit
// ===============================

const createForm =
    document.getElementById("createTicketForm");


if (createForm) {

    createForm.addEventListener(
        "submit",
        createTicket
    );
}


// ===============================
// Initial Load
// ===============================

document.addEventListener("DOMContentLoaded", function () {

    loadTickets();

});