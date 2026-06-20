/* =========================================================
   PURPOSE:
   Handles admin login, enquiry loading, search, filter,
   pagination, status update, Excel export, and chatbot leads.

   USED IN:
   assets/js/admin.js
========================================================= */

const API_BASE_URL = "https://woodora-living.onrender.com";

const adminLoginForm = document.getElementById("adminLoginForm");
const enquiryTableBody = document.getElementById("enquiryTableBody");
const chatLeadTableBody = document.getElementById("chatLeadTableBody");

const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const statusFilter = document.getElementById("statusFilter");
const dashboardMessage = document.getElementById("dashboardMessage");

const totalCount = document.getElementById("totalCount");
const newCount = document.getElementById("newCount");
const contactedCount = document.getElementById("contactedCount");
const closedCount = document.getElementById("closedCount");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

/* =========================================================
PURPOSE:
Get dashboard notification badge elements
========================================================= */

const customerBadge = document.getElementById("customerBadge");
const chatbotBadge = document.getElementById("chatbotBadge");

const exportPageExcelBtn = document.getElementById("exportPageExcelBtn");
const exportFilteredExcelBtn = document.getElementById(
  "exportFilteredExcelBtn",
);

let currentPage = 1;
const rowsPerPage = 5;
let currentViewEnquiries = [];
let allEnquiries = [];

/* =========================================================
PURPOSE:
Store chatbot leads for Excel export
========================================================= */

let allChatLeads = [];

/* =========================================================
   PURPOSE:
   Admin login and token storage
========================================================= */

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    const loginMessage = document.getElementById("loginMessage");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("woodoraAdminToken", data.token);
        loginMessage.style.color = "green";
        loginMessage.textContent = "Login successful. Redirecting...";

        setTimeout(() => {
          window.location.href = "admin-dashboard.html";
        }, 800);
      } else {
        loginMessage.style.color = "red";
        loginMessage.textContent = data.message || "Login failed";
      }
    } catch (error) {
      loginMessage.style.color = "red";
      loginMessage.textContent = "Server error. Please check backend.";
    }
  });
}

/* =========================================================
   PURPOSE:
   Protect dashboard and load data
========================================================= */

if (enquiryTableBody) {
  const token = localStorage.getItem("woodoraAdminToken");

  if (!token) {
    window.location.href = "admin-login.html";
  } else {
    loadEnquiries();
    loadChatLeads();
  }
}

/* =========================================================
   PURPOSE:
   Dashboard button events
========================================================= */

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("woodoraAdminToken");
    window.location.href = "admin-login.html";
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    loadEnquiries();
    loadChatLeads();
  });
}

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    applySearchAndFilter();
  });
}

if (searchInput) {
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      applySearchAndFilter();
    }
  });
}

if (statusFilter) {
  statusFilter.addEventListener("change", () => {
    applySearchAndFilter();
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (statusFilter) statusFilter.value = "All";

    currentPage = 1;
    renderPaginatedEnquiries(allEnquiries);
    updateStats(allEnquiries);
  });
}

if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPaginatedEnquiries(currentViewEnquiries);
    }
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    const totalPages =
      Math.ceil(currentViewEnquiries.length / rowsPerPage) || 1;

    if (currentPage < totalPages) {
      currentPage++;
      renderPaginatedEnquiries(currentViewEnquiries);
    }
  });
}

if (exportPageExcelBtn) {
  exportPageExcelBtn.addEventListener("click", () => {
    exportCurrentPageToExcel();
  });
}

if (exportFilteredExcelBtn) {
  exportFilteredExcelBtn.addEventListener("click", () => {
    exportFilteredToExcel();
  });
}

/* =========================================================
PURPOSE:
Export chatbot leads to Excel on button click
========================================================= */

if (exportChatLeadsExcelBtn) {
  exportChatLeadsExcelBtn.addEventListener("click", () => {
    exportChatLeadsToExcel();
  });
}

/* =========================================================
   PURPOSE:
   Load customer enquiries from MongoDB
========================================================= */

