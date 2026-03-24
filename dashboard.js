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