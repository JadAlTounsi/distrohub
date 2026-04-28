const overviewBtn = document.getElementById("overview");
const inventoryBtn = document.getElementById("inventory");
const ordersBtn = document.getElementById("orders");
const clientsBtn = document.getElementById("clients");
const overviewSection = document.getElementById("overview-section");
const inventorySection = document.getElementById("inventory-section");
const ordersSection = document.getElementById("orders-section");
const clientsSection = document.getElementById("clients-section");
const title = document.querySelector("#main-nav > h2");

function hideAll() {
    overviewSection.style.display="none";
    inventorySection.style.display="none";
    ordersSection.style.display="none";
    clientsSection.style.display="none";

    overviewBtn.classList.remove("active");
    inventoryBtn.classList.remove("active");
    ordersBtn.classList.remove("active");
    clientsBtn.classList.remove("active");
}

let inventoryLoaded = false;
let ordersLoaded = false;
let clientsLoaded = false;

overviewBtn.addEventListener("click", () => {
    hideAll();
    overviewSection.style.display="block";
    overviewBtn.classList.add("active");
    title.textContent = "Dashboard Overview";
    location.hash = "overview";
})

inventoryBtn.addEventListener("click", () => {
    hideAll();
    inventorySection.style.display="block";
    inventoryBtn.classList.add("active");
    title.textContent = "Inventory Management";
    location.hash = "inventory";
    if (!inventoryLoaded) {
        loadInventory();
        inventoryLoaded = true;
    }
})

ordersBtn.addEventListener("click", () => {
    hideAll();
    ordersSection.style.display="block";
    ordersBtn.classList.add("active");
    title.textContent = "Order Management";
    location.hash = "orders";
})

clientsBtn.addEventListener("click", () => {
    hideAll();
    clientsSection.style.display="block";
    clientsBtn.classList.add("active");
    title.textContent = "Client Management";
    location.hash = "clients";
})



function loadOverview() {
    fetch('http://localhost:8000/api/inventory')
        .then(response => response.json())
        .then(data => {
            let sum = 0;
            let value = 0;

            const low_stock_tbody = document.getElementById("low-stock-body");
            const products_tbody = document.getElementById("products-body");

            for (const item of data) {
                sum += item.quantity;
                value += item.price * item.quantity;
                
                const tr = document.createElement("tr");
                const tdProduct = document.createElement("td");
                const tdAvailable = document.createElement("td");
                
                const tdUnit = document.createElement("td");
                const tdPrice = document.createElement("td");
                const tdProductStatus = document.createElement("td");

                if (item.quantity <= 10 && item.quantity >= 0) {
                    tdProduct.textContent = item.name;
                    tdAvailable.textContent = item.quantity;
                    tr.append(tdProduct, tdAvailable);
                    low_stock_tbody.appendChild(tr);
                }

                tdUnit.textContent = item.unit;
                tdPrice.textContent = item.price;
                
            }

            let stringValue = value.toString() / 1000;

            if (value > 1000 && value < 1000000) {
                document.getElementById("value-amount").textContent = "$" + stringValue.toFixed(2) + "K";
            } else if (value >= 1000000) {
                document.getElementById("value-amount").textContent = "$" + stringValue.toFixed(2) + "M";
            } else {
                document.getElementById("value-amount").textContent = "$" + value;
            }

            document.getElementById("total-items").textContent = sum;

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

                const tr = document.createElement("tr");
                
                const tdOrderId = document.createElement("td");
                const tdClient = document.createElement("td");
                const tdDate = document.createElement("td");
                const tdQuantity = document.createElement("td");
                const tdAmount = document.createElement("td");

                tdOrderId.textContent = order.order_id;
                tdClient.textContent = order.client_name;
                tdDate.textContent = new Date(order.order_date).toISOString().split("T")[0];
                tdQuantity.textContent = order.total_quantity + " items";
                tdAmount.textContent = "$" + order.total_amount;

                tr.append(tdOrderId, tdClient, tdDate, tdQuantity, tdAmount);

                recent_orders_tbody.appendChild(tr);
            }
            document.getElementById("active-orders").textContent = active;
            document.getElementById("overdue").textContent = overdue;
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
            document.getElementById("total-clients").textContent = clients;
            document.getElementById("total-new-clients").textContent = newClients;
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
                tdQuantity.textContent = item.quantity;
                tdUnit.textContent = item.unit;
                tdPrice.textContent = item.price;
                
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
                    showConfirm("Delete Confirmation", "Are you sure you want to delete " + item.name + "?", () => {
                        deleteProduct(item.product_id, tr);
                    });
                });
                
                spanActionsEdit.addEventListener("click", () => {
                    showEdit(item, "inventory");
                });

                tr.append(tdProduct, tdQuantity, tdUnit, tdPrice, tdProductStatus, tdActions);
                productsBody.appendChild(tr);

            }
        });
}

function deleteProduct(id, row) {

    fetch(`http://localhost:8000/api/inventory/${id}`, {
        method: "DELETE"
    })
    .then(response => response.json())
    .then(() => {
        row.remove();
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

function showEdit(data, section) {
    if (section === "inventory") {
        document.getElementById("edit-modal").style.display = "flex";
        document.getElementById("edit-header").textContent = "Edit Product";
        document.getElementById("edit-inputs").innerHTML = 
            `<input type="text" id="edit-name" placeholder="Product Name">
            <input type="number" id="edit-quantity" placeholder="Quantity">
            <input type="text" id="edit-unit" placeholder="Unit">
            <input type="number" id="edit-price" placeholder="Price">`;
        
        document.getElementById("edit-name").value = data.name;
        document.getElementById("edit-quantity").value = data.quantity;
        document.getElementById("edit-unit").value = data.unit;
        document.getElementById("edit-price").value = data.price;

        document.getElementById("edit-save").onclick = () => {
            fetch(`http://localhost:8000/api/inventory/${data.product_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: document.getElementById("edit-name").value,
                    quantity: document.getElementById("edit-quantity").value,
                    unit: document.getElementById("edit-unit").value,
                    price: document.getElementById("edit-price").value
                })
            })
            .then(response => response.json())
            .then(() => {
                closeEdit();
                document.getElementById("products-body").innerHTML = "";
                inventoryLoaded = false;
                loadInventory();
                inventoryLoaded = true;
            });
        }
    }

    document.getElementById("edit-cancel").onclick = () => {
        closeEdit();
    };
}

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