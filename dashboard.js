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
    if (!ordersLoaded) {
        loadOrders();
        ordersLoaded = true;
    }
})

clientsBtn.addEventListener("click", () => {
    hideAll();
    clientsSection.style.display="block";
    clientsBtn.classList.add("active");
    title.textContent = "Client Management";
    location.hash = "clients";
    if (!clientsLoaded) {
        loadClients();
        clientsLoaded = true;
    }
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
                document.getElementById("value-amount").textContent = "$" + stringValue.toFixed(2) + "K";
            } else if (value >= 1000000) {
                document.getElementById("value-amount").textContent = "$" + stringValue.toFixed(2) + "M";
            } else {
                document.getElementById("value-amount").textContent = "$" + value;
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

                const tr = document.createElement("tr");
                
                const tdOrderId = document.createElement("td");
                const tdClient = document.createElement("td");
                const tdDate = document.createElement("td");
                const tdQuantity = document.createElement("td");
                const tdAmount = document.createElement("td");

                tdOrderId.textContent = order.order_id;
                tdClient.textContent = order.client_name;
                tdDate.textContent = new Date(order.order_date).toISOString().split("T")[0];
                tdQuantity.textContent = Number(order.total_quantity).toLocaleString() + " items";
                tdAmount.textContent = "$" + Number(order.total_amount).toLocaleString("en", options);

                tr.append(tdOrderId, tdClient, tdDate, tdQuantity, tdAmount);

                recent_orders_tbody.appendChild(tr);
            }
            document.getElementById("active-orders").textContent = active.toLocaleString();
            document.getElementById("overdue").textContent = overdue.toLocaleString();
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

function loadOrders() {
    fetch(`http://localhost:8000/api/orders`)
        .then(response => response.json())
        .then(data => {
            const ordersBody = document.getElementById("orders-body");

            for (const order of data) {
                const tr = document.createElement("tr");

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
                tdAmount.textContent = "$" + Number(order.total_amount).toLocaleString("en", options);
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
                    showConfirm("Delete Order #" + order.order_id, "Are you sure you want to delete this order for " + order.client_name + "?", () => {
                        deleteRow("orders", order.order_id, tr);
                    });
                });
                
                spanActionsEdit.addEventListener("click", () => {
                    showEdit(order, "orders", tr);
                });

                tdActions.append(spanActionsEdit, spanActionsDelete);

                tr.append(tdOrderId, tdClient, tdAmount, tdOrderDate, tdArrivalDate, tdOrderStatus, tdActions);
                ordersBody.appendChild(tr);
            }

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
                tdPrice.textContent = "$" + Number(item.price).toLocaleString("en", options);
                
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
                        deleteRow("inventory", item.product_id, tr);
                    });
                });
                
                spanActionsEdit.addEventListener("click", () => {
                    showEdit(item, "inventory", tr);
                });

                tr.append(tdProduct, tdQuantity, tdUnit, tdPrice, tdProductStatus, tdActions);
                productsBody.appendChild(tr);

            }

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

            fetch("http://localhost:8000/api/orders")
                .then(response => response.json())
                .then(orders => {
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

                        spanActionsEdit.className = "material-symbols-outlined edit-icon";
                        spanActionsDelete.className = "material-symbols-outlined delete-icon";

                        spanActionsEdit.textContent = "edit_square";
                        spanActionsDelete.textContent = "delete";

                        spanActionsDelete.addEventListener("click", () => {
                            showConfirm("Delete Client #" + client.client_id, "Are you sure you want to delete " + client.client_name + "?", () => {
                                deleteRow("clients", client.client_id, tr);
                            });
                        });
                        
                        spanActionsEdit.addEventListener("click", () => {
                            showEdit(client, "clients", tr);
                        });
                        
                        let balance = 0;
                        const clientOrders = orders.filter(order => order.client_id === client.client_id);
                        
                        for (const order of clientOrders) {
                            balance += Number(order.total_amount);
                        }

                        tdClient.textContent = client.client_name;
                        tdPhone.textContent = client.phone;
                        tdBalance.textContent = "$" + Number(balance).toLocaleString("en", options);
                        
                        tdActions.append(spanActionsEdit, spanActionsDelete);

                        tr.append(tdClient, tdPhone, tdBalance, tdActions);
                        clientsBody.appendChild(tr);
                    }
                });

            const addClientBtn = document.getElementById("add-client-btn");

            addClientBtn.addEventListener("click", () => {
                showAdd("client");
            });
        });
}

function deleteRow(endpoint, id, row) {

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
                row.cells[3].textContent = "$" + Number(inputProductPrice.value).toLocaleString("en", options);

            });
        }
    }

    if (section === "orders") {
        document.getElementById("edit-modal").style.display = "flex";
        document.getElementById("edit-header").textContent = "Edit Order";
        document.getElementById("edit-inputs").innerHTML = 
            `<input type="date" id="edit-arrival-date">
            <select name="statuses" id="statuses">
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
            </select>`;

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
                    inventoryLoaded = false;
                    loadInventory();
                    inventoryLoaded = true;
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
                        previewUnitPrice.textContent = "$" + Number(currentItem.price).toLocaleString("en", options);
                        previewTotal.textContent = "$" + Number(totalPrice).toLocaleString("en", options);
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
                        previewTotal.textContent = "$" + Number(totalPrice).toLocaleString("en", options);
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
                                tdUnitPrice.textContent = "$" + item.price;
                                tdTotal.textContent = "$" + Number(totalPrice).toLocaleString("en", options);
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
                    ordersLoaded = false;
                    loadOrders();
                    ordersLoaded = true;
                    inventoryLoaded = false;
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
                    clientsLoaded = false;
                    loadClients();
                    clientsLoaded = true;
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

function searchFilter(searchSection, bodyId, columnIndex) {
    searchSection.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.getElementById(bodyId).querySelectorAll("tr");
        rows.forEach(row => {
            const text = row.cells[columnIndex].textContent.toLowerCase();

            if (text.includes(searchTerm)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    });
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

searchFilter(searchProducts, "products-body", 0);
searchFilter(searchOrders, "orders-body", 1);
searchFilter(searchClients, "clients-body", 0);

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