# To-Do API

API REST para gestión de tareas construida con **NestJS**, **PostgreSQL**, **Prisma**, **Redis** y **JWT**.
## Objetivo

Este proyecto implementa una API para gestionar tareas por usuario, incluyendo:
- Registro y login con JWT
- CRUD de tareas
- Protección de endpoints con autenticación
- Cache del listado de tareas usando Redis
- Invalidación de cache al crear, actualizar o eliminar tareas
- Documentación con Swagger
- Infraestructura local con Docker Compose



## Instalación

1. Instalar dependencias
```bash
  npm install
```
2. Levantar PostgreSQL y Redis
```bash
  docker compose up -d
```
3. Generar Prisma Client
```bash
  npx prisma generate
```
4. Ejecutar migraciones
```bash
  npx prisma migrate dev --name init
```
5. Levantar la aplicación
```bash
  npm run start:dev
```

## Endpoints
Auth

### POST /auth/register

Registrar usuario

```javascript
{
  "email": "test@test.com",
  "password": "123456"
}
```

### POST /auth/login

Iniciar sesión

```javascript
{
  "email": "test@test.com",
  "password": "123456"
}
```
## Tasks

Todos los endpoints de tareas requieren JWT.

### POST /tasks

Crear tarea

```javascript
{
  "title": "Primera tarea",
  "description": "Probando sistema",
  "status": "PENDING"
}
```

### GET /tasks

Listar tareas del usuario autenticado

Actualizar tarea

```javascript
{
  "status": "DONE"
}
```

### DELETE /tasks/:id

Eliminar tarea

Cache con Redis

El endpoint GET /tasks usa cache por usuario y por filtro de estado.

## Ejemplos de keys:

```tasks:user:{userId}:status:ALL ```

```tasks:user:{userId}:status:PENDING ```

```tasks:user:{userId}:status:IN_PROGRESS ```

```tasks:user:{userId}:status:DONE ```

La cache se invalida cuando el usuario:

- Crea una tarea
- Actualiza una tarea
- Elimina una tarea

## Decisiones técnicas
NestJS

Se utilizó una arquitectura modular separando responsabilidades en:

- auth
- tasks
- users
- prisma
- redis

Se eligió Prisma por su tipado fuerte, simplicidad en migraciones y buena integración con PostgreSQL.

Redis

Se cachea únicamente el listado de tareas por usuario, ya que es la operación de lectura más repetible del sistema. La invalidación ocurre en cada mutación para evitar inconsistencias.

JWT

Los endpoints de tareas están protegidos con JwtAuthGuard, garantizando que cada usuario solo pueda acceder a sus propios recursos.

###
```bash 
npm run start:dev 
```
```bash
npm run build 
```
```bash 
npm run start:prod 
```
```bash 
npx prisma generate 
```
```bash 
npx prisma migrate dev --name init 
```
