const overviewBtn = document.getElementById("overview");
const inventoryBtn = document.getElementById("inventory");
const ordersBtn = document.getElementById("orders");
const clientsBtn = document.getElementById("clients");
const overviewSection = document.getElementById("overview-section");
const inventorySection = document.getElementById("inventory-section");
const ordersSection = document.getElementById("orders-section");
const clientsSection = document.getElementById("clients-section");
const title = document.querySelector("#main-nav > h2");
const searchProducts = document.getElementById("search-input-products");
const searchOrders = document.getElementById("search-input-orders");
const searchClients = document.getElementById("search-input-clients");

const options = { minimumFractionDigits: 2, maximumFractionDigits: 2};

function hideAll() {
    overviewSection.style.display="none";
    inventorySection.style.display="none";
    ordersSection.style.display="none";
    clientsSection.style.display="none";

    overviewBtn.classList.remove("active");
    inventoryBtn.classList.remove("active");
    ordersBtn.classList.remove("active");
    clientsBtn.classList.remove("active");

    const mediaQuery = window.matchMedia("(max-width: 768px)");

    if (mediaQuery.matches) {
       sideBar.classList.toggle("open"); 
    }
}

const menuBtn = document.getElementById("menu-btn");
const sideBar = document.querySelector(".sidebar");
menuBtn.addEventListener("click", () => {
    sideBar.classList.toggle("open");
});

let inventoryLoaded = false;
let ordersLoaded = false;
let clientsLoaded = false;
let currentOrderTab = "active";

const TABLE_PAGE_SIZE = 15;
const TABLE_PAGE_WINDOW = 5;

let revenueChart = null;
let ordersChart = null;
let currentChartGranularity = "month";
let cachedOverviewOrders = [];
let chartActiveIndex = null;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = "#5b7490";

const CHART_GRID_COLOR = "rgba(173, 173, 175, 0.35)";
const CHART_Y_AXIS_WIDTH = 56;

const sharedCrosshairPlugin = {
    id: "sharedCrosshair",
    afterDraw(chart) {
        if (chartActiveIndex === null) return;
        const xScale = chart.scales.x;
        if (!xScale) return;

        const x = xScale.getPixelForValue(chartActiveIndex);
        const { top, bottom } = chart.chartArea;
        const ctx = chart.ctx;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(48, 70, 94, 0.35)";
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
    }
};

function applyActiveIndexToChart(chart, index) {
    if (!chart) return;

    if (index === null) {
        chart.setActiveElements([]);
    } else {
        chart.setActiveElements(chart.data.datasets.map((dataset, datasetIndex) => ({ datasetIndex, index })));
    }
    chart.update("none");
}

function setChartActiveIndex(index) {
    if (chartActiveIndex === index) return;
    chartActiveIndex = index;
    applyActiveIndexToChart(revenueChart, index);
    applyActiveIndexToChart(ordersChart, index);
}

function clearChartActiveIndex() {
    if (chartActiveIndex === null) return;
    chartActiveIndex = null;
    applyActiveIndexToChart(revenueChart, null);
    applyActiveIndexToChart(ordersChart, null);
}

function sharedTooltipOptions() {
    return {
        backgroundColor: "#30465e",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        titleFont: { family: "'Inter', sans-serif", size: 12, weight: "600" },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        caretSize: 5
    };
}

function fixedYAxisWidth(scale) {
    scale.width = CHART_Y_AXIS_WIDTH;
}

overviewBtn.addEventListener("click", () => {
    hideAll();
    overviewSection.style.display="block";
    overviewBtn.classList.add("active");
    title.textContent = "Dashboard Overview";
    location.hash = "overview";
    ordersLoaded = false;
    inventoryLoaded = false;
    clientsLoaded = false;

    overviewLoaded = refreshSection(overviewLoaded, ["recent-orders-body", "low-stock-body"], loadOverview);
})

inventoryBtn.addEventListener("click", () => {
    hideAll();
    inventorySection.style.display="block";
    inventoryBtn.classList.add("active");
    title.textContent = "Inventory Management";
    location.hash = "inventory";

    overviewLoaded = false;
    ordersLoaded = false;
    clientsLoaded = false;
    
    inventoryLoaded = refreshSection(inventoryLoaded, ["products-body"], loadInventory);
})

ordersBtn.addEventListener("click", () => {
    hideAll();
    ordersSection.style.display="block";
    ordersBtn.classList.add("active");
    title.textContent = "Order Management";
    location.hash = "orders";

    overviewLoaded = false;
    inventoryLoaded = false;
    clientsLoaded = false;

    ordersLoaded = refreshSection(ordersLoaded, ["orders-body"], loadOrders);
})

clientsBtn.addEventListener("click", () => {
    hideAll();
    clientsSection.style.display="block";
    clientsBtn.classList.add("active");
    title.textContent = "Client Management";
    location.hash = "clients";

    overviewLoaded = false;
    ordersLoaded = false;
    inventoryLoaded = false;

    clientsLoaded = refreshSection(clientsLoaded, ["clients-body"], loadClients); 
})



