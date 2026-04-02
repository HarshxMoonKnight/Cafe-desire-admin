const siteConfig = window.CAFE_CONFIG || {};
const businessConfig = siteConfig.business || {};
const deliveryConfig = siteConfig.delivery || {};
const storageConfig = siteConfig.storage || {};
const supabaseConfig = siteConfig.supabase || {};

const SUPABASE_URL = supabaseConfig.url || "";
const SUPABASE_ANON_KEY = supabaseConfig.anonKey || "";
const authStorageKey = storageConfig.adminSessionKey || "cafe-admin-session";
const siteSettingsCacheKey = storageConfig.siteSettingsCacheKey || "cafe-site-settings";
const menuCacheKey = storageConfig.menuCacheKey || "cafe-menu-items";

const loginPanel = document.querySelector("#login-panel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector(".login-form");
const loginEmail = document.querySelector(".login-email");
const loginPassword = document.querySelector(".login-password");
const loginMessage = document.querySelector(".login-message");
const ordersMessage = document.querySelector(".orders-message");
const ordersList = document.querySelector(".orders-list");
const refreshButton = document.querySelector(".refresh-orders");
const logoutButton = document.querySelector(".logout-btn");
const archiveNavButton = document.querySelector(".archive-nav-btn");
const liveNavButton = document.querySelector(".live-nav-btn");
const ordersSearch = document.querySelector(".orders-search");
const filterChips = document.querySelectorAll(".filter-chip");
const statTotal = document.querySelector(".stat-total");
const statNew = document.querySelector(".stat-new");
const statPreparing = document.querySelector(".stat-preparing");
const statCompleted = document.querySelector(".stat-completed");
const sectionEyebrow = document.querySelector(".section-eyebrow");
const sectionTitle = document.querySelector(".section-title");
const sectionCopy = document.querySelector(".section-copy");
const settingsModal = document.querySelector(".settings-modal");
const openSettingsButton = document.querySelector(".open-settings-btn");
const closeSettingsButton = document.querySelector(".close-settings-btn");
const settingsBackdrop = document.querySelector(".settings-backdrop");
const menuModal = document.querySelector(".menu-modal");
const openMenuButton = document.querySelector(".open-menu-btn");
const closeMenuButton = document.querySelector(".close-menu-btn");
const menuBackdrop = document.querySelector(".menu-backdrop");
const menuMessage = document.querySelector(".menu-message");
const menuAdminList = document.querySelector(".menu-admin-list");
const menuSectionFilter = document.querySelector(".menu-section-filter");
const menuSectionOptions = document.querySelector(".menu-section-options");
const addMenuItemButton = document.querySelector(".add-menu-item-btn");
const menuItemForm = document.querySelector(".menu-item-form");
const menuItemId = document.querySelector(".menu-item-id");
const menuItemSection = document.querySelector(".menu-item-section");
const menuItemCategory = document.querySelector(".menu-item-category");
const menuItemName = document.querySelector(".menu-item-name");
const menuItemPrice = document.querySelector(".menu-item-price");
const menuItemDescription = document.querySelector(".menu-item-description");
const menuItemImageUrl = document.querySelector(".menu-item-image-url");
const menuItemDisplayOrder = document.querySelector(".menu-item-display-order");
const menuItemIsActive = document.querySelector(".menu-item-is-active");
const deleteMenuItemButton = document.querySelector(".delete-menu-item-btn");
const settingsForm = document.querySelector(".settings-form");
const settingsMessage = document.querySelector(".settings-message");
const settingsBusinessName = document.querySelector(".settings-business-name");
const settingsShortName = document.querySelector(".settings-short-name");
const settingsEmail = document.querySelector(".settings-email");
const settingsPhoneDisplay = document.querySelector(".settings-phone-display");
const settingsPhoneHref = document.querySelector(".settings-phone-href");
const settingsWhatsappNumber = document.querySelector(".settings-whatsapp-number");
const settingsAddressLine1 = document.querySelector(".settings-address-line-1");
const settingsAddressLine2 = document.querySelector(".settings-address-line-2");
const settingsFooterTagline = document.querySelector(".settings-footer-tagline");
const settingsMapQuery = document.querySelector(".settings-map-query");
const settingsMapEmbedUrl = document.querySelector(".settings-map-embed-url");
const settingsLatitude = document.querySelector(".settings-latitude");
const settingsLongitude = document.querySelector(".settings-longitude");
const settingsThresholdKm = document.querySelector(".settings-threshold-km");
const settingsLongDistanceFee = document.querySelector(".settings-long-distance-fee");

let currentBusinessConfig = {
  name: businessConfig.name || "Cafe",
  shortName: businessConfig.shortName || (businessConfig.name || "Cafe").slice(0, 2).toUpperCase(),
  email: businessConfig.email || "",
  phoneDisplay: businessConfig.phoneDisplay || "",
  phoneHref: businessConfig.phoneHref || "",
  whatsappNumber: businessConfig.whatsappNumber || "",
  addressLines: Array.isArray(businessConfig.addressLines) ? businessConfig.addressLines : ["", ""],
  footerTagline: businessConfig.footerTagline || "",
  mapQuery: businessConfig.mapQuery || "",
  mapEmbedUrl: businessConfig.mapEmbedUrl || "",
  coordinates: businessConfig.coordinates || { lat: 0, lng: 0 },
};
let currentDeliveryConfig = {
  thresholdKm: deliveryConfig.thresholdKm ?? 15,
  longDistanceFee: deliveryConfig.longDistanceFee ?? 150,
};
let allMenuItems = [];
let selectedMenuItemId = null;

const DEFAULT_MENU_SECTIONS = [
  "showcase",
  "drinks",
  "burgers",
  "pizza",
  "pasta",
  "continental",
  "desserts",
];

const formatMenuSectionLabel = (value = "") =>
  String(value)
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeMenuSectionKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const getMenuSectionKeys = (items = allMenuItems) => {
  const known = new Set(DEFAULT_MENU_SECTIONS);

  items.forEach((item) => {
    const key = normalizeMenuSectionKey(item?.section_key || "");
    if (key) known.add(key);
  });

  return [...known];
};

const syncMenuSectionControls = () => {
  const sectionKeys = getMenuSectionKeys();
  const currentFilterValue = menuSectionFilter?.value || "all";
  const currentFormValue = normalizeMenuSectionKey(menuItemSection?.value || "");

  if (menuSectionFilter) {
    menuSectionFilter.innerHTML = [
      '<option value="all">All Sections</option>',
      ...sectionKeys.map(
        (key) => `<option value="${key}">${formatMenuSectionLabel(key)}</option>`,
      ),
    ].join("");

    menuSectionFilter.value = sectionKeys.includes(currentFilterValue) ? currentFilterValue : "all";
  }

  if (menuSectionOptions) {
    menuSectionOptions.innerHTML = sectionKeys
      .map((key) => `<option value="${key}">${formatMenuSectionLabel(key)}</option>`)
      .join("");
  }

  if (menuItemSection) {
    menuItemSection.value = currentFormValue || (menuSectionFilter?.value !== "all" ? menuSectionFilter.value : "showcase");
  }
};

const applyAdminBranding = () => {
  const businessName = currentBusinessConfig.name || "Cafe";
  document.title = `${businessName} Admin`;

  document.querySelectorAll("[data-site-field='admin-heading']").forEach((element) => {
    element.textContent = `${businessName} Orders`;
  });
};

applyAdminBranding();

let adminSession = null;
let currentView = "live";
let allOrders = [];
let selectedStatusFilter = "all";
let knownOrderIds = new Set();
let freshOrderIds = new Set();
let hasLoadedOrders = false;
let ordersPollTimer = null;
let audioContext = null;

const ORDERS_POLL_INTERVAL_MS = 15000;

const setMessage = (element, message) => {
  if (element) element.textContent = message;
};

const parseSupabaseError = async (response, fallbackMessage) => {
  const rawText = await response.text();

  try {
    const payload = JSON.parse(rawText);
    const apiMessage = String(payload?.message || "").trim();
    const missingMenuTable =
      payload?.code === "PGRST205" && apiMessage.includes("public.menu_items");

    if (missingMenuTable) {
      return "Menu storage is not set up in Supabase yet. Run the SQL in supabase-orders.sql to create public.menu_items, then reload.";
    }

    return apiMessage || fallbackMessage;
  } catch {
    return rawText || fallbackMessage;
  }
};

const saveSession = (session) => {
  sessionStorage.setItem(authStorageKey, JSON.stringify(session));
};

const loadSession = () => {
  try {
    const raw = sessionStorage.getItem(authStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    sessionStorage.removeItem(authStorageKey);
    return null;
  }
};

const clearSession = () => {
  sessionStorage.removeItem(authStorageKey);
  adminSession = null;
};

const openSettingsModal = () => {
  if (!settingsModal) return;
  populateSettingsForm();
  settingsModal.classList.remove("hidden");
  settingsModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  settingsBusinessName?.focus();
};

const closeSettingsModal = () => {
  if (!settingsModal) return;
  settingsModal.classList.add("hidden");
  settingsModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

const persistSiteSettingsCache = (settings) => {
  try {
    sessionStorage.setItem(siteSettingsCacheKey, JSON.stringify(settings));
  } catch {}
};

const normalizeSiteSettings = (record) => ({
  business: {
    name: record.business_name || currentBusinessConfig.name,
    shortName: record.short_name || currentBusinessConfig.shortName,
    email: record.email || currentBusinessConfig.email,
    phoneDisplay: record.phone_display || currentBusinessConfig.phoneDisplay,
    phoneHref: record.phone_href || currentBusinessConfig.phoneHref,
    whatsappNumber: record.whatsapp_number || currentBusinessConfig.whatsappNumber,
    addressLines: [record.address_line_1 || "", record.address_line_2 || ""],
    footerTagline: record.footer_tagline || currentBusinessConfig.footerTagline,
    mapQuery: record.map_query || currentBusinessConfig.mapQuery,
    mapEmbedUrl: record.map_embed_url || currentBusinessConfig.mapEmbedUrl,
    coordinates: {
      lat: Number(record.latitude ?? currentBusinessConfig.coordinates.lat ?? 0),
      lng: Number(record.longitude ?? currentBusinessConfig.coordinates.lng ?? 0),
    },
  },
  delivery: {
    thresholdKm: Number(record.delivery_threshold_km ?? currentDeliveryConfig.thresholdKm),
    longDistanceFee: Number(record.long_distance_fee ?? currentDeliveryConfig.longDistanceFee),
  },
});

const updateActiveSiteSettings = (settings) => {
  if (!settings) return;
  currentBusinessConfig = settings.business;
  currentDeliveryConfig = settings.delivery;
  applyAdminBranding();
};

const populateSettingsForm = () => {
  if (!settingsForm) return;

  settingsBusinessName.value = currentBusinessConfig.name || "";
  settingsShortName.value = currentBusinessConfig.shortName || "";
  settingsEmail.value = currentBusinessConfig.email || "";
  settingsPhoneDisplay.value = currentBusinessConfig.phoneDisplay || "";
  settingsPhoneHref.value = currentBusinessConfig.phoneHref || "";
  settingsWhatsappNumber.value = currentBusinessConfig.whatsappNumber || "";
  settingsAddressLine1.value = currentBusinessConfig.addressLines?.[0] || "";
  settingsAddressLine2.value = currentBusinessConfig.addressLines?.[1] || "";
  settingsFooterTagline.value = currentBusinessConfig.footerTagline || "";
  settingsMapQuery.value = currentBusinessConfig.mapQuery || "";
  settingsMapEmbedUrl.value = currentBusinessConfig.mapEmbedUrl || "";
  settingsLatitude.value = currentBusinessConfig.coordinates?.lat ?? "";
  settingsLongitude.value = currentBusinessConfig.coordinates?.lng ?? "";
  settingsThresholdKm.value = currentDeliveryConfig.thresholdKm ?? 15;
  settingsLongDistanceFee.value = currentDeliveryConfig.longDistanceFee ?? 150;
};

const fetchSiteSettings = async () => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=*`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data[0] || null;
};

const saveSiteSettings = async (payload) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const data = await response.json();
    if (data[0]) {
      return data[0];
    }
  }

  const errorText = response.ok ? "" : await response.text();
  const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/site_settings`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({ id: 1, ...payload }),
  });

  if (!insertResponse.ok) {
    throw new Error(errorText || (await insertResponse.text()) || "Could not save settings.");
  }

  const insertData = await insertResponse.json();
  return insertData[0] || null;
};

