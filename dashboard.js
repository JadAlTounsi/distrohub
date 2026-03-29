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

overviewBtn.addEventListener("click", () => {
    hideAll();
    overviewSection.style.display="block";
    overviewBtn.classList.add("active");
    title.textContent = "Dashboard Overview";
})

inventoryBtn.addEventListener("click", () => {
    hideAll();
    inventorySection.style.display="block";
    inventoryBtn.classList.add("active");
    title.textContent = "Inventory Management";
})

ordersBtn.addEventListener("click", () => {
    hideAll();
    ordersSection.style.display="block";
    ordersBtn.classList.add("active");
    title.textContent = "Order Management";
})

clientsBtn.addEventListener("click", () => {
    hideAll();
    clientsSection.style.display="block";
    clientsBtn.classList.add("active");
    title.textContent = "Client Management";
})

function loadOverview() {
    fetch('http://localhost:8000/api/inventory')
        .then(response => response.json())
        .then(data => {
            let sum = 0;
            let value = 0;
            const tbody = document.getElementById("low-stock-body");

            for (const item of data) {
                sum += item.quantity;
                value += item.price * item.quantity;

                const tr = document.createElement("tr");
                const tdProduct = document.createElement("td");
                const tdAvailable = document.createElement("td");

                if (item.quantity <= 10 && item.quantity >= 0) {
                    tdProduct.textContent = item.name;
                    tdAvailable.textContent = item.quantity;
                    tr.append(tdProduct, tdAvailable);
                    tbody.appendChild(tr);
                }
            }
            document.getElementById("total-items").textContent = sum;
            document.getElementById("value-amount").textContent = "$" + value;
        });

    fetch("http://localhost:8000/api/orders")
        .then(response => response.json())
        .then(data => {
            let active = 0;
            let overdue = 0;
            const tbody = document.getElementById("recent-orders-body");

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

                tbody.appendChild(tr);
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
loadOverview();