function loadOverview() {
    fetch('http://localhost:8000/api/inventory')
        .then(response => response.json())
        .then(data => {
            let sum = 0;
            let value = 0;

            const low_stock_tbody = document.getElementById("low-stock-body");

            for (const item of data) {
                sum += item.quantity;
                value += item.price * item.quantity;
                
                const tr = document.createElement("tr");
                const tdProduct = document.createElement("td");
                const tdAvailable = document.createElement("td");
                
                if (item.quantity <= 10 && item.quantity >= 0) {
                    tdProduct.textContent = item.name;
                    tdAvailable.textContent = Number(item.quantity).toLocaleString();
                    tr.append(tdProduct, tdAvailable);
                    low_stock_tbody.appendChild(tr);
                }
            }

            let stringValue = value.toString() / 1000;

            if (value > 1000 && value < 1000000) {
                document.getElementById("value-amount").textContent = `$${stringValue.toFixed(2)}K`;
            } else if (value >= 1000000) {
                document.getElementById("value-amount").textContent = `$${stringValue.toFixed(2)}M`;
            } else {
                document.getElementById("value-amount").textContent = `$${value}`;
            }

            document.getElementById("total-items").textContent = sum.toLocaleString();

        });

    fetch("http://localhost:8000/api/orders")
        .then(response => response.json())
        .then(data => {
            let active = 0;
            let overdue = 0;
            const recent_orders_tbody = document.getElementById("recent-orders-body");

            for (const order of data) {
                active += 1;

                const currDate = new Date();
                const arrivalDate = new Date(order.arrival_date);
                if (currDate > arrivalDate) {
                    overdue += 1;
                }
            }

            const recentOrders = data.slice(0, 10);
            for (const order of recentOrders) {
                const tr = document.createElement("tr");

                const tdOrderId = document.createElement("td");
                const tdClient = document.createElement("td");
                const tdDate = document.createElement("td");
                const tdQuantity = document.createElement("td");
                const tdAmount = document.createElement("td");

                tdOrderId.textContent = order.order_id;
                tdClient.textContent = order.client_name;
                tdDate.textContent = new Date(order.order_date).toISOString().split("T")[0];
                tdQuantity.textContent = `${Number(order.total_quantity).toLocaleString()} items`;
                tdAmount.textContent = `$${Number(order.total_amount).toLocaleString("en", options)}`;

                tr.append(tdOrderId, tdClient, tdDate, tdQuantity, tdAmount);

                recent_orders_tbody.appendChild(tr);
            }
            document.getElementById("active-orders").textContent = active.toLocaleString();
            document.getElementById("overdue").textContent = overdue.toLocaleString();

            cachedOverviewOrders = data;
            renderRevenueChart(cachedOverviewOrders, currentChartGranularity);
        });

    fetch("http://localhost:8000/api/clients")
        .then(response => response.json())
        .then(data => {
            let clients = 0;
            let newClients = 0;
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() -14);
            for (const client of data) {
                clients += 1;

                const clientJoinDate = new Date(client.join_date);
                if (clientJoinDate > twoWeeksAgo) {
                    newClients += 1;
                }
            }
            document.getElementById("total-clients").textContent = clients.toLocaleString();
            document.getElementById("total-new-clients").textContent = newClients.toLocaleString();
        });
}

function getBucketKey(date, granularity) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    if (granularity === "day") return `${year}-${month}-${day}`;

    if (granularity === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
    }

    if (granularity === "month") return `${year}-${month}`;

    return `${year}`;
}

function formatBucketLabel(key, granularity) {
    if (granularity === "day" || granularity === "week") {
        const label = new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (granularity === "week") {
            return `Week of ${label}`;
        }
        return label;
    }

    if (granularity === "month") {
        const [year, month] = key.split("-");
        return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }

    return key;
}

function stepBucket(date, granularity) {
    const next = new Date(date);
    if (granularity === "day") next.setDate(next.getDate() + 1);
    else if (granularity === "week") next.setDate(next.getDate() + 7);
    else if (granularity === "month") next.setMonth(next.getMonth() + 1);
    else next.setFullYear(next.getFullYear() + 1);
    return next;
}

function buildChartData(orders, granularity) {
    const now = new Date();
    let cutoff = null;

    if (granularity === "day") {
        cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 29);
    } else if (granularity === "week") {
        cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 83);
    }

    const relevantOrders = orders.filter(order => {
        if (order.status === "Cancelled") return false;
        if (cutoff && new Date(order.order_date) < cutoff) return false;
        return true;
    });

    if (relevantOrders.length === 0) {
        return { labels: [], revenue: [], counts: [] };
    }

    const buckets = new Map();
    for (const order of relevantOrders) {
        const key = getBucketKey(new Date(order.order_date), granularity);
        if (!buckets.has(key)) buckets.set(key, { revenue: 0, count: 0 });
        const bucket = buckets.get(key);
        bucket.revenue += Number(order.total_amount);
        bucket.count += 1;
    }

    const rangeStart = cutoff || new Date(Math.min(...relevantOrders.map(order => new Date(order.order_date))));

    const labels = [];
    const revenue = [];
    const counts = [];
    const seenKeys = new Set();

    let cursor = new Date(rangeStart);
    while (cursor <= now) {
        const key = getBucketKey(cursor, granularity);
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            labels.push(formatBucketLabel(key, granularity));
            const bucket = buckets.get(key);
            if (bucket) {
                revenue.push(Number(bucket.revenue.toFixed(2)));
                counts.push(bucket.count);
            } else {
                revenue.push(0);
                counts.push(0);
            }
        }
        cursor = stepBucket(cursor, granularity);
    }

    return { labels, revenue, counts };
}

