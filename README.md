# DistroHub
A wholesale distribution management platform for tracking inventory, orders, and client balances. Built for a distribution business to replace spreadsheets and paper ledgers with a single dashboard.

## Tech Stack
- Node.js/Express
- MySQL
- HTML/CSS
- JavaScript
- Docker

## Status
Basic inventory, orders, and client tracking are in place for the business side. Payment tracking, so client balances can actually go down once they pay, is yet to be implemented.

## Getting Started
To run locally, you will need to have [Docker](https://www.docker.com/products/docker-desktop/) installed

To run:
```
cd server
docker compose up
```
Once its running, open https://localhost:8000 and it should take you to the landing page

To stop:
```
docker compose down
```