const buildSettingsPayload = () => ({
  business_name: settingsBusinessName.value.trim(),
  short_name: settingsShortName.value.trim(),
  email: settingsEmail.value.trim(),
  phone_display: settingsPhoneDisplay.value.trim(),
  phone_href: settingsPhoneHref.value.trim(),
  whatsapp_number: settingsWhatsappNumber.value.trim(),
  address_line_1: settingsAddressLine1.value.trim(),
  address_line_2: settingsAddressLine2.value.trim(),
  footer_tagline: settingsFooterTagline.value.trim(),
  map_query: settingsMapQuery.value.trim(),
  map_embed_url: settingsMapEmbedUrl.value.trim(),
  latitude: Number(settingsLatitude.value),
  longitude: Number(settingsLongitude.value),
  delivery_threshold_km: Number(settingsThresholdKm.value),
  long_distance_fee: Number(settingsLongDistanceFee.value),
  updated_at: new Date().toISOString(),
});

const persistMenuCache = (items) => {
  try {
    sessionStorage.setItem(menuCacheKey, JSON.stringify(items));
  } catch {}
};

const loadCachedMenu = () => {
  try {
    const raw = sessionStorage.getItem(menuCacheKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    sessionStorage.removeItem(menuCacheKey);
    return [];
  }
};

const openMenuModal = () => {
  if (!menuModal) return;
  syncMenuSectionControls();
  renderMenuAdminList();
  menuModal.classList.remove("hidden");
  menuModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};

const closeMenuModal = () => {
  if (!menuModal) return;
  menuModal.classList.add("hidden");
  menuModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

const getVisibleMenuItems = () => {
  const filterValue = menuSectionFilter?.value || "all";
  const baseItems = [...allMenuItems].sort((a, b) => {
    if ((a.section_key || "") !== (b.section_key || "")) {
      return String(a.section_key || "").localeCompare(String(b.section_key || ""));
    }

    const orderDiff = Number(a.display_order || 0) - Number(b.display_order || 0);
    if (orderDiff !== 0) return orderDiff;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  return filterValue === "all"
    ? baseItems
    : baseItems.filter((item) => item.section_key === filterValue);
};

const resetMenuItemForm = () => {
  if (!menuItemForm) return;

  selectedMenuItemId = null;
  menuItemId.value = "";
  menuItemSection.value =
    menuSectionFilter?.value && menuSectionFilter.value !== "all"
      ? menuSectionFilter.value
      : "showcase";
  menuItemCategory.value = "";
  menuItemName.value = "";
  menuItemPrice.value = "";
  menuItemDescription.value = "";
  menuItemImageUrl.value = "";
  menuItemDisplayOrder.value = "0";
  menuItemIsActive.checked = true;
  deleteMenuItemButton?.classList.add("hidden");
  syncMenuSectionControls();
};

const populateMenuItemForm = (item) => {
  if (!item) {
    resetMenuItemForm();
    return;
  }

  selectedMenuItemId = item.id;
  menuItemId.value = String(item.id);
  menuItemSection.value = normalizeMenuSectionKey(item.section_key || "showcase");
  menuItemCategory.value = item.category || "";
  menuItemName.value = item.name || "";
  menuItemPrice.value = String(item.price ?? "");
  menuItemDescription.value = item.description || "";
  menuItemImageUrl.value = item.image_url || "";
  menuItemDisplayOrder.value = String(item.display_order ?? 0);
  menuItemIsActive.checked = item.is_active !== false;
  deleteMenuItemButton?.classList.remove("hidden");
  syncMenuSectionControls();
};

const renderMenuAdminList = () => {
  if (!menuAdminList) return;

  const visibleItems = getVisibleMenuItems();
  menuAdminList.innerHTML = visibleItems.length
    ? visibleItems
        .map(
          (item) => `
            <article class="menu-admin-item ${item.id === selectedMenuItemId ? "is-selected" : ""}" data-menu-item-id="${item.id}">
              <div class="menu-admin-item-top">
                <div>
                  <h4>${item.name}</h4>
                  <p>${item.description}</p>
                </div>
                <strong>INR ${item.price}</strong>
              </div>
              <div class="menu-admin-badges">
                <span>${formatMenuSectionLabel(item.section_key)}</span>
                <span>${item.category}</span>
                <span>${item.is_active === false ? "Hidden" : "Visible"}</span>
                <span>Order ${item.display_order ?? 0}</span>
              </div>
              <div class="menu-admin-item-actions">
                <button class="ghost-btn edit-menu-item-btn" type="button" data-menu-item-id="${item.id}">
                  <i class="fa-solid fa-pen"></i>
                  Edit
                </button>
              </div>
            </article>
          `,
        )
        .join("")
    : '<article class="menu-admin-item"><h4>No menu items yet</h4><p>Add your first item to start building the cafe menu.</p></article>';
};

const fetchMenuItems = async () => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/menu_items?select=*&order=section_key.asc,display_order.asc,id.asc`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, "Could not load menu items."));
  }

  return response.json();
};

const saveMenuItem = async (payload) => {
  const itemId = menuItemId.value.trim();
  const endpoint = itemId
    ? `${SUPABASE_URL}/rest/v1/menu_items?id=eq.${itemId}`
    : `${SUPABASE_URL}/rest/v1/menu_items`;
  const method = itemId ? "PATCH" : "POST";

  const response = await fetch(endpoint, {
    method,
    headers: {
      ...authHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, "Could not save the menu item."));
  }

  const data = await response.json();
  return data[0] || null;
};

const deleteMenuItem = async (itemId) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${itemId}`, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
      Prefer: "return=minimal",
    },
  });

  if (!response.ok) {
    throw new Error(await parseSupabaseError(response, "Could not delete the menu item."));
  }
};