function renderRevenueChart(orders, granularity) {
    const { labels, revenue, counts } = buildChartData(orders, granularity);

    if (revenueChart) revenueChart.destroy();
    if (ordersChart) ordersChart.destroy();
    chartActiveIndex = null;

    let sharedAnimation = { duration: 300 };
    if (prefersReducedMotion) {
        sharedAnimation = false;
    }
    const sharedInteraction = { mode: "index", intersect: false };
    const sharedTransitions = { active: { animation: { duration: 0 } } };
    const onHoverSync = (event, elements) => {
        if (elements.length > 0) {
            setChartActiveIndex(elements[0].index);
        }
    };

    revenueChart = new Chart(document.getElementById("revenue-chart"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                data: revenue,
                backgroundColor: "#30465e",
                hoverBackgroundColor: "#5b7490",
                borderRadius: 4,
                borderSkipped: false,
                maxBarThickness: 28
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: sharedAnimation,
            interaction: sharedInteraction,
            transitions: sharedTransitions,
            onHover: onHoverSync,
            layout: { padding: { top: 6 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...sharedTooltipOptions(),
                    callbacks: {
                        title: (items) => items[0].label,
                        label: (item) => `Revenue: $${Number(item.raw).toLocaleString("en", options)}`
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: CHART_GRID_COLOR, drawTicks: false },
                    ticks: {
                        padding: 8,
                        callback: (value) => {
                            if (value >= 1000) {
                                return `$${value / 1000}K`;
                            }
                            return `$${value}`;
                        }
                    },
                    afterFit: fixedYAxisWidth
                }
            }
        },
        plugins: [sharedCrosshairPlugin]
    });

    ordersChart = new Chart(document.getElementById("orders-chart"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                borderColor: "#008000",
                backgroundColor: "rgba(0, 128, 0, 0.08)",
                fill: true,
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "#008000",
                pointHoverBorderColor: "#ffffff",
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: sharedAnimation,
            interaction: sharedInteraction,
            transitions: sharedTransitions,
            onHover: onHoverSync,
            plugins: {
                legend: { display: false },
                tooltip: {
                    ...sharedTooltipOptions(),
                    callbacks: {
                        title: (items) => items[0].label,
                        label: (item) => {
                            if (item.raw === 1) {
                                return `${item.raw} order`;
                            }
                            return `${item.raw} orders`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    offset: true,
                    border: { display: false },
                    grid: { color: CHART_GRID_COLOR, drawTicks: false },
                    ticks: { maxRotation: 0, autoSkip: true, padding: 6 }
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: CHART_GRID_COLOR, drawTicks: false },
                    ticks: { padding: 8, precision: 0, maxTicksLimit: 3 },
                    afterFit: fixedYAxisWidth
                }
            }
        },
        plugins: [sharedCrosshairPlugin]
    });
}

function loadOrders() {
    fetch(`http://localhost:8000/api/orders`)
        .then(response => response.json())
        .then(data => {
            const ordersBody = document.getElementById("orders-body");

            for (const order of data) {
                const tr = document.createElement("tr");
                tr.dataset.statusGroup = getStatusGroup(order.status);

                const tdOrderId = document.createElement("td");
                const tdClient = document.createElement("td");
                const tdAmount = document.createElement("td");
                const tdOrderDate = document.createElement("td");
                const tdArrivalDate = document.createElement("td");
                const tdOrderStatus = document.createElement("td");
                const spanOrderStatus = document.createElement("span");
                const tdActions = document.createElement("td");
                const spanActionsEdit = document.createElement("span");
                const spanActionsDelete = document.createElement("span");

                tdOrderId.textContent = order.order_id;
                tdClient.textContent = order.client_name;
                tdAmount.textContent = `$${Number(order.total_amount).toLocaleString("en", options)}`;
                tdOrderDate.textContent = new Date(order.order_date).toISOString().split("T")[0];
                tdArrivalDate.textContent = new Date(order.arrival_date).toISOString().split("T")[0];
                spanOrderStatus.textContent = order.status;

                setOrderStatus(spanOrderStatus, order.status);

                tdOrderStatus.appendChild(spanOrderStatus);

                spanActionsEdit.className = "material-symbols-outlined edit-icon";
                spanActionsDelete.className = "material-symbols-outlined delete-icon";

                spanActionsEdit.textContent = "edit_square";
                spanActionsDelete.textContent = "delete";

                spanActionsDelete.addEventListener("click", () => {
                    showConfirm(`Delete Order #${order.order_id}`, `Are you sure you want to delete this order for ${order.client_name}?`, () => {
                        deleteRow("orders", order.order_id, tr, ordersFilter.apply);
                    });
                });

                spanActionsEdit.addEventListener("click", () => {
                    showEdit(order, "orders", tr);
                });

                tdActions.append(spanActionsEdit, spanActionsDelete);

                tr.append(tdOrderId, tdClient, tdAmount, tdOrderDate, tdArrivalDate, tdOrderStatus, tdActions);
                ordersBody.appendChild(tr);
            }

            ordersFilter.apply();

            const addOrderBtn = document.getElementById("add-order-btn");

            addOrderBtn.addEventListener("click", () => {
                showAdd("order");
            });
        });
}