async function loadEnquiries() {
  const token = localStorage.getItem("woodoraAdminToken");

  enquiryTableBody.innerHTML = `
    <tr>
      <td colspan="8" class="loading-text">Loading enquiries...</td>
    </tr>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/api/enquiries`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("woodoraAdminToken");
      window.location.href = "admin-login.html";
      return;
    }

    if (data.success) {
      allEnquiries = data.enquiries;
      currentPage = 1;
      renderPaginatedEnquiries(allEnquiries);
      updateStats(allEnquiries);
      updateCustomerBadge(allEnquiries);
    } else {
      showDashboardMessage("Unable to load enquiries.", "red");
    }
  } catch (error) {
    showDashboardMessage("Server error. Please check backend.", "red");

    enquiryTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-text">Could not load enquiries.</td>
      </tr>
    `;
  }
}

/* =========================================================
   PURPOSE:
   Load chatbot WhatsApp leads from MongoDB
========================================================= */

async function loadChatLeads() {
  const token = localStorage.getItem("woodoraAdminToken");

  if (!chatLeadTableBody) return;

  chatLeadTableBody.innerHTML = `
    <tr>
      <td colspan="5" class="loading-text">Loading chatbot leads...</td>
    </tr>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat-leads`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("woodoraAdminToken");
      window.location.href = "admin-login.html";
      return;
    }

    if (!data.success || !data.chatLeads || data.chatLeads.length === 0) {
      chatLeadTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-text">No chatbot leads found.</td>
        </tr>
      `;
      return;
    }

    allChatLeads = data.chatLeads;
    renderChatLeads(allChatLeads);
    updateChatbotBadge(allChatLeads);
  } catch (error) {
    chatLeadTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-text">Could not load chatbot leads.</td>
      </tr>
    `;
  }
}

/* =========================================================
   PURPOSE:
   Render chatbot leads table
========================================================= */

function renderChatLeads(chatLeads) {
  chatLeadTableBody.innerHTML = chatLeads
    .map((lead) => {
      const whatsapp = lead.whatsapp || "";
      const cleanWhatsapp = whatsapp.replace(/\D/g, "");
      const status = lead.status || "New";

      const date = lead.createdAt
        ? new Date(lead.createdAt).toLocaleDateString("en-IN")
        : "-";

      const contactedDisabled = status === "Contacted" || status === "Closed";
      const closedDisabled = status === "Closed";

      return `
        <tr>
          <td>${escapeHTML(whatsapp)}</td>

          <td class="message-cell">
            ${escapeHTML(lead.question || "-")}
          </td>

          <td>${date}</td>

          <td>
            <span class="status-badge ${getStatusClass(status)}">
              ${escapeHTML(status)}
            </span>
          </td>

          <td>
            <div class="action-buttons">
              <a
                class="whatsapp-btn"
                href="https://wa.me/91${cleanWhatsapp}"
                target="_blank"
              >
                WhatsApp
              </a>

              ${
                !contactedDisabled
                  ? `<button class="contacted-btn" onclick="updateChatLeadStatus('${lead._id}', 'Contacted')">Contacted</button>`
                  : ""
              }

              <button
                class="closed-btn"
                ${closedDisabled ? "disabled" : ""}
                onclick="${
                  closedDisabled
                    ? ""
                    : `updateChatLeadStatus('${lead._id}', 'Closed')`
                }"
              >
                ${closedDisabled ? "Closed ✓" : "Closed"}
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

/* =========================================================
   PURPOSE:
   Update chatbot lead status
========================================================= */

async function updateChatLeadStatus(id, status) {
  const token = localStorage.getItem("woodoraAdminToken");

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/chat-leads/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      },
    );

    const data = await response.json();

    if (data.success) {
      showDashboardMessage(`Chat lead marked as ${status}.`, "green");
      loadChatLeads();
    } else {
      showDashboardMessage("Chat lead status update failed.", "red");
    }
  } catch (error) {
    showDashboardMessage("Server error while updating chat lead.", "red");
  }
}

/* =========================================================
   PURPOSE:
   Search and filter customer enquiries
========================================================= */

function applySearchAndFilter() {
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedStatus = statusFilter ? statusFilter.value : "All";

  let filtered = [...allEnquiries];

  if (selectedStatus !== "All") {
    filtered = filtered.filter((enquiry) => enquiry.status === selectedStatus);
  }

  if (keyword) {
    filtered = filtered.filter((enquiry) => {
      return (
        (enquiry.name || "").toLowerCase().includes(keyword) ||
        (enquiry.phone || "").toLowerCase().includes(keyword) ||
        (enquiry.email || "").toLowerCase().includes(keyword) ||
        (enquiry.requirement || "").toLowerCase().includes(keyword) ||
        (enquiry.status || "").toLowerCase().includes(keyword)
      );
    });
  }

  currentPage = 1;
  renderPaginatedEnquiries(filtered);

  if (searchInput) {
    searchInput.value = "";
  }
}

/* =========================================================
   PURPOSE:
   Render paginated enquiry records
========================================================= */

function renderPaginatedEnquiries(enquiries) {
  currentViewEnquiries = enquiries;

  const totalPages = Math.ceil(enquiries.length / rowsPerPage) || 1;

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  renderEnquiries(enquiries.slice(startIndex, endIndex));

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage === 1;
  }

  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage === totalPages;
  }
}

/* =========================================================
   PURPOSE:
   Render customer enquiry rows
========================================================= */

