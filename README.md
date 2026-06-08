# 🚀 NestJS API com Prisma (Projeto Educacional)

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

---

## 📚 Sobre o Projeto

Este projeto consiste no desenvolvimento de uma **API backend completa utilizando NestJS**, seguindo boas práticas modernas de engenharia de software.

Ele é utilizado como base prática nas aulas dos cursos técnicos do **IFSP – Campus Caraguatatuba**, com foco em:

- Arquitetura backend moderna
- Boas práticas com Node.js
- Estruturação profissional de APIs
- Uso de ORM (Prisma)
- Integração com banco de dados
- Execução em ambiente containerizado (Docker)

---

## 🎯 Objetivos de Aprendizado

- Construção de APIs REST com NestJS
- Arquitetura baseada em módulos, controllers e services
- Injeção de dependência
- Uso do Prisma ORM
- Validação de dados com DTOs e Pipes
- Autenticação com JWT
- Upload de arquivos
- Documentação automática com Swagger
- Testes automatizados com Jest
- Boas práticas (SOLID)

---

## 🧑‍🏫 Contexto Acadêmico

Projeto utilizado nas disciplinas:

- CARLPRO – Técnico de Informática Integrado ao Ensino Médio  
- CARBKE2 – Técnico em Informática para Internet  

📍 IFSP – Campus Caraguatatuba

---

## 🧰 Tecnologias

- Node.js 24.x
- NestJS
- TypeScript
- Prisma ORM
- Docker

---

## 🐳 Execução com Docker

```bash
docker compose up --build
```

Acesse: http://localhost:4000

---

## 🗄️ Banco de Dados

Configuração atual usa banco externo:

```env
DATABASE_URL=mysql://root:senha@host.docker.internal:3306/nome_do_banco
```

### Exemplo com MySQL no Docker

```yaml
services:
  db:
    image: mysql:8
    container_name: mysql-nest
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: nest_prisma
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Depois ajustar:

```env
DATABASE_URL=mysql://root:root@db:3306/nest_prisma
```

---

## 🛠️ Execução local

```bash
npm install
npm run start:dev
```

---

## 🧪 Testes

```bash
npm run test
npm run test:e2e
npm run test:cov
```

---

## 📖 Curso Base

NestJS Completo – Matheus Fraga  
https://www.udemy.com/course/nestjs-completo/

---

## 👨‍💻 Autor

Denny Paulista Azevedo Filho

---

## 📄 Licença

MIT