function loadInventory() {
    fetch('http://localhost:8000/api/inventory')
        .then(response => response.json())
        .then(data => {
            const productsBody = document.getElementById("products-body");

            for (const item of data) {
                const tr = document.createElement("tr");

                const tdProduct = document.createElement("td");
                const tdQuantity = document.createElement("td");
                const tdUnit = document.createElement("td");
                const tdPrice = document.createElement("td");
                const tdProductStatus = document.createElement("td");
                const spanProductStatus = document.createElement("span");
                const tdActions = document.createElement("td");
                const spanActionsEdit = document.createElement("span");
                const spanActionsDelete = document.createElement("span");

                tdProduct.textContent = item.name;
                tdQuantity.textContent = item.quantity.toLocaleString();
                tdUnit.textContent = item.unit;
                tdPrice.textContent = `$${Number(item.price).toLocaleString("en", options)}`;
                
                if (item.quantity <= 0) {
                    spanProductStatus.textContent = "Out of Stock";
                    spanProductStatus.className = "status-out";
                } else if (item.quantity <= 10) {
                    spanProductStatus.textContent = "Low Stock";
                    spanProductStatus.className = "status-low";
                } else if (item.quantity <= 30) {
                    spanProductStatus.textContent = "Reorder Soon";
                    spanProductStatus.className = "status-reorder";
                } else {
                    spanProductStatus.textContent = "In Stock";
                    spanProductStatus.className = "status-good";
                }
                tdProductStatus.appendChild(spanProductStatus);
           
                spanActionsEdit.className = "material-symbols-outlined edit-icon";
                spanActionsDelete.className = "material-symbols-outlined delete-icon";

                spanActionsEdit.textContent = "edit_square";
                spanActionsDelete.textContent = "delete";

                tdActions.append(spanActionsEdit, spanActionsDelete);

                spanActionsDelete.addEventListener("click", () => {
                    showConfirm("Delete Confirmation", `Are you sure you want to delete ${item.name}?`, () => {
                        deleteRow("inventory", item.product_id, tr, inventoryFilter.apply);
                    });
                });

                spanActionsEdit.addEventListener("click", () => {
                    showEdit(item, "inventory", tr);
                });

                tr.append(tdProduct, tdQuantity, tdUnit, tdPrice, tdProductStatus, tdActions);
                productsBody.appendChild(tr);

            }

            inventoryFilter.apply();

            const addProductBtn = document.getElementById("add-product-btn");

            addProductBtn.addEventListener("click", () => {
                showAdd("product");
            });
        });
}

function loadClients() {
    fetch(`http://localhost:8000/api/clients`)
        .then(response => response.json())
        .then(data => {
            const clientsBody = document.getElementById("clients-body");

            for (const client of data) {
                const tr = document.createElement("tr");
                const tdClient = document.createElement("td");
                const tdPhone = document.createElement("td");
                const tdBalance = document.createElement("td");
                const tdActions = document.createElement("td");
                const spanActionsEdit = document.createElement("span");
                const spanActionsDelete = document.createElement("span");

                tdClient.textContent = client.client_name;
                tdPhone.textContent = client.phone;
                tdBalance.textContent = `$${Number(client.balance).toLocaleString("en", options)}`;

                spanActionsEdit.className = "material-symbols-outlined edit-icon";
                spanActionsDelete.className = "material-symbols-outlined delete-icon";

                spanActionsEdit.textContent = "edit_square";
                spanActionsDelete.textContent = "delete";

                spanActionsDelete.addEventListener("click", () => {
                    showConfirm(`Delete Client #${client.client_id}`,`Are you sure you want to delete ${client.client_name}?`, () => {
                        deleteRow("clients", client.client_id, tr, clientsFilter.apply);
                    });
                });

                spanActionsEdit.addEventListener("click", () => {
                    showEdit(client, "clients", tr);
                });

                tdActions.append(spanActionsEdit, spanActionsDelete);

                tr.append(tdClient, tdPhone, tdBalance, tdActions);
                clientsBody.appendChild(tr);
            }

            clientsFilter.apply();

            const addClientBtn = document.getElementById("add-client-btn");

            addClientBtn.addEventListener("click", () => {
                showAdd("client");
            });
        });
}

function deleteRow(endpoint, id, row, onSuccess) {

    fetch(`http://localhost:8000/api/${endpoint}/${id}`, {
        method: "DELETE"
    })
    .then(response => {
        if (response.status === 409) {
            return response.json().then(data => {
                showError(data.msg);
            });
        }
        return response.json().then(() => {
            row.remove();
            if (onSuccess) {
                onSuccess();
            }
        });
    });
}

function showConfirm(header, message, onConfirm) {
    document.getElementById("confirm-modal").style.display = "flex";
    document.getElementById("confirm-header").textContent = header;
    document.getElementById("confirm-message").textContent = message;
    
    document.getElementById("confirm-yes").onclick = () => {
        onConfirm();
        closeConfirm();
    };
    
    document.getElementById("confirm-no").onclick = () => {
        closeConfirm();
    };
}

function closeConfirm() {
    document.getElementById("confirm-modal").style.display = "none";
}

function closeEdit() {
    document.getElementById("edit-modal").style.display = "none";
}

function closeAdd() {
    document.getElementById("add-modal").style.display = "none";
}