function renderEnquiries(enquiries) {
  if (!enquiries || enquiries.length === 0) {
    enquiryTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-text">No enquiries found.</td>
      </tr>
    `;
    return;
  }

  enquiryTableBody.innerHTML = enquiries
    .map((enquiry) => {
      const phone = enquiry.phone || "";
      const email = enquiry.email || "";
      const status = enquiry.status || "New";
      const cleanPhone = phone.replace(/\D/g, "");

      const date = enquiry.createdAt
        ? new Date(enquiry.createdAt).toLocaleDateString("en-IN")
        : "-";

      const contactedDisabled = status === "Contacted" || status === "Closed";
      const closedDisabled = status === "Closed";

      return `
        <tr>
          <td>${escapeHTML(enquiry.name || "-")}</td>
          <td>${escapeHTML(phone)}</td>
          <td>${escapeHTML(email)}</td>
          <td>${escapeHTML(enquiry.requirement || "-")}</td>
          <td class="message-cell">${escapeHTML(enquiry.message || "-")}</td>
          <td>${date}</td>

          <td>
            <span class="status-badge ${getStatusClass(status)}">
              ${escapeHTML(status)}
            </span>
          </td>

          <td>
            <div class="action-buttons">
              <a class="call-btn" href="tel:${cleanPhone}">Call</a>

              <a
                class="whatsapp-btn"
                href="https://wa.me/91${cleanPhone}"
                target="_blank"
              >
                WhatsApp
              </a>

   <button
  type="button"
  class="email-btn"
  onclick="window.open('https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=Woodora%20Living%20Enquiry', '_blank')"
>
  Email
</button>
              

              ${
                !contactedDisabled
                  ? `<button class="contacted-btn" onclick="updateStatus('${enquiry._id}', 'Contacted')">Contacted</button>`
                  : ""
              }

              <button
                class="closed-btn"
                ${closedDisabled ? "disabled" : ""}
                onclick="${
                  closedDisabled
                    ? ""
                    : `updateStatus('${enquiry._id}', 'Closed')`
                }"
              >
                ${closedDisabled ? "Closed ✓" : "Closed"}
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

/* =========================================================
   PURPOSE:
   Update customer enquiry status
========================================================= */

async function updateStatus(id, status) {
  const token = localStorage.getItem("woodoraAdminToken");

  try {
    const response = await fetch(`${API_BASE_URL}/api/enquiries/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (data.success) {
      showDashboardMessage(`Status updated to ${status}.`, "green");
      loadEnquiries();
    } else {
      showDashboardMessage("Status update failed.", "red");
    }
  } catch (error) {
    showDashboardMessage("Server error while updating status.", "red");
  }
}

/* =========================================================
   PURPOSE:
   Update enquiry stats cards
========================================================= */

function updateStats(enquiries) {
  totalCount.textContent = enquiries.length;

  newCount.textContent = enquiries.filter(
    (item) => item.status === "New",
  ).length;

  contactedCount.textContent = enquiries.filter(
    (item) => item.status === "Contacted",
  ).length;

  closedCount.textContent = enquiries.filter(
    (item) => item.status === "Closed",
  ).length;
}

/* =========================================================
   PURPOSE:
   Export enquiry records to Excel
========================================================= */

/* =========================================================
   PURPOSE:
   Export current page enquiry records with date in filename
========================================================= */

function exportCurrentPageToExcel() {
  const visibleRows = currentViewEnquiries.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const today = new Date().toISOString().split("T")[0];

  exportRowsToExcel(
    visibleRows,
    `woodora-current-page-enquiries-${today}.xlsx`,
  );
}

/* =========================================================
   PURPOSE:
   Export all filtered enquiry records with date in filename
========================================================= */

function exportFilteredToExcel() {
  const today = new Date().toISOString().split("T")[0];

  exportRowsToExcel(
    currentViewEnquiries,
    `woodora-filtered-enquiries-${today}.xlsx`,
  );
}

function exportRowsToExcel(rows, fileName) {
  if (!rows || rows.length === 0) {
    alert("No enquiries available to export.");
    return;
  }

  /* =========================================================
PURPOSE:
Get chatbot leads export button
========================================================= */

  const exportChatLeadsExcelBtn = document.getElementById(
    "exportChatLeadsExcelBtn",
  );

  const exportData = rows.map((enquiry) => {
    return {
      Name: enquiry.name || "",
      Phone: `="${enquiry.phone || ""}"`,
      Email: enquiry.email || "",
      Requirement: enquiry.requirement || "",
      Message: enquiry.message || "",
      Date: enquiry.createdAt
        ? new Date(enquiry.createdAt).toLocaleDateString("en-IN")
        : "-",
      Status: enquiry.status || "New",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Woodora Enquiries");

  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: {
          name: "Calibri",
          sz: 12,
          bold: row === 0,
        },
        border: {
          top: { style: "thin", color: { rgb: "999999" } },
          bottom: { style: "thin", color: { rgb: "999999" } },
          left: { style: "thin", color: { rgb: "999999" } },
          right: { style: "thin", color: { rgb: "999999" } },
        },
        alignment: {
          vertical: "center",
          wrapText: true,
        },
      };
    }
  }

  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 32 },
    { wch: 24 },
    { wch: 35 },
    { wch: 14 },
    { wch: 14 },
  ];

  worksheet["!rows"] = [{ hpt: 24 }];

  XLSX.writeFile(workbook, fileName);
}

/* =========================================================
PURPOSE:
Export chatbot leads to formatted Excel file
========================================================= */

function exportChatLeadsToExcel() {
  if (!allChatLeads || allChatLeads.length === 0) {
    alert("No chatbot leads available to export.");
    return;
  }

  const exportData = allChatLeads.map((lead) => {
    return {
      WhatsApp: lead.whatsapp || "",
      Question: lead.question || "",
      Date: lead.createdAt
        ? new Date(lead.createdAt).toLocaleDateString("en-IN")
        : "-",
      Status: lead.status || "New",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Chatbot Leads");

  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: {
          name: "Calibri",
          sz: 12,
          bold: row === 0,
        },
        border: {
          top: { style: "thin", color: { rgb: "999999" } },
          bottom: { style: "thin", color: { rgb: "999999" } },
          left: { style: "thin", color: { rgb: "999999" } },
          right: { style: "thin", color: { rgb: "999999" } },
        },
        alignment: {
          vertical: "center",
          wrapText: true,
        },
      };
    }
  }

  worksheet["!cols"] = [{ wch: 18 }, { wch: 45 }, { wch: 16 }, { wch: 16 }];

  worksheet["!rows"] = [{ hpt: 24 }];

  const today = new Date().toISOString().split("T")[0];

  XLSX.writeFile(workbook, `woodora-chatbot-leads-${today}.xlsx`);
}

/* =========================================================
   PURPOSE:
   Helper functions
========================================================= */

function getStatusClass(status) {
  if (status === "Contacted") return "status-contacted";
  if (status === "Closed") return "status-closed";
  return "status-new";
}

function showDashboardMessage(message, color) {
  if (!dashboardMessage) return;

  dashboardMessage.style.color = color;
  dashboardMessage.textContent = message;

  setTimeout(() => {
    dashboardMessage.textContent = "";
  }, 3000);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* =========================================================
PURPOSE:
Toggle between Customer Enquiries and Chatbot Leads
Show only one dashboard section at a time
========================================================= */

const customerTab = document.getElementById("customerTab");
const chatbotTab = document.getElementById("chatbotTab");

const customerSection = document.getElementById("customerSection");

const chatbotSection = document.getElementById("chatbotSection");

function activateCustomerTab() {
  if (!customerSection || !chatbotSection) return;

  customerSection.classList.add("active-section");
  chatbotSection.classList.remove("active-section");

  customerTab?.classList.add("active");
  chatbotTab?.classList.remove("active");
}

function activateChatbotTab() {
  if (!customerSection || !chatbotSection) return;

  customerSection.classList.remove("active-section");
  chatbotSection.classList.add("active-section");

  customerTab?.classList.remove("active");
  chatbotTab?.classList.add("active");
}

customerTab?.addEventListener("click", activateCustomerTab);

chatbotTab?.addEventListener("click", activateChatbotTab);

/* Default open section */

activateCustomerTab();

/* =========================================================
PURPOSE:
Update Customer Enquiries tab badge with New enquiry count
========================================================= */

function updateCustomerBadge(enquiries) {
  if (!customerBadge) return;

  const newCustomerCount = enquiries.filter(
    (item) => item.status === "New",
  ).length;

  customerBadge.textContent = newCustomerCount;

  customerBadge.style.display = newCustomerCount > 0 ? "inline-flex" : "none";
}

/* =========================================================
PURPOSE:
Update Chatbot Leads tab badge with New chatbot lead count
========================================================= */

function updateChatbotBadge(chatLeads) {
  if (!chatbotBadge) return;

  const newChatbotCount = chatLeads.filter(
    (item) => item.status === "New",
  ).length;

  chatbotBadge.textContent = newChatbotCount;

  chatbotBadge.style.display = newChatbotCount > 0 ? "inline-flex" : "none";
}

/* =========================================================
PURPOSE:
Automatically refresh dashboard data without reloading page
========================================================= */

let dashboardAutoRefresh = null;

function startDashboardAutoRefresh() {
  if (!enquiryTableBody) return;

  dashboardAutoRefresh = setInterval(() => {
    loadEnquiries();
    loadChatLeads();
  }, 30000);
}

startDashboardAutoRefresh();
