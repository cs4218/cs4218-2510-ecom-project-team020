# CS4218 Project - Virtual Vault
Milestone 1 CI Report: https://github.com/cs4218/cs4218-2510-ecom-project-team020/actions/runs/17570194597/job/49904621693

# Milestone 1
Milestone 1 CI Report: https://github.com/cs4218/cs4218-2510-ecom-project-team020/actions/runs/17570194597/job/49904621693

## Workload Distribution

**Tan Wee Kian, Justin @jyztintan**

AI Declaration: Unit tests files were generated with AI assistance but ALL test cases are refined and validated.
| Domain                 | File                                       | Description                                                                                                                                         |
| ---------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category Model         | `models/categoryModel.test.js`             | Category must have a unique name and slug; Slugs are consistently lower-cased.                                                                      |
| Category Controllers   | `controllers/categoryController.test.js`   | Category APIs return complete, correct data for list and single views; failures surface as proper errors.                                           |
| `useCategory` Hook     | `client/src/hooks/useCategory.test.js`     | App loads categories on start, shows empty state when none and handles API failure.                                                                 |
| Categories Page (UI)   | `client/src/pages/Categories.js`           | Users can see a accurate list of available categories.                                                                                              |
| Category Routes Wiring | `routes/categoryRoutes.test.js`            | Category endpoints are accessible and correctly mapped.                                                                                             |
| Payment Controller     | `controllers/paymentController.test.js`    | Shoppers can obtain a payment token; checkout total is correct; orders are created only on successful payment; failed payments handled gracefully.  |
| Cart Context           | `client/src/context/cart.test.js`          | Cart state persists across sessions, updates reliably, and safely handles empty/corrupt saved data.                                                 |
| Cart Page              | `client/src/pages/CartPage.test.js`        | Cart shows the right total, allows item removal, fetches payment token, and completes or aborts checkout appropriately.                             |
| Policy Page            | `client/src/pages/Policy.test.js`          | Privacy policy content is present and visible to users.                                                                                             |

**Gerald Ng Jun Xiang @geraldngjx**

AI Declaration: Unit tests files were generated with AI assistance but ALL test cases are refined and validated.
| Domain                        | File                                            | Description                                                                                                                                         |
| ----------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin Dashboard               | `client/src/pages/admin/AdminDashboard.test.js` | Admin dashboard displays correct user statistics, navigation elements, and handles authentication states properly.                                   |
| Admin Menu Component          | `client/src/components/AdminMenu.test.js`      | Admin navigation menu renders all administrative links correctly and maintains proper routing functionality.                                         |
| Category Form Component       | `client/src/components/Form/CategoryForm.test.js` | Category creation form validates input, handles submissions, and displays appropriate feedback for category management.                              |
| Create Category Page          | `client/src/pages/admin/CreateCategory.test.js` | Admin can create new categories with proper validation, error handling, and success notifications using pairwise combinatorial and decision tree testing. |
| Create Product Page           | `client/src/pages/admin/CreateProduct.test.js`  | Admin can create new products with comprehensive field validation, file uploads, and API integration using pairwise combinatorial and decision tree testing. |
| Update Product Page           | `client/src/pages/admin/UpdateProduct.test.js`  | Admin can update existing products with form pre-population, validation, deletion functionality using pairwise combinatorial testing.               |
| Category Controller (CUD)     | `controllers/categoryController.test.js`       | Create, Update, Delete category operations work correctly with proper error handling and data validation.                                            |
| Category Routes (CUD)         | `routes/categoryRoutes.test.js`               | Category create, update, delete endpoints are properly secured, mapped, and handle authentication requirements.                                      |

**Ritika Manish Joshi @rmj1405**