function showEdit(data, section, row) {
    if (section === "inventory") {
        document.getElementById("edit-modal").style.display = "flex";
        document.getElementById("edit-header").textContent = "Edit Product";
        document.getElementById("edit-inputs").innerHTML = 
            `<div class="form-group">
                <h4>Product Name</h4>
                <input type="text" id="edit-name" placeholder="Product Name">
            </div>
            <div class="form-group">
                <h4>Quantity</h4>
                <input type="number" id="edit-quantity" placeholder="Quantity">
            </div>
            <div class="form-group">
                <h4>Unit</h4>
                <input type="text" id="edit-unit" placeholder="Unit">
            </div>
            <div class="form-group">
                <h4>Price</h4>
                <input type="number" id="edit-price" placeholder="Price">
            </div>`;
        
        const inputProductName = document.getElementById("edit-name");
        const inputProductQuantity = document.getElementById("edit-quantity");
        const inputProductUnit = document.getElementById("edit-unit");
        const inputProductPrice = document.getElementById("edit-price");

        inputProductName.value = data.name;
        inputProductQuantity.value = data.quantity;
        inputProductUnit.value = data.unit;
        inputProductPrice.value = data.price;

        
        noNegativeInput(inputProductQuantity);
        noDecimals(inputProductQuantity);
        removeLeadingZero(inputProductQuantity);

        noNegativeInput(inputProductPrice);
        removeLeadingZero(inputProductPrice);
        maxTwoDecimalPlaces(inputProductPrice);

        document.getElementById("edit-save").onclick = () => {
            fetch(`http://localhost:8000/api/inventory/${data.product_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: inputProductName.value,
                    quantity: inputProductQuantity.value,
                    unit: inputProductUnit.value,
                    price: inputProductPrice.value
                })
            })
            .then(response => response.json())
            .then(() => {
                closeEdit();

                data.name = inputProductName.value;
                data.quantity = inputProductQuantity.value;
                data.unit = inputProductUnit.value;
                data.price = inputProductPrice.value;

                row.cells[0].textContent = inputProductName.value;
                row.cells[1].textContent = Number(inputProductQuantity.value).toLocaleString();
                row.cells[2].textContent = inputProductUnit.value;
                row.cells[3].textContent = `$${Number(inputProductPrice.value).toLocaleString("en", options)}`;

            });
        }
    }

    if (section === "orders") {
        document.getElementById("edit-modal").style.display = "flex";
        document.getElementById("edit-header").textContent = "Edit Order";
        document.getElementById("edit-inputs").innerHTML =
            `<div class="form-group">
                <h4>Arrival Date</h4>
                <input type="date" id="edit-arrival-date">
            </div>
            <div class="form-group">
                <h4>Status</h4>
                <select name="statuses" id="statuses">
                    <option value="Pending">Pending</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>`;

        const inputArrivalDate = document.getElementById("edit-arrival-date");
        const inputStatus = document.getElementById("statuses");
        const spanStatus = document.querySelector("span");


        inputArrivalDate.value = data.arrival_date.split("T")[0];
        inputStatus.value = data.status;

        document.getElementById("edit-save").onclick = () => {
            fetch(`http://localhost:8000/api/orders/${data.order_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    arrival_date: inputArrivalDate.value,
                    status: inputStatus.value
                })
            })
            .then(response => response.json())
            .then(() => {
                closeEdit();
                
                data.arrival_date = inputArrivalDate.value;
                data.status = inputStatus.value;

                row.cells[4].textContent = inputArrivalDate.value;
                const spanStatus = row.cells[5].querySelector("span");
                spanStatus.textContent = inputStatus.value;
                setOrderStatus(spanStatus, inputStatus.value);

                row.dataset.statusGroup = getStatusGroup(inputStatus.value);
                ordersFilter.apply();
            });
        }
    }

    if (section === "clients") {
        document.getElementById("edit-modal").style.display = "flex";
        document.getElementById("edit-header").textContent = "Edit Client";
        document.getElementById("edit-inputs").innerHTML = 
             `<div class="form-group">
                <h4>Client</h4>
                <input type="text" id="edit-client-name" placeholder="Client Name">
            </div>
            <div class="form-group">
                <h4>Phone</h4>
                <input type="tel" id="edit-phone" pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}" placeholder="Phone">
            </div>`;
        document.getElementById("edit-phone").addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, "");

            if (value.length >= 7) {
                value = value.slice(0, 3) + value.slice(3, 6) + "-" + value.slice(6, 10);
            }
            if (value.length >= 4) {
                value = value.slice(0, 3) + "-" + value.slice(3);
            }

            e.target.value = value;
        });

        const inputClientName = document.getElementById("edit-client-name");
        const inputPhone = document.getElementById("edit-phone");

        inputClientName.value = data.client_name;
        inputPhone.value = data.phone;

        document.getElementById("edit-save").onclick = () => {
            fetch(`http://localhost:8000/api/clients/${data.client_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    client_name: inputClientName.value,
                    phone: inputPhone.value
                })
            })
            .then(response => response.json())
            .then(() => {
                closeEdit();
                
                data.client_name = inputClientName.value;
                data.phone = inputPhone.value;

                row.cells[0].textContent = inputClientName.value;
                row.cells[1].textContent = inputPhone.value;
            });
        }
    }

    document.getElementById("edit-cancel").onclick = () => {
        closeEdit();
    }
}

function showAdd(section) {
    document.getElementById("add-modal").style.display = "flex";

    if (section === "product") {
        document.getElementById("add-header").textContent = "Add Product";
        document.getElementById("add-buttons").className = "add-buttons-product";
        document.getElementById("add-inputs").innerHTML = 
            `<div class="form-group">
                <h4>Product Name</h4>
                <input type="text" id="add-name" placeholder="Product Name">
            </div>
            <div class="form-group">
                <h4>Quantity</h4>
                <input type="number" id="add-quantity" placeholder="Quantity">
            </div>
            <div class="form-group">
                <h4>Unit</h4>
                <input type="text" id="add-unit" placeholder="Unit">
            </div>
            <div class="form-group">
                <h4>Price</h4>
                <input type="number" id="add-price" placeholder="Price">
            </div>`;

        const addProductQuantity = document.getElementById("add-quantity");
        const addProductPrice = document.getElementById("add-price");

        noDecimals(addProductQuantity);
        removeLeadingZero(addProductQuantity);

        removeLeadingZero(addProductPrice);
        maxTwoDecimalPlaces(addProductPrice);

        document.getElementById("add-save").onclick = () => {
            const newProductName = document.getElementById("add-name").value;
            const newProductQuantity = document.getElementById("add-quantity").value;
            const newProductUnit = document.getElementById("add-unit").value;
            const newProductPrice = document.getElementById("add-price").value;

            fetch(`http://localhost:8000/api/inventory`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: newProductName,
                    quantity: newProductQuantity,
                    unit: newProductUnit,
                    price: newProductPrice
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        showError(data.msg);
                    });
                }
                return response.json().then(() => {
                    closeAdd();
                    document.getElementById("products-body").innerHTML = "";

                    loadInventory();
                });
            });
        }
    }

    if (section === "order") {
        document.getElementById("add-header").textContent = "Add Order";
        document.getElementById("add-buttons").className = "add-buttons-order";
        document.getElementById("add-inputs").innerHTML = 
            `<div class="form-group">
                <h4>Client</h4>
                <select name="select-clients" id="select-clients">
                    <option value="" disabled selected>Select a client</option>
                </select>
            </div>
            <div class="form-group">
                <h4>Arrival Date</h4>
                <input type="date" id="add-arrival-date">
            </div>

            <div class="form-group">
                <h4>Order Items</h4>
                <section id="items">
                    <table>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="items-body">
                            <tr id="input-row">
                                <td><select id="select-item"><option value="" disabled selected>Select an item</option></select></td>
                                <td><input type="number" id="input-quantity" placeholder="Quantity" disabled></td>
                                <td id="preview-unit-price"></td>
                                <td id="preview-total"></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </div>

            <div class="add-item">
                <span class="material-symbols-outlined">add</span>
                <button id="add-item-btn">Add Item</button>
            </div>

            <div class="total">
                <h3>Total Amount: $<span id="order-total"></span></h3>
            </div>`;
        
        const itemsBody = document.getElementById("items-body");

        const tr = document.createElement("tr");

        const tdItem = document.createElement("td");
        const tdQuantity = document.createElement("td");
        const tdUnitPrice = document.createElement("td");
        const tdTotal = document.createElement("td");
        const tdActions = document.createElement("td");

        const selectClients = document.getElementById("select-clients");
        const selectItem = document.getElementById("select-item");
        const previewUnitPrice = document.getElementById("preview-unit-price");
        const previewTotal = document.getElementById("preview-total");
        const inputQuantity = document.getElementById("input-quantity");

        const orderTotal = document.getElementById("order-total");

        let orderTotalAmount = 0;

        orderTotal.textContent = Number(orderTotalAmount).toLocaleString("en", options);

        fetch(`http://localhost:8000/api/clients`)
            .then(response => response.json())
            .then(data => {
                for (const client of data) {
                    const option = document.createElement("option")
                    option.value = client.client_id;
                    option.textContent = client.client_name;
                    selectClients.append(option);
                }
            });

        fetch(`http://localhost:8000/api/inventory`)
            .then(response => response.json())
            .then(data => {

                for (const item of data) {
                    if (item.quantity > 0) {
                        const option = document.createElement("option")
                        option.value = item.product_id;
                        option.textContent = item.name;
                        selectItem.append(option);
                    }
                }

                let currentItem = null;
                let totalPrice = 0;

                selectItem.addEventListener("change", () => {
                    currentItem = data.find(item => item.product_id == selectItem.value);
                    if (currentItem) {
                        inputQuantity.max = currentItem.quantity;
                        inputQuantity.disabled = false;
                        totalPrice = Number(inputQuantity.value) * currentItem.price;
                        previewUnitPrice.textContent = `$${Number(currentItem.price).toLocaleString("en", options)}`;
                        previewTotal.textContent = `$${Number(totalPrice).toLocaleString("en", options)}`;
                    }
                });

                inputQuantity.addEventListener("input", () => {
                    removeLeadingZero(inputQuantity);
                    if (currentItem) {
                        if (Number(inputQuantity.value) > currentItem.quantity) {
                            inputQuantity.value = currentItem.quantity;
                        }
                        if (Number(inputQuantity.value) < 0) {
                            inputQuantity.value = 0;
                        }
                        totalPrice = Number(inputQuantity.value) * currentItem.price;
                        previewTotal.textContent = `$${Number(totalPrice).toLocaleString("en", options)}`;
                    }
                });

                noNegativeInput(inputQuantity);
                noDecimals(inputQuantity);

            });

        let itemsAdded = [];
        document.getElementById("add-item-btn").onclick = () => {
            let skipReset = false;
            fetch(`http://localhost:8000/api/inventory`)
                .then(response => response.json())
                .then(data => {
                    if (!selectItem.value) {
                        showError("Please select an item");
                        return;
                    }

                    if (!inputQuantity.value) {
                        showError("Please insert a valid quantity");
                        skipReset = true;
                        return;
                    }

                    const itemsBody = document.getElementById("items-body");
                    
                    const tr = document.createElement("tr");

                    const tdItem = document.createElement("td");
                    const tdQuantity = document.createElement("td");
                    const tdUnitPrice = document.createElement("td");
                    const tdTotal = document.createElement("td");
                    const tdActions = document.createElement("td");
                    const spanActionsDelete = document.createElement("span");

                    for (const item of data) {
                        if (item.product_id == selectItem.value) {
                            let totalPrice = inputQuantity.value*item.price;

                            if (!itemsAdded.some(addedItem => addedItem.product_id === item.product_id)) {
                                tdItem.textContent = item.name;
                                tdUnitPrice.textContent = `$${item.price}`;
                                tdTotal.textContent = `$${Number(totalPrice).toLocaleString("en", options)}`;
                                tdQuantity.textContent = Number(inputQuantity.value).toLocaleString();

                                spanActionsDelete.className = "material-symbols-outlined delete-icon";
                                spanActionsDelete.textContent = "delete";

                                tdActions.append(spanActionsDelete);
                                
                                tr.append(tdItem, tdQuantity, tdUnitPrice, tdTotal, tdActions);
                                
                                itemsBody.appendChild(tr);
                                
                                inputQuantity.disabled = true;
                                
                                itemsAdded.push({
                                    product_id: item.product_id,
                                    order_quantity: parseInt(inputQuantity.value),
                                    unit_price: item.price
                                });

                                orderTotalAmount += totalPrice;

                            } else {
                                showError("Item already added");
                            }
                            orderTotal.textContent = Number(orderTotalAmount).toLocaleString("en", options);

                            spanActionsDelete.addEventListener("click", () => {
                                tr.remove();
                                const index = itemsAdded.findIndex(addedItem => addedItem.product_id === item.product_id);
                                if (index > -1) {
                                    const itemRemoved = itemsAdded[index];
                                    const amountRemoved = itemRemoved.unit_price * itemRemoved.order_quantity;
                                    itemsAdded.splice(index, 1);
                                    orderTotalAmount = (orderTotalAmount - amountRemoved);
                                    orderTotal.textContent = Number(orderTotalAmount).toLocaleString("en", options);
                                }
                            });
                        }
                    }

                    inputQuantity.value = "";
                    selectItem.value = ""; 
                    if (!skipReset) {
                        previewUnitPrice.textContent = "";
                        previewTotal.textContent = "";
                        skipReset = false;
                    }
                });
        }
        
        document.getElementById("add-save").onclick = () => {

            fetch(`http://localhost:8000/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    client_id: document.getElementById("select-clients").value,
                    arrival_date: document.getElementById("add-arrival-date").value,
                    items: itemsAdded
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        showError(data.msg);
                    });
                }
                return response.json().then(() => {
                    closeAdd();
                    document.getElementById("orders-body").innerHTML = "";

                    loadOrders();
                });
            });
        }
    }

    if (section === "client") {
        document.getElementById("add-header").textContent = "Add Client";
        document.getElementById("add-buttons").className = "add-buttons-client";
        document.getElementById("add-inputs").innerHTML = 
            `<div class="form-group">
                <h4>Client</h4>
                <input type="text" id="add-client-name" placeholder="Client Name">
            </div>
            <div class="form-group">
                <h4>Phone</h4>
                <input type="tel" id="add-phone" pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}" placeholder="Phone">
            </div>`;
        
        document.getElementById("add-phone").addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, "");

            if (value.length >= 7) {
                value = value.slice(0, 3) + value.slice(3, 6) + "-" + value.slice(6, 10);
            }
            if (value.length >= 4) {
                value = value.slice(0, 3) + "-" + value.slice(3);
            }

            e.target.value = value;
        });

        document.getElementById("add-save").onclick = () => {
            const newClientName = document.getElementById("add-client-name").value;
            const newClientPhone = document.getElementById("add-phone").value;

            fetch(`http://localhost:8000/api/clients`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    client_name: newClientName,
                    phone: newClientPhone
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        showError(data.msg);
                    });
                }
                return response.json().then(() => {
                    closeAdd();
                    document.getElementById("clients-body").innerHTML = "";

                    loadClients();
                });
            });
        }
    }

    document.getElementById("add-cancel").onclick = () => {
        closeAdd();
    }
}

