# Task Shelter

## I like play on words

Task Shelter is a task management system that allows you to manage your tasks. It is currently incomplete, but when that changes you'll find this file updated.

> Assumptions:
>
> - You have node and yarn installed.
> - you have a postgresql server running locally
> - you have a user with the following permissions:
>   - create database
>   - create table
> - You have cloned this repository locally. This isn't a git tutorial, so I'm not going to go into detail about how to do that.

## I like to use yarn

I like to use yarn because the video game `Unraveled` is a yarn game that is graphically beautiful. Your mileage may vary.

## Installation

This is a monorepo, so you need to install the dependencies for the backend and frontend. This can be done by running the following command in the root of the project:

```bash
yarn install
```

## .env

`.env` files are not included in the repo, so you need to create your own. Sample files exist in the backend and frontend folders. Using bash you can copy the sample files to the current directory and then rename them to `.env` with the following command.

```bash
cd apps/backend
cp .env.sample .env
cd ../..
cd apps/frontend
cp .env.sample .env
```

Because you should setup your own .env file, I'm not going to go into detail about what each variable does. But I will say this:

- The .env file for the backend is used to setup the database connection for prisma. It also sets the port for the backend as well as the seed admin configuration. Probably delete the admin user creds after you've seeded the database. Nobody should leave that around in text files.

- The .env file for the frontend is used to setup the ports for the frontend and the URL of the backend.

## Running the application

This is a monorepo, so you need to run the backend and frontend. This can be done by running the following command:

```bash
yarn dev
```

If you're feeling adventurous, you can run the following command to run the backend alone without the frontend:

```bash
yarn dev:backend
```

If you're feeling even more adventurous, you can run the following command to run the frontend alone without the backend:

```bash
yarn dev:frontend
```

## A Brief Introduction to Prisma

I like to use Prisma because it's manages the database schema and provides a client for the database.

After installing the dependencies with yarn, you can run the following command to push the DB schema to the database you have configured in the .env file:

```bash
npx prisma db push
```

You also need to generate the Prisma client with the following command:

```bash
npx prisma generate
```

Using Prisma client means that we're relying on the ORM to manage the queries. Given performance concerns, we'll need to look into a more performant solution such as custom queries that remove the ORM layer.

## Seeding Data

You can seed data into the database with the following command:

```bash
yarn workspace backend seed
```

This will create a user in the database as specified in the .env file.