AI Declaration: Unit tests generated with AI assistance but were all curated, validated and refined by me.
| Domain                 | File                                       | Description                                                                                                                                         |
| ---------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| registerController        | `controllers/authController.test.js`             | Handles user registration, validating required fields and preventing duplicate accounts.                                                                |
| loginController   | `controllers/authController.test.js`   | Authenticates users by verifying credentials and issues a JWT token on success.                                           |
| forgotPasswordController    | `controllers/authController.test.js`     | Allows users to reset their password after verifying their identity and security answer.                                                |
| updateProfileController  | `controllers/authController.test.js`           | Updates user profile details, including password, with validation.                                                                                       |
| getOrdersController | `controllers/authController.test.js`            | Retrieves all orders placed by the authenticated user.                                                                        |
| getAllOrdersController     | `controllers/authController.test.js`    | Fetches all orders in the system for administrative review. |
| orderStatusController         | `controllers/authController.test.js`          | Updates the status of a specific order, validating input and permissions.                                                |
| orderModel         | `models/orderModel.test.js`          | Defines the schema for orders, enforcing required products, payment, buyer, and status tracking in the database.                                                |
| authMiddleware            | `middlewares/authMiddleware.test.js`        | Manages and provides authentication state across React components.                             |
| authHelper           | Integration tests are more appropriate and will be created in Milestone 2.      | Provides utility functions to securely hash passwords and verify user credentials using bcrypt.                          |
| Order Page            | `client/src/pages/Orders.test.js`        | Displays a user's order history and current orders, allowing status tracking and details view.                             |
| Profile Page            | `client/src/pages/Profile.test.js`        | Shows and allows editing of user profile information, including contact and password updates.                           |
| Register Page            | `client/src/pages/Register.test.js`        | Provides a registration form for new users with validation and error handling.                           |
| Home Page            | `client/src/pages/Homepage.test.js`        | Renders the main landing page with featured products, categories, and other content.
| Dashboard Page            | `client/src/pages/Dashboard.test.js`          | Displays user information and links to user's orders and profile update form.                                                                                          |
| Footer            | `client/src/pages/Footer.test.js`          | Shows site-wide footer with navigation links, contact info, and policy references.                                                                                    |
| AuthProvider          | `client/src/context/auth.test.js`          | Manages and provides authentication state across React components.                                                                                        |

**Alicia Yap @wapisai**

AI Declaration: Unit tests files were generated with AI assistance but ALL test cases are refined and validated.

| Domain                               | File                                                | Description                                                                                                                                                                 |
| ------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin Orders Page               | `client/src/pages/admin/AdminOrders.test.js`        | Verifies order fetching, status updates, payment outcomes, and graceful handling of API failures, empty data, and missing fields. Achieved 100% branch and line coverage.   |
| Products Page                    | `client/src/pages/admin/Products.test.js`           | Ensures product list renders in correct order, handles null/undefined entries safely, preserves slug formatting, validates layout, and handles API errors with stable UI.   |
| Users Page (Admin)               | `client/src/pages/admin/Users.test.js`              | Confirms correct layout with `Layout` and `AdminMenu`, validates heading and structure, prevents redundant renders, and ensures accessibility focus behavior.               |
| User Menu Component              | `client/src/components/UserMenu.test.js`            | Tests navigation structure, active state management by route, keyboard accessibility, and link correctness; covers boundary and structural validation cases.                |
| Private Route | `client/src/components/Routes/PrivateRoute.test.js` | Simulates multiple auth states: missing, valid, and invalid tokens. Validates redirect flow, API handling, cleanup after unmount, and race-condition branches.              |
| Header Component                 | `client/src/components/Header.test.js`              | Validates navigation visibility across auth states, category dropdown population, logout behavior, cart badge accuracy, and presence of search and brand elements.          |
| Footer Component                 | `client/src/components/Footer.test.js`              | Tests all footer navigation links (About, Contact, Policy), link routes, separators, accessibility, and static copyright.                                                   |
| Layout Component                 | `client/src/components/Layout.test.js`              | Verifies consistent rendering of `Header`, `Footer`, and `Toaster`; ensures proper `<Helmet>` metadata defaults and overrides.                                              |
| Product Controller (Backend)     | `controllers/productController.test.js`             | Exhaustively tests all CRUD operations and endpoints: search, filter, count, pagination, upload limits, and error handling using EP/BVA techniques.  |
| User Model (Backend)             | `models/userModel.test.js`                          | Checks schema paths, required fields, default values, trimming behavior, and data persistence within MongoDB; confirms model integrity under various conditions.            |


# Project Information 

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```