function showError(msg) {
    const errorDiv = document.getElementById("error");
    errorDiv.textContent = msg;
    errorDiv.style.display = "block";
    setTimeout(() => {
        errorDiv.style.display = "none";
    }, 3000);
}

function setupPagedFilter(config) {
    const {
        searchInput,
        bodyId,
        columnIndices,
        rowFilter = () => true,
        paginationId,
        pageNumbersId,
        prevBtnId,
        nextBtnId,
        pageSize,
        pageWindow,
        noResultsColSpan
    } = config;

    let currentPage = 1;
    let totalPages = 1;

    function apply() {
        const searchTerm = searchInput.value.toLowerCase();
        const body = document.getElementById(bodyId);
        const existingNoResults = body.querySelector(".no-results-row");
        if (existingNoResults) {
            existingNoResults.remove();
        }

        const rows = Array.from(body.querySelectorAll("tr")).filter(row => !row.classList.contains("no-results-row"));

        const matchingRows = rows.filter(row => {
            const textMatch = columnIndices.some(col => row.cells[col].textContent.toLowerCase().includes(searchTerm));
            return textMatch && rowFilter(row);
        });

        rows.forEach(row => {
            if (!matchingRows.includes(row)) {
                row.style.display = "none";
            }
        });

        if (matchingRows.length === 0) {
            if (searchTerm !== "") {
                const tr = document.createElement("tr");
                const td = document.createElement("td");

                tr.classList.add("no-results-row");
                td.textContent = `Nothing found for ${searchTerm}`;
                td.colSpan = noResultsColSpan;
                tr.append(td);
                body.appendChild(tr);
            }

            currentPage = 1;
            totalPages = 1;
            renderPagination(0);
            return;
        }

        totalPages = Math.ceil(matchingRows.length / pageSize);
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        if (currentPage < 1) {
            currentPage = 1;
        }

        const startIndex = (currentPage - 1) * pageSize;
        const pageRows = matchingRows.slice(startIndex, startIndex + pageSize);

        matchingRows.forEach(row => {
            row.style.display = pageRows.includes(row) ? "" : "none";
        });

        renderPagination(totalPages);
    }

    function renderPagination(pages) {
        const pagination = document.getElementById(paginationId);
        const pageNumbers = document.getElementById(pageNumbersId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);

        if (pages === 0) {
            pagination.style.display = "none";
            return;
        }

        pagination.style.display = "flex";
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === pages;

        let start = Math.max(1, currentPage - Math.floor(pageWindow / 2));
        let end = Math.min(pages, start + pageWindow - 1);
        start = Math.max(1, end - pageWindow + 1);

        pageNumbers.innerHTML = "";
        for (let page = start; page <= end; page++) {
            const pageBtn = document.createElement("button");
            pageBtn.className = "page-number";
            if (page === currentPage) {
                pageBtn.classList.add("active-page");
            }
            pageBtn.textContent = page;
            pageBtn.addEventListener("click", () => {
                currentPage = page;
                apply();
            });
            pageNumbers.appendChild(pageBtn);
        }
    }

    searchInput.addEventListener("input", () => {
        currentPage = 1;
        apply();
    });

    document.getElementById(prevBtnId).addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage -= 1;
            apply();
        }
    });

    document.getElementById(nextBtnId).addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage += 1;
            apply();
        }
    });

    return {
        apply,
        resetAndApply() {
            currentPage = 1;
            apply();
        }
    };
}

