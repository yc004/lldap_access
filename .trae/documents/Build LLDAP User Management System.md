I have analyzed your requirements and the current empty environment. I propose a full-stack solution using **React (Frontend)** and **Node.js (Backend)** to build a modern, responsive, and secure LLDAP User Management System.

Here is the implementation plan:

## 1. Project Initialization & Architecture
- **Structure**: Monorepo-style with `client` and `server` directories.
- **Tech Stack**:
    - **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI (for modern components), Framer Motion (for animations), React Query (for state management).
    - **Backend**: Node.js, Express, TypeScript, `ldap-ts` (for safe LDAP interaction), `jsonwebtoken` (JWT), `multer` (CSV handling).
- **Environment**: Setup `docker-compose.yml` for local LLDAP development testing.

## 2. Backend Development (Server)
- **Core Setup**: Configure Express with TypeScript, Security Middleware (Helmet, CORS, Rate Limit).
- **LDAP Integration**: Implement a robust LDAP Service class to handle connection, binding, and error handling.
- **Auth Module**: Login endpoint (LDAP Bind), JWT issuance, 2FA verification (TOTP).
- **User Module**: Endpoints for getting profile, updating info, changing password (with strength/history checks).
- **Admin Module**:
    - **User Management**: CRUD operations for users.
    - **Batch Operations**: CSV parsing and bulk LDAP execution queues.
    - **Search**: Advanced LDAP filter generation.

## 3. Frontend Development (Client)
- **Foundation**: Setup Router, Auth Context (User/Admin roles), Global Theme.
- **UI Components**: Implement responsive layout, navigation sidebar, and reusable components (DataTables, Forms, Modals).
- **Modules**:
    - **Login/2FA**: Secure login page with 2FA prompt.
    - **User Portal**: "My Profile" (editable fields), "Security" (Password change, 2FA setup with QR code), "Activity Log".
    - **Admin Console**:
        - **User List**: Advanced table with pagination, sorting, and search builder.
        - **Batch Import**: CSV upload wizard with validation preview.
        - **Role/Group Management**: UI for managing LDAP groups.
- **UX**: Add loading skeletons, toast notifications (success/error), and page transitions using Framer Motion.

## 4. Security & Performance
- **Security**: Implement CSRF protection tokens, Input sanitization (Zod), Secure HTTP headers.
- **Performance**: Backend caching for heavy search queries, optimistic UI updates on frontend.

## 5. Testing & Quality Assurance
- **E2E Testing**: Setup Playwright for end-to-end flows (Login -> Change Password -> Admin Delete).
- **Unit Testing**: Jest for Backend logic (especially password validation and LDAP query builders).

I will start by setting up the project structure and installing the necessary dependencies.
