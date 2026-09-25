# Product Admin Dashboard

A product administration dashboard built with Next.js and React.

## Features

- User login and authentication
- Protected product dashboard
- View products
- View product details
- Create new products
- Edit existing products
- Delete products
- Product pagination
- Logout functionality
- Responsive user interface

## Tech Stack

- Next.js
- React
- JavaScript
- Tailwind CSS
- Axios
- REST API
- Git & GitHub

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/arun2002jakkaiyan/product-admin-dashboard.git

Open:

http://localhost:3000

Authentication

The application uses an authentication API to log users in.

After successful login, the authentication token is stored in local storage and is used to maintain the logged-in session.

What I Finished
 Next.js project setup
 Login page
 Authentication handling
 Protected products page
 Product listing
 Product pagination
 Product details page
 Create product page
 Edit product page
 Delete product functionality
 Logout functionality
 Axios API service
 Git repository setup
 GitHub repository setup
Development Choices

I separated API-related code into service files instead of placing API requests directly inside the page components.

Authentication logic was also separated into its own utility so that login, logout, and authentication checks can be reused throughout the application.

The product pages use Next.js routing so that product operations are organized into separate routes.

Problem I Faced

One problem I faced was handling authentication and protecting the product dashboard.

The application needed to prevent unauthenticated users from directly accessing the products page while also keeping the login state after refreshing the browser.

How I Fixed It

I stored the authentication token in localStorage.

When the login page loads, the application checks whether an authentication token already exists. If a valid token exists, the user is redirected to the products page.

The logout functionality removes the token from localStorage, which ends the local authentication session.

AI Assistance

I used AI during development to help with:

Debugging React and Next.js issues
Structuring authentication logic
Organizing API service files
Debugging Axios API errors
Improving component structure
Troubleshooting Git and GitHub workflow issues
Reviewing and improving code

I reviewed and tested the suggested changes before applying them to the project.

Author

Arun Jakkaiyan