function maxTwoDecimalPlaces(input) {
    input.addEventListener("keydown", (e) => {
        let value = input.value;
        if (value.includes(".")) {
            const decimals = value.split(".")[1];
            if (decimals && decimals.length >= 2 && e.key !== "Backspace" && e.key !== "Delete") {
                e.preventDefault();
            }
        }
    });
}

function removeLeadingZero(input) {
    input.addEventListener("input", () => {
        if (input.value !== input.value.replace(/^0+(?=\d)/, '')) {
            input.value = input.value.replace(/^0+(?=\d)/, '');
        }
    });
}

function noDecimals(input) {
    input.addEventListener("keydown", (e) => {
        if (e.key === ".") {
            e.preventDefault();
        }
    });
}

function noNegativeInput(input) {
    input.addEventListener("keydown", (e) => {
        if (e.key === "-") {
            e.preventDefault();
        }
    });
}

function getStatusGroup(status) {
    if (status === "Pending") {
        return "active";
    }
    return "archived";
}

function setOrderStatus(span, status) {
    status = span.textContent;
    if (status === "Delivered") {
        span.className = "status-delivered";
    }

    if (status === "Pending") {
        span.className = "status-pending";
    }

    if (status === "Cancelled") {
        span.className = "status-cancelled";
    }
}