const buildMenuItemPayload = () => {
  const sectionKey = normalizeMenuSectionKey(menuItemSection.value);

  if (!sectionKey) {
    throw new Error("Enter a valid section name before saving.");
  }

  menuItemSection.value = sectionKey;

  return {
    section_key: sectionKey,
    category: menuItemCategory.value.trim(),
    name: menuItemName.value.trim(),
    description: menuItemDescription.value.trim(),
    price: Number(menuItemPrice.value),
    image_url: menuItemImageUrl.value.trim(),
    display_order: Number(menuItemDisplayOrder.value),
    is_active: menuItemIsActive.checked,
    updated_at: new Date().toISOString(),
  };
};

const refreshMenuItems = async ({ keepSelection = true } = {}) => {
  const items = await fetchMenuItems();
  allMenuItems = items;
  persistMenuCache(items);
  syncMenuSectionControls();

  if (keepSelection && selectedMenuItemId) {
    const selectedItem = allMenuItems.find((item) => item.id === selectedMenuItemId);
    populateMenuItemForm(selectedItem || null);
  } else {
    resetMenuItemForm();
  }

  renderMenuAdminList();
};

const showDashboard = () => {
  loginPanel.classList.add("hidden");
  dashboard.classList.remove("hidden");
  loginPanel.style.display = "none";
  dashboard.style.display = "block";
  requestAnimationFrame(() => {
    dashboard.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

const showLogin = () => {
  dashboard.classList.add("hidden");
  loginPanel.classList.remove("hidden");
  dashboard.style.display = "none";
  loginPanel.style.display = "grid";
  requestAnimationFrame(() => {
    loginPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

const formatCurrency = (value) => `INR ${value ?? 0}`;

const formatDate = (value) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const getStatusCounts = (orders) => {
  const counts = { total: orders.length, new: 0, preparing: 0, completed: 0 };

  orders.forEach((order) => {
    const status = order.status || "new";
    if (status === "new") counts.new += 1;
    if (status === "preparing") counts.preparing += 1;
    if (status === "completed") counts.completed += 1;
  });

  return counts;
};

const renderStats = (orders) => {
  const counts = getStatusCounts(orders);
  statTotal.textContent = counts.total;
  statNew.textContent = counts.new;
  statPreparing.textContent = counts.preparing;
  statCompleted.textContent = counts.completed;
};

const renderOrderCards = (orders, options = {}) =>
  orders
    .map((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const isArchived = Boolean(order.archived_at);
      const status = order.status || "new";
      const isFresh = freshOrderIds.has(String(order.id)) && !isArchived;
      const archivedMarkup = isArchived
        ? `<span><strong>Archived:</strong> ${formatDate(order.archived_at)}</span>`
        : "";

      return `
        <article class="order-card" data-id="${order.id}">
          <div class="order-top">
            <div>
              <h3 class="order-ref">#${order.id} - ${order.customer_name}</h3>
              <div class="order-meta">
                <span><strong>Placed:</strong> ${formatDate(order.created_at)}</span>
                <span><strong>Type:</strong> ${order.order_type}</span>
                <span><strong>Contact:</strong> ${order.customer_phone}</span>
                <span><strong>Payment:</strong> ${order.payment_method || "Cash"}</span>
                ${archivedMarkup}
              </div>
            </div>
            <div class="order-badge-stack">
              ${isFresh ? '<span class="order-fresh-badge">New Order</span>' : ""}
              <span class="order-badge status-${status}">${status}</span>
            </div>
          </div>

          <ul class="order-items">
            ${items
              .map(
                (item) =>
                  `<li>${item.name} x ${item.quantity} = ${formatCurrency(item.line_total)}</li>`,
              )
              .join("")}
          </ul>

          ${
            order.delivery_address
              ? `<p class="order-notes"><strong>Address:</strong> ${order.delivery_address}</p>`
              : ""
          }
          ${
            order.notes
              ? `<p class="order-notes"><strong>Notes:</strong> ${order.notes}</p>`
              : ""
          }

          <div class="order-footer">
            <div class="order-line">
              <span>Subtotal: ${formatCurrency(order.subtotal)}</span>
              <span>Delivery: ${formatCurrency(order.delivery_fee)}</span>
              <strong class="order-total">Total: ${formatCurrency(order.total)}</strong>
            </div>

            <div class="order-actions">
              <a class="order-call-btn" href="tel:${order.customer_phone}">
                <i class="fa-solid fa-phone"></i>
                Call
              </a>
              ${
                options.archived
                  ? ""
                  : `
                    <button
                      class="status-btn ${order.status === "preparing" ? "is-active" : ""}"
                      type="button"
                      data-order-id="${order.id}"
                      data-status="preparing"
                    >
                      Preparing
                    </button>
                    <button
                      class="status-btn ${order.status === "completed" ? "is-active" : ""}"
                      type="button"
                      data-order-id="${order.id}"
                      data-status="completed"
                    >
                      Complete
                    </button>
                    <button
                      class="delete-btn"
                      type="button"
                      data-order-id="${order.id}"
                    >
                      <i class="fa-solid fa-box-archive"></i>
                      Delete
                    </button>
                  `
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");

const renderOrders = (orders) => {
  const activeOrders = orders.filter((order) => !order.archived_at);
  const archivedOrders = orders.filter((order) => order.archived_at);
  const baseOrders = currentView === "archived" ? archivedOrders : activeOrders;
  const searchTerm = ordersSearch?.value.trim().toLowerCase() || "";
  const visibleOrders = baseOrders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      String(order.id).includes(searchTerm) ||
      (order.customer_name || "").toLowerCase().includes(searchTerm) ||
      (order.customer_phone || "").toLowerCase().includes(searchTerm);
    const matchesStatus =
      selectedStatusFilter === "all" || (order.status || "new") === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  if (sectionEyebrow && sectionTitle && sectionCopy) {
    if (currentView === "archived") {
      sectionEyebrow.textContent = "Past Record";
      sectionTitle.textContent = "Archived Orders";
      sectionCopy.textContent = "Deleted orders are preserved here for future reference.";
    } else {
      sectionEyebrow.textContent = "Active Queue";
      sectionTitle.textContent = "Current Orders";
      sectionCopy.textContent = "Orders visible to staff right now.";
    }
  }

  archiveNavButton?.classList.toggle("hidden", currentView === "archived");
  liveNavButton?.classList.toggle("hidden", currentView !== "archived");

  ordersList.innerHTML = visibleOrders.length
    ? renderOrderCards(visibleOrders, { archived: currentView === "archived" })
    : `<article class="order-card"><p class="status-message">${
        currentView === "archived"
          ? "No archived orders match this search."
          : "No active orders match this search."
      }</p></article>`;

  renderStats(activeOrders);
};

const primeAudio = async () => {
  if (audioContext) return audioContext;

  const ContextClass = window.AudioContext || window.webkitAudioContext;
  if (!ContextClass) return null;

  audioContext = new ContextClass();
  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch {
      return null;
    }
  }

  return audioContext;
};

const playNewOrderAlert = async () => {
  const context = await primeAudio();
  if (!context) return;

  const now = context.currentTime;
  const notes = [880, 1174];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = now + index * 0.18;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.18);
  });
};

const syncFreshOrders = (orders) => {
  const activeOrders = orders.filter((order) => !order.archived_at);
  const activeIds = new Set(activeOrders.map((order) => String(order.id)));

  freshOrderIds.forEach((id) => {
    if (!activeIds.has(id)) {
      freshOrderIds.delete(id);
    }
  });

  activeOrders.forEach((order) => {
    if ((order.status || "new") !== "new") {
      freshOrderIds.delete(String(order.id));
    }
  });

  if (!hasLoadedOrders) {
    knownOrderIds = activeIds;
    hasLoadedOrders = true;
    return;
  }

  const newOrders = activeOrders.filter((order) => {
    const orderId = String(order.id);
    return !knownOrderIds.has(orderId) && (order.status || "new") === "new";
  });

  if (newOrders.length) {
    newOrders.forEach((order) => {
      freshOrderIds.add(String(order.id));
    });
    playNewOrderAlert().catch(() => {});
  }

  knownOrderIds = activeIds;
};

const authHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${adminSession.access_token}`,
  "Content-Type": "application/json",
});

const fetchOrders = async ({ silent = false } = {}) => {
  if (!silent) {
    setMessage(ordersMessage, "Loading orders...");
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  syncFreshOrders(data);
  allOrders = data;
  renderOrders(allOrders);
  if (!silent) {
    setMessage(ordersMessage, `${data.length} order(s) loaded.`);
  }
};

const updateOrderStatus = async (orderId, status) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
};

const archiveOrder = async (orderId) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      archived_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
};

const startOrdersPolling = () => {
  if (ordersPollTimer) {
    window.clearInterval(ordersPollTimer);
  }

  ordersPollTimer = window.setInterval(() => {
    if (!adminSession?.access_token) return;
    fetchOrders({ silent: true }).catch(() => {});
  }, ORDERS_POLL_INTERVAL_MS);
};

const stopOrdersPolling = () => {
  if (!ordersPollTimer) return;
  window.clearInterval(ordersPollTimer);
  ordersPollTimer = null;
};

const login = async (email, password) => {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.msg ||
        errorData?.error_description ||
        errorData?.error ||
        "Invalid email or password.",
    );
  }

  return response.json();
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "Signing in...");

  try {
    adminSession = await login(loginEmail.value.trim(), loginPassword.value);
    saveSession(adminSession);
    showDashboard();
    setMessage(loginMessage, "");
    setMessage(settingsMessage, "Loading business settings...");
    try {
      const siteSettingsRecord = await fetchSiteSettings();
      if (siteSettingsRecord) {
        const normalizedSettings = normalizeSiteSettings(siteSettingsRecord);
        updateActiveSiteSettings(normalizedSettings);
        persistSiteSettingsCache(normalizedSettings);
      }
      populateSettingsForm();
      setMessage(settingsMessage, "");
    } catch (error) {
      populateSettingsForm();
      setMessage(settingsMessage, error.message || "Could not load saved business settings.");
    }
    setMessage(menuMessage, "Loading menu items...");
    try {
      await refreshMenuItems({ keepSelection: false });
      setMessage(menuMessage, "");
    } catch (error) {
      allMenuItems = loadCachedMenu();
      syncMenuSectionControls();
      renderMenuAdminList();
      setMessage(menuMessage, error.message || "Could not load menu items.");
    }
    await fetchOrders();
    startOrdersPolling();
  } catch (error) {
    showLogin();
    setMessage(loginMessage, error.message || "Sign in failed.");
  }
});

refreshButton.addEventListener("click", async () => {
  try {
    await fetchOrders();
  } catch (error) {
    setMessage(ordersMessage, error.message || "Could not refresh orders.");
  }
});

logoutButton.addEventListener("click", () => {
  stopOrdersPolling();
  clearSession();
  closeSettingsModal();
  closeMenuModal();
  showLogin();
  ordersList.innerHTML = "";
  allOrders = [];
  allMenuItems = [];
  selectedMenuItemId = null;
  knownOrderIds = new Set();
  freshOrderIds = new Set();
  hasLoadedOrders = false;
  setMessage(loginMessage, "");
  setMessage(ordersMessage, "");
  setMessage(settingsMessage, "");
  setMessage(menuMessage, "");
});

settingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(settingsMessage, "Saving settings...");

  try {
    const savedRecord = await saveSiteSettings(buildSettingsPayload());
    if (!savedRecord) {
      throw new Error("Settings were not returned after save.");
    }

    const normalizedSettings = normalizeSiteSettings(savedRecord);
    updateActiveSiteSettings(normalizedSettings);
    persistSiteSettingsCache(normalizedSettings);
    populateSettingsForm();
    setMessage(settingsMessage, "Business settings saved.");
    window.setTimeout(() => {
      closeSettingsModal();
      setMessage(settingsMessage, "");
    }, 700);
  } catch (error) {
    setMessage(settingsMessage, error.message || "Could not save settings.");
  }
});

