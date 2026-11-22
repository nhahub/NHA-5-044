# Watch Heaven

Watch Heaven is a watch storefront and staff dashboard built with React, Vite, Tailwind CSS, and Express. Firebase Authentication handles sign-in. Cloud Firestore stores the product catalog, categories, and orders.

## Features

- Browse, search, filter, and sort watches. The cart is saved in the browser.
- Sign in for Cash on Delivery checkout and view your own order history.
- Manage products, prices, stock, and categories from the staff dashboard. Archived watches can be restored.
- Move orders through Pending, Processing, Shipped, and Delivered. Fulfillment and payment have separate statuses.

## Run locally with Firebase

You’ll need Node.js 22 or newer, a Firebase project with Cloud Firestore and Email/Password sign-in enabled, and the Google Cloud CLI for server credentials. Run the commands below in the project folder. On Windows, the examples use `npm.cmd` and `npx.cmd`. On macOS or Linux, use `npm` and `npx`.

1. Install dependencies. If this is your first setup, copy the environment template.

   ```powershell
   npm.cmd ci
   if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
   ```

2. In Firebase Console, open **Project settings → Your apps**, register or select your web app, and copy `apiKey`, `authDomain`, `projectId`, and `appId` into the matching `VITE_FIREBASE_` fields in `.env.local`. Under **Authentication → Sign-in method**, enable **Email/Password**. Use the project’s [Firestore rules](firestore.rules) to keep direct database access closed to the browser.

3. Sign in to Google Cloud with an account authorized to access the Firebase project. Replace `YOUR_FIREBASE_PROJECT_ID` with the project ID you used in `.env.local`.

   ```powershell
   gcloud auth application-default login --project YOUR_FIREBASE_PROJECT_ID
   ```

4. Seed Firestore and start the API. The seed imports watch and category data from [DummyJSON](https://dummyjson.com/docs/products). Subsequent runs skip the import once it has completed and preserve catalog edits.

   ```powershell
   npm.cmd run catalog:seed
   npm.cmd run server
   ```

5. Open a second terminal in the project folder and start Vite. Open the URL Vite prints.

   ```powershell
   npm.cmd run dev
   ```

The API listens on `127.0.0.1:3001` by default. Vite forwards `/api` requests to it. If the catalog fails to load, check that the API terminal is running and that the catalog seed completed for the same project. Keep server credentials outside the repository and out of `VITE_` variables.

## Accounts and staff access

| Page | Use |
| --- | --- |
| `/shop` | Browse products |
| `/register` and `/login` | Create an account or sign in |
| `/checkout` and `/orders` | Place an order and see its status |
| `/admin/login` | Sign in as staff |

To grant staff access, register the user and copy their **User UID** from **Firebase Console → Authentication → Users**. Run the grant command in a terminal with Firebase Admin credentials for the same project.

```powershell
npm.cmd run admin:role -- grant FIREBASE_UID
```

Have the user sign out, then sign in at `/admin/login` so Firebase issues a fresh token with the staff claim. To remove access, run `npm.cmd run admin:role -- revoke FIREBASE_UID`.

## Test with the Firebase emulators

Use Java 21 or newer and install the project dependencies first. Open three PowerShell terminals in the project folder. Use the same `demo-watch-heaven` project ID across the emulators, API, and frontend.

**Terminal 1**

```powershell
npx.cmd firebase-tools emulators:start --only auth,firestore --project demo-watch-heaven
```

**Terminal 2**

```powershell
$env:FIREBASE_PROJECT_ID = 'demo-watch-heaven'
$env:FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
$env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
npm.cmd run catalog:seed
npm.cmd run server
```

**Terminal 3**

```powershell
$env:VITE_FIREBASE_PROJECT_ID = 'demo-watch-heaven'
$env:VITE_FIREBASE_API_KEY = 'demo-api-key'
$env:VITE_FIREBASE_AUTH_DOMAIN = 'demo-watch-heaven.firebaseapp.com'
$env:VITE_FIREBASE_APP_ID = '1:1234567890:web:demo'
$env:VITE_FIREBASE_AUTH_EMULATOR_URL = 'http://127.0.0.1:9099'
npm.cmd run dev
```

Register a test customer and place a Cash on Delivery order. Check the total and order status in **Orders**. For a staff test, register a separate account in the emulator. Use another terminal with the same three Firebase variables as Terminal 2 to find its UID and grant the role. Replace `staff@example.test` with the address you registered.

```powershell
node --input-type=module -e "import { auth } from './server/firebase.js'; console.log((await auth.getUserByEmail(process.argv[1])).uid)" staff@example.test
npm.cmd run admin:role -- grant FIREBASE_UID
```

Sign in as test staff, edit a watch price, and confirm the shop and checkout reflect the change. Advance the test order and reload the customer’s order history to confirm the new status. Use `npm.cmd run build` to check the frontend build.

## How the app fits together

| Location | Purpose |
| --- | --- |
| [`src/`](src/) | React storefront, account pages, and staff dashboard |
| [`server/`](server/) | Express API, Firebase Admin setup, and catalog and staff scripts |
| [`firestore.rules`](firestore.rules) | Direct Firestore access rules |
| [`ORDER_SCHEMA.md`](ORDER_SCHEMA.md) | Example of the saved Cash on Delivery order shape |

The shop and checkout read the same Firestore catalog. The API verifies Firebase ID tokens for customer orders and checks staff permissions for admin actions. It calculates the total in USD cents and saves the order and stock reduction in one transaction. Order items retain their purchase-time names and prices.

Hero photo by [K8 on Unsplash](https://unsplash.com/photos/round-white-and-gold-colored-analog-watch-on-brown-stone-_2UmFU4WHNs).