function refreshSection(sectionLoaded, bodyIds, loadSection) {
    if (!sectionLoaded) {
        bodyIds.forEach(id => {
            document.getElementById(id).innerHTML = "";
        });
        loadSection();
        return true;
    }
    return sectionLoaded;
}

const inventoryFilter = setupPagedFilter({
    searchInput: searchProducts,
    bodyId: "products-body",
    columnIndices: [0],
    paginationId: "inventory-pagination",
    pageNumbersId: "inventory-page-numbers",
    prevBtnId: "inventory-prev-page",
    nextBtnId: "inventory-next-page",
    pageSize: TABLE_PAGE_SIZE,
    pageWindow: TABLE_PAGE_WINDOW,
    noResultsColSpan: 6
});

const clientsFilter = setupPagedFilter({
    searchInput: searchClients,
    bodyId: "clients-body",
    columnIndices: [0],
    paginationId: "clients-pagination",
    pageNumbersId: "clients-page-numbers",
    prevBtnId: "clients-prev-page",
    nextBtnId: "clients-next-page",
    pageSize: TABLE_PAGE_SIZE,
    pageWindow: TABLE_PAGE_WINDOW,
    noResultsColSpan: 4
});

const ordersFilter = setupPagedFilter({
    searchInput: searchOrders,
    bodyId: "orders-body",
    columnIndices: [0, 1],
    rowFilter: row => row.dataset.statusGroup === currentOrderTab,
    paginationId: "orders-pagination",
    pageNumbersId: "orders-page-numbers",
    prevBtnId: "orders-prev-page",
    nextBtnId: "orders-next-page",
    pageSize: TABLE_PAGE_SIZE,
    pageWindow: TABLE_PAGE_WINDOW,
    noResultsColSpan: 7
});

document.querySelectorAll(".order-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        currentOrderTab = tab.dataset.tab;
        document.querySelectorAll(".order-tab").forEach(t => t.classList.toggle("active-tab", t === tab));
        ordersFilter.resetAndApply();
    });
});

document.querySelectorAll(".chart-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        currentChartGranularity = tab.dataset.granularity;
        document.querySelectorAll(".chart-tab").forEach(t => t.classList.toggle("active-tab", t === tab));
        renderRevenueChart(cachedOverviewOrders, currentChartGranularity);
    });
});

document.getElementById("revenue-chart").addEventListener("mouseleave", clearChartActiveIndex);
document.getElementById("orders-chart").addEventListener("mouseleave", clearChartActiveIndex);

loadOverview();

const hash = location.hash.replace("#", "");
if (hash === "overview") {
    overviewBtn.click();
}
if (hash === "inventory") {
    inventoryBtn.click();
}
if (hash === "orders") {
    ordersBtn.click();
}
if (hash === "clients") {
    clientsBtn.click();
}