openMenuButton?.addEventListener("click", () => {
  openMenuModal();
});

closeMenuButton?.addEventListener("click", () => {
  closeMenuModal();
});

menuBackdrop?.addEventListener("click", () => {
  closeMenuModal();
});

menuSectionFilter?.addEventListener("change", () => {
  renderMenuAdminList();
});

menuItemSection?.addEventListener("blur", () => {
  menuItemSection.value = normalizeMenuSectionKey(menuItemSection.value);
});

addMenuItemButton?.addEventListener("click", () => {
  resetMenuItemForm();
  menuItemName?.focus();
  renderMenuAdminList();
});

menuAdminList?.addEventListener("click", (event) => {
  const editButton = event.target.closest(".edit-menu-item-btn");
  if (!editButton) return;

  const itemId = Number(editButton.dataset.menuItemId);
  const item = allMenuItems.find((entry) => entry.id === itemId);
  populateMenuItemForm(item || null);
  renderMenuAdminList();
  menuItemName?.focus();
});

menuItemForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(menuMessage, "Saving menu item...");

  try {
    await saveMenuItem(buildMenuItemPayload());
    await refreshMenuItems();
    setMessage(menuMessage, "Menu item saved.");
  } catch (error) {
    setMessage(menuMessage, error.message || "Could not save menu item.");
  }
});

