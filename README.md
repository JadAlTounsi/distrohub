# DistroHub
A wholesale distribution management platform for tracking inventory, orders, and client balances. Built for a distribution business to replace spreadsheets and paper ledgers with a single dashboard.

## Tech Stack
- Node.js/Express
- MySQL
- HTML/CSS
- JavaScript
- Azure
- Docker

## Status
Inventory, orders, and client tracking are in place, including transactional order placement that locks inventory rows to prevent overselling when orders come in at the same time.

Payment tracking, so client balances can actually go down once they pay, is yet to be implemented.

## Demo Sessions
Each visitor to thelive demo gets their own isolated dataset, seeded on first request and scoped to a session cookie, so you can create and delete freely without affecting anyone else. Idle sessions are cleared automatically.

## Getting Started
To run locally, you will need to have [Docker](https://www.docker.com/products/docker-desktop/) installed

To run:
```
cd server
docker compose up
```
Once its running, open http://localhost:8000 and it should take you to the landing page

To stop:
```
docker compose down
```
