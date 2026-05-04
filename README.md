# Bloom - Privacy-First Storytelling Platform

Welcome to the **Bloom** platform. This repository contains the source code for a privacy-first storytelling and community application built with Next.js, React, and MongoDB.

## Features

- **Anonymous Storytelling**: Share your thoughts, confessions, and stories under dynamically generated flower pseudonyms.
- **Privacy-First Design**: Auth tables are used strictly for session gating and are never linked to the content you create.
- **Automated Moderation**: A built-in intelligent moderation queue system to keep the community safe.
- **Rich User Interface**: Smooth, visually appealing design utilizing modern CSS practices and Framer Motion animations.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: MongoDB via Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: TailwindCSS & Custom CSS Tokens
- **Animations**: Framer Motion

## Structure

- `/app`: Next.js App Router definitions and top-level pages.
- `/src/frontend`: React components, UI elements, and styling.
- `/src/backend`: Prisma models, server actions, authentication, and moderation logic.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