deleteMenuItemButton?.addEventListener("click", async () => {
  const itemId = menuItemId.value.trim();
  if (!itemId) return;

  setMessage(menuMessage, "Deleting menu item...");

  try {
    await deleteMenuItem(itemId);
    await refreshMenuItems({ keepSelection: false });
    setMessage(menuMessage, "Menu item deleted.");
  } catch (error) {
    setMessage(menuMessage, error.message || "Could not delete menu item.");
  }
});

openSettingsButton?.addEventListener("click", () => {
  openSettingsModal();
});

closeSettingsButton?.addEventListener("click", () => {
  closeSettingsModal();
});

settingsBackdrop?.addEventListener("click", () => {
  closeSettingsModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsModal && !settingsModal.classList.contains("hidden")) {
    closeSettingsModal();
  }

  if (event.key === "Escape" && menuModal && !menuModal.classList.contains("hidden")) {
    closeMenuModal();
  }
});

archiveNavButton?.addEventListener("click", () => {
  currentView = "archived";
  fetchOrders().catch((error) => {
    setMessage(ordersMessage, error.message || "Could not load archived orders.");
  });
});

liveNavButton?.addEventListener("click", () => {
  currentView = "live";
  fetchOrders().catch((error) => {
    setMessage(ordersMessage, error.message || "Could not load live orders.");
  });
});

