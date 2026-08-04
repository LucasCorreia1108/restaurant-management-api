# Restaurant Management API

Backend completo para gestão de restaurante com atendimento de salão, cozinha e caixa.

## Stack

- NestJS + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- Socket.IO (tempo real)
- Swagger
- Docker / Docker Compose
- class-validator / class-transformer

## Perfis

| Role | Capacidades |
|------|-------------|
| **ADMIN** | Usuários, mesas, cardápio, relatórios |
| **WAITER** | Abrir mesa, pedidos, status, solicitar conta |
| **KITCHEN** | Fila de pedidos, PREPARING / READY |
| **CASHIER** | Conta da mesa, pagamentos, liberar mesa |

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose (recomendado)
- npm 10+

## Instalação rápida (Docker)

```bash
# Sobe PostgreSQL + API
docker compose up -d --build

# Aplique seed (com a API já rodando ou via container)
docker compose exec api npx prisma db seed
```

API: `http://localhost:3000/api`  
Swagger: `http://localhost:3000/docs`  
WebSocket: `ws://localhost:3000/realtime`

## Instalação local

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env

# 3. Subir apenas o PostgreSQL
docker compose up -d postgres

# 4. Migrations + Prisma Client
npx prisma migrate dev --name init
npx prisma generate

# 5. Seed (admin, garçom, cozinha, caixa, mesas e cardápio)
npm run db:seed

# 6. Desenvolvimento
npm run start:dev
```

## Usuários padrão (seed)

| Role | Email | Senha |
|------|-------|-------|
| ADMIN | admin@restaurant.com | Admin@123 |
| WAITER | waiter@restaurant.com | Waiter@123 |
| KITCHEN | kitchen@restaurant.com | Kitchen@123 |
| CASHIER | cashier@restaurant.com | Cashier@123 |

## Fluxo do pedido

1. Garçom autentica (`POST /api/auth/login`)
2. Abre mesa (`POST /api/tables/:id/open`)
3. Cria pedido (`POST /api/orders`)
4. Envia à cozinha (`POST /api/orders/:id/send-to-kitchen`) → evento `order.sent`
5. Cozinha inicia preparo (`POST /api/kitchen/orders/:id/preparing`) → `order.preparing`
6. Cozinha marca pronto (`POST /api/kitchen/orders/:id/ready`) → `order.ready`
7. Garçom entrega (`POST /api/orders/:id/deliver`) → `order.delivered`
8. Caixa consulta conta (`GET /api/payments/table/:tableId/bill`)
9. Caixa fecha pagamento (`POST /api/payments/table`) → `payment.completed` + mesa `FREE`

## Eventos WebSocket (`/realtime`)

- `order.created`
- `order.sent`
- `order.preparing`
- `order.ready`
- `order.delivered`
- `order.closed`
- `payment.completed`
- `table.updated`

Exemplo (cliente):

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/realtime');
socket.on('order.sent', (order) => console.log('Novo pedido na cozinha', order));
socket.on('table.updated', (table) => console.log('Mesa atualizada', table));
```

## Regras de negócio

- **RN001** – Mesa ocupada exige garçom responsável
- **RN002** – Pedido pertence a uma mesa
- **RN003** – Pedido pertence a um garçom
- **RN004** – Não fecha conta com pedidos pendentes na cozinha
- **RN005** – Histórico completo de status em `order_status_history`
- **RN006** – Após pagamento a mesa volta para `FREE`
- **RN007** – Apenas cozinha altera `PREPARING` e `READY`
- **RN008** – Apenas caixa finaliza pagamento

## Principais endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login JWT |
| CRUD | `/api/users` | Gestão de usuários (ADMIN) |
| CRUD | `/api/tables` | Mesas |
| POST | `/api/tables/:id/open` | Abrir mesa |
| POST | `/api/tables/:id/request-bill` | Solicitar conta |
| CRUD | `/api/categories` | Categorias |
| CRUD | `/api/menu` | Cardápio |
| POST | `/api/orders` | Criar pedido |
| POST | `/api/orders/:id/send-to-kitchen` | Enviar à cozinha |
| GET | `/api/kitchen/queue` | Fila da cozinha |
| POST | `/api/kitchen/orders/:id/preparing` | Em preparo |
| POST | `/api/kitchen/orders/:id/ready` | Pronto |
| GET | `/api/payments/table/:id/bill` | Conta da mesa |
| POST | `/api/payments/table` | Pagar e liberar mesa |
| GET | `/api/reports/*` | Relatórios (ADMIN) |

Documentação interativa completa em `/docs`.

## Estrutura

```text
src/
├── auth
├── users
├── waiters
├── tables
├── menu
├── categories
├── orders
├── kitchen
├── payments
├── reports
├── websocket
├── common
└── prisma
```

## Scripts úteis

```bash
npm run start:dev      # API em watch mode
npm run build          # Build de produção
npm run prisma:studio  # UI do banco
npm run db:seed        # Popular dados iniciais
npm run db:reset       # Reset migrations + seed
```

## Licença

UNLICENSED — uso interno / educacional.
