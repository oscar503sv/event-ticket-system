import { Elysia } from 'elysia'

new Elysia()
    .get('/', 'Hello from Elysia')
    .get('/user/:id', ({ params: { id }}) => id)
    .listen(3000)