ordersSearch?.addEventListener("input", () => {
  renderOrders(allOrders);
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    selectedStatusFilter = chip.dataset.filter || "all";
    filterChips.forEach((item) => {
      item.classList.toggle("is-active", item === chip);
    });
    renderOrders(allOrders);
  });
});

ordersList.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest(".delete-btn");
  if (deleteButton) {
    const orderId = deleteButton.dataset.orderId;

    try {
      await archiveOrder(orderId);
      setMessage(ordersMessage, `Order #${orderId} moved to archived records.`);
      await fetchOrders();
    } catch (error) {
      setMessage(ordersMessage, error.message || "Could not archive order.");
    }

    return;
  }

  const button = event.target.closest(".status-btn");
  if (!button) return;

  const orderId = button.dataset.orderId;
  const status = button.dataset.status;

  try {
    await updateOrderStatus(orderId, status);
    setMessage(ordersMessage, `Order #${orderId} updated to ${status}.`);
    await fetchOrders();
  } catch (error) {
    setMessage(ordersMessage, error.message || "Could not update order.");
  }
});

const init = async () => {
  adminSession = loadSession();
  populateSettingsForm();
  allMenuItems = loadCachedMenu();
  syncMenuSectionControls();
  renderMenuAdminList();

  if (!adminSession?.access_token) {
    showLogin();
    return;
  }

  showDashboard();

  try {
    try {
      const siteSettingsRecord = await fetchSiteSettings();
      if (siteSettingsRecord) {
        const normalizedSettings = normalizeSiteSettings(siteSettingsRecord);
        updateActiveSiteSettings(normalizedSettings);
        persistSiteSettingsCache(normalizedSettings);
        populateSettingsForm();
      }
    } catch (error) {
      setMessage(settingsMessage, error.message || "Could not load saved business settings.");
    }
    try {
      await refreshMenuItems({ keepSelection: false });
    } catch (error) {
      setMessage(menuMessage, error.message || "Could not load menu items.");
    }
    await fetchOrders();
    startOrdersPolling();
  } catch {
    clearSession();
    stopOrdersPolling();
    showLogin();
    setMessage(loginMessage, "Session expired. Please sign in again.");
  }
};

document.addEventListener(
  "pointerdown",
  () => {
    primeAudio().catch(() => {});
  },
  { once: true },
);

init();
