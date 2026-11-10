
// TEMPORARY SAMPLE DATA (synthetic). Nothing here is saved permanently.
// Real data will come from the FastAPI backend (PostgreSQL) in the integration phase.
import { daysAgo } from '../utils/helpers'

const MANAGER_EMAIL = 'manager@knowflow.demo'
const EMPLOYEE_EMAIL = 'employee@knowflow.demo'

const member = (id, name, email, role, departing = false) => ({
  id,
  name,
  email,
  role,
  departing,
})

const doc = (id, sourceId, name, type, sizeKb, uploadedBy, ageInDays) => ({
  id,
  sourceId,
  name,
  type,
  sizeKb,
  uploadedBy,
  uploadedAt: daysAgo(ageInDays),
})

const item = (id, type, text, source) => ({ id, type, text, source })

// Creates synthetic demo journal entries using the employee journal structure.
const journal = (id, ageInDays, createdBy, data) => {
  const createdAt = new Date(
    Date.now() - ageInDays * 24 * 60 * 60 * 1000,
  ).toISOString()

  return {
    id: `demo-${id}`,
    date: createdAt.slice(0, 10),
    ...data,
    createdBy,
    createdAt,
  }
}

export const SAMPLE_PROJECTS = [
  {
    id: 'p-retail-payment',
    name: 'Retail Payment Application',
    description:
      'Payment gateway and refund workflow for the TechNova Solutions retail checkout. Currently in testing.',
    status: 'active',
    handoverStatus: 'awaiting_approval',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(1),
    members: [
      member('m1', 'Saurav Deore', MANAGER_EMAIL, 'Project Manager'),
      member('m2', 'Alex Moreno', 'alex@technova.demo', 'Developer', true),
      member('m3', 'Rohan Kulkarni', EMPLOYEE_EMAIL, 'Incoming Developer'),
      member('m4', 'Meera Joshi', 'meera@technova.demo', 'QA Engineer'),
      member('m5', 'Vikram Shah', 'vikram@technova.demo', 'DevOps Engineer'),
    ],
    journalEntries: [
      journal('retail-1', 1, 'Meera Joshi', {
        workSummary:
          'Performed checkout regression testing across successful payments, declined payments and duplicate payment attempts.',
        completedTasks:
          'Tested successful checkout flow\nVerified declined payment handling\nReported duplicate payment issue',
        decisions:
          'Duplicate payment prevention must be verified before production release.',
        blockers: 'Refund regression testing is blocked by intermittent refund API errors.',
        dependencies: 'Requires the developer team to resolve the refund API issue.',
        pendingTasks: 'Retest refunds and complete the final regression checklist.',
        nextSteps: 'Verify the refund fix and prepare the QA sign-off report.',
        evidence: 'Checkout regression test report and defect notes.',
      }),
      journal('retail-2', 3, 'Alex Moreno', {
        workSummary:
          'Worked on the refund API and tested refund requests for successful and failed transactions. Found intermittent errors during refund processing.',
        completedTasks:
          'Implemented refund request handling\nAdded refund response logging',
        decisions:
          'Refund requests should be linked to the original transaction ID for traceability.',
        blockers:
          'Intermittent refund API errors are occurring. The exact cause has not yet been confirmed.',
        dependencies: 'Requires stable refund API responses from the payment gateway.',
        pendingTasks: 'Investigate intermittent refund failures and complete refund API testing.',
        nextSteps: 'Review error logs and reproduce the issue with different transaction cases.',
        evidence: 'Refund API test logs and failure response records.',
      }),
      journal('retail-3', 5, 'Alex Moreno', {
        workSummary:
          'Completed the Razorpay payment gateway integration with the checkout workflow. Verified successful payment callbacks and transaction status updates.',
        completedTasks:
          'Integrated Razorpay checkout API\nImplemented payment success and failure callbacks\nAdded transaction status updates',
        decisions:
          'Razorpay was selected because the company already uses its integration and support ecosystem.',
        blockers: '',
        dependencies: 'Waiting for the production API credentials from the DevOps team.',
        pendingTasks: 'Complete production credential configuration.',
        nextSteps: 'Coordinate with DevOps and run end-to-end payment tests.',
        evidence: 'Payment integration test results and API integration notes.',
      }),
      journal('retail-4', 7, 'Vikram Shah', {
        workSummary:
          'Reviewed the deployment environment and configured payment service monitoring for testing.',
        completedTasks:
          'Reviewed environment variables\nConfigured payment service logs',
        decisions:
          'Payment failures should be logged with transaction IDs for easier investigation.',
        blockers: '',
        dependencies: 'Requires final production credentials.',
        pendingTasks: 'Complete production configuration review.',
        nextSteps: 'Coordinate deployment readiness with the project team.',
        evidence: 'Deployment configuration checklist.',
      }),
      journal('retail-5', 9, 'Alex Moreno', {
        workSummary:
          'Reviewed the payment integration architecture and documented the checkout and refund flow.',
        completedTasks:
          'Documented checkout workflow\nReviewed refund API integration',
        decisions:
          'Payment and refund operations should maintain separate transaction logs.',
        blockers: '',
        dependencies: 'Requires confirmation of the final refund API behavior.',
        pendingTasks: 'Update the technical documentation after refund testing.',
        nextSteps: 'Share the updated integration notes with the incoming developer.',
        evidence: 'Payment integration documentation.',
      }),
    ],
    documents: [
      doc('d1', 'S1', 'API Testing Report.pdf', 'PDF', 420, 'Alex Moreno', 3),
      doc('d2', 'S2', 'Payment Gateway Decision Note.docx', 'DOCX', 86, 'Alex Moreno', 9),
      doc('d3', 'S3', 'Deployment Checklist.pdf', 'PDF', 210, 'Vikram Shah', 12),
      doc('d4', 'S4', 'Sprint Update Week 12.docx', 'DOCX', 64, 'Saurav Deore', 5),
    ],
    knowledge: {
      summary:
        'Payment gateway integration is complete. Refund API testing is still pending and intermittent refund errors have no confirmed cause.',
      items: [
        item('k1', 'completed', 'Payment gateway integration is complete.', 'S1'),
        item('k2', 'pending', 'Refund API testing is pending.', 'S1'),
        item('k3', 'decision', 'Razorpay was selected because of existing company integration support.', 'S2'),
        item('k4', 'blocker', 'Intermittent refund errors. Cause unconfirmed, no fix recorded.', 'S1'),
        item('k5', 'question', 'Final production deployment date: no source found.', null),
      ],
    },
  },

  {
    id: 'p-customer-mgmt',
    name: 'Customer Management System',
    description: 'Internal CRM for tracking customer accounts, support tickets and renewals.',
    status: 'active',
    handoverStatus: 'awaiting_approval',
    createdAt: daysAgo(90),
    updatedAt: daysAgo(3),
    members: [
      member('m6', 'Saurav Deore', MANAGER_EMAIL, 'Project Manager'),
      member('m7', 'Neha Rao', 'neha@technova.demo', 'Developer'),
      member('m8', 'Karan Desai', 'karan@technova.demo', 'Developer'),
      member('m9', 'Isha Menon', 'isha@technova.demo', 'Designer'),
    ],
    journalEntries: [
      journal('crm-1', 2, 'Neha Rao', {
        workSummary:
          'Reviewed the renewal reminder workflow and identified missing email notification handling for upcoming contract renewals.',
        completedTasks:
          'Reviewed renewal date fields\nMapped reminder notification requirements',
        decisions:
          'Renewal reminders should be triggered before the contract expiry date.',
        blockers: '',
        dependencies: 'Email service configuration is required for notification testing.',
        pendingTasks: 'Implement renewal reminder emails and notification status tracking.',
        nextSteps: 'Coordinate with the backend team and test reminder scheduling.',
        evidence: 'Renewal workflow notes and requirements checklist.',
      }),
      journal('crm-2', 5, 'Karan Desai', {
        workSummary:
          'Updated the CRM database schema and added relationships between customer accounts, contacts and support tickets.',
        completedTasks:
          'Added customer contact relationship\nUpdated support ticket foreign keys\nReviewed database indexes',
        decisions:
          'Support tickets will reference a customer account ID instead of duplicating customer information.',
        blockers: 'Some existing test records have missing customer references.',
        dependencies: 'Requires cleaned test data before integration testing.',
        pendingTasks: 'Resolve missing references in the test dataset.',
        nextSteps: 'Run database migration tests and verify ticket relationships.',
        evidence: 'Database schema notes and migration test results.',
      }),
      journal('crm-3', 11, 'Neha Rao', {
        workSummary:
          'Completed the customer account listing and profile screens. Added search and filtering for customer records.',
        completedTasks:
          'Built customer listing screen\nImplemented customer profile view\nAdded customer search and filters',
        decisions:
          'Customer records are displayed with pagination to keep large account lists manageable.',
        blockers: '',
        dependencies: 'Requires the customer API to return consistent account status values.',
        pendingTasks: 'Connect the customer screens to the final API.',
        nextSteps: 'Test the listing and profile screens with real API responses.',
        evidence: 'CRM screen implementation and UI testing notes.',
      }),
      journal('crm-4', 18, 'Isha Menon', {
        workSummary:
          'Reviewed the CRM interface and prepared consistent layouts for customer profiles, account details and support ticket views.',
        completedTasks:
          'Reviewed customer profile layout\nPrepared support ticket screen design',
        decisions:
          'Customer contact information should be grouped separately from account-level information.',
        blockers: '',
        dependencies: 'Requires confirmation of the final customer data fields.',
        pendingTasks: 'Finalize the CRM component design after API field confirmation.',
        nextSteps: 'Review the layouts with the development team.',
        evidence: 'CRM interface design review.',
      }),
    ],
    documents: [
      doc('d5', 'S1', 'CRM Requirements.docx', 'DOCX', 120, 'Neha Rao', 20),
      doc('d6', 'S2', 'Database Schema Notes.md', 'MD', 18, 'Karan Desai', 14),
      doc('d7', 'S3', 'Release Notes v1.2.pdf', 'PDF', 150, 'Neha Rao', 6),
    ],
    knowledge: {
      summary: 'Core CRM screens are built. Renewal reminders are still pending.',
      items: [
        item('k6', 'completed', 'Customer account screens are complete.', 'S3'),
        item('k7', 'pending', 'Renewal reminder emails are not built yet.', 'S1'),
      ],
    },
  },

  {
    id: 'p-inventory',
    name: 'Inventory Management',
    description: 'Warehouse stock tracking with low-stock alerts and supplier purchase orders.',
    status: 'under_review',
    handoverStatus: 'awaiting_approval',
    createdAt: daysAgo(120),
    updatedAt: daysAgo(5),
    members: [
      member('m10', 'Saurav Deore', MANAGER_EMAIL, 'Project Manager'),
      member('m11', 'Aditya Pawar', 'aditya@technova.demo', 'Developer', true),
      member('m12', 'Meera Joshi', 'meera@technova.demo', 'QA Engineer'),
    ],
    journalEntries: [
      journal('inventory-1', 5, 'Meera Joshi', {
        workSummary:
          'Tested stock updates, low-stock thresholds and purchase order scenarios. Identified inconsistent stock values after repeated updates.',
        completedTasks:
          'Tested stock increase and decrease operations\nVerified low-stock threshold behavior\nRecorded stock synchronization defect',
        decisions:
          'Stock values must be validated after every successful inventory update.',
        blockers: 'Large purchase order synchronization remains unresolved.',
        dependencies: 'Requires a fix from the development team before final QA sign-off.',
        pendingTasks: 'Retest stock consistency and complete purchase order regression testing.',
        nextSteps: 'Verify the synchronization fix and prepare the QA summary.',
        evidence: 'Inventory QA findings and regression test notes.',
      }),
      journal('inventory-2', 15, 'Aditya Pawar', {
        workSummary:
          'Worked on supplier purchase order synchronization and tested order creation for different supplier responses.',
        completedTasks:
          'Implemented purchase order request mapping\nAdded supplier response logging',
        decisions:
          'Supplier responses should be logged with the purchase order ID for troubleshooting.',
        blockers:
          'Purchase order synchronization fails for large orders. The issue may be related to request size or supplier API limits.',
        dependencies: 'Requires clarification of supplier API limits and response behavior.',
        pendingTasks: 'Investigate large-order synchronization failures.',
        nextSteps: 'Test smaller order batches and review supplier API documentation.',
        evidence: 'Supplier API logs and QA findings.',
      }),
      journal('inventory-3', 30, 'Aditya Pawar', {
        workSummary:
          'Implemented low-stock monitoring for warehouse products. The system now identifies products that fall below their configured reorder levels.',
        completedTasks:
          'Implemented stock threshold checks\nAdded low-stock status indicators\nTested alert generation',
        decisions:
          'Each product will have its own configurable minimum stock threshold.',
        blockers: '',
        dependencies: 'Requires accurate stock quantities from the warehouse database.',
        pendingTasks: 'Add notification delivery for generated low-stock alerts.',
        nextSteps: 'Connect the alert service and test notification delivery.',
        evidence: 'Stock alert implementation and test cases.',
      }),
    ],
    documents: [
      doc('d8', 'S1', 'Stock Alert Design.pdf', 'PDF', 300, 'Aditya Pawar', 30),
      doc('d9', 'S2', 'Supplier API Notes.md', 'MD', 22, 'Aditya Pawar', 18),
      doc('d10', 'S3', 'QA Findings.docx', 'DOCX', 95, 'Meera Joshi', 8),
    ],
    knowledge: {
      summary: 'Low-stock alerts work. Supplier purchase order sync has an open blocker.',
      items: [
        item('k8', 'completed', 'Low-stock alert rules are implemented.', 'S1'),
        item('k9', 'blocker', 'Supplier purchase order sync fails for large orders.', 'S3'),
      ],
    },
  },

  {
    id: 'p-vendor-billing',
    name: 'Vendor Billing Portal',
    description: 'Portal for vendors to submit invoices and track payment status.',
    status: 'completed',
    handoverStatus: 'approved',
    createdAt: daysAgo(200),
    updatedAt: daysAgo(14),
    members: [
      member('m13', 'Saurav Deore', MANAGER_EMAIL, 'Project Manager'),
      member('m14', 'Rohan Kulkarni', EMPLOYEE_EMAIL, 'Developer'),
      member('m15', 'Isha Menon', 'isha@technova.demo', 'Designer'),
    ],
    journalEntries: [
      journal('billing-1', 14, 'Rohan Kulkarni', {
        workSummary:
          'Completed final integration testing and supported the project go-live. Reviewed the handover notes and confirmed the main invoice workflow.',
        completedTasks:
          'Verified invoice submission and tracking\nCompleted payment status integration tests\nPrepared go-live handover notes',
        decisions:
          'The completed portal will retain invoice PDFs for audit reference.',
        blockers: '',
        dependencies: 'No open technical dependency recorded for the completed release.',
        pendingTasks: 'Quarterly vendor report export remains a future enhancement.',
        nextSteps: 'Monitor the portal after release and collect vendor feedback.',
        evidence: 'Go-live report and final integration test results.',
      }),
      journal('billing-2', 60, 'Isha Menon', {
        workSummary:
          'Finalized the vendor portal interface and improved the invoice status and payment history screens.',
        completedTasks:
          'Completed vendor dashboard layout\nImproved invoice status display\nUpdated payment history interface',
        decisions:
          'The portal uses consistent status labels for submitted, under review, approved and paid invoices.',
        blockers: '',
        dependencies: 'Requires final backend status mapping for all invoice states.',
        pendingTasks: 'Verify all status labels against backend responses.',
        nextSteps: 'Perform a final UI review with the development team.',
        evidence: 'Vendor portal UI review notes.',
      }),
    ],
    documents: [
      doc('d11', 'S1', 'Invoice Flow Specification.pdf', 'PDF', 260, 'Rohan Kulkarni', 40),
      doc('d12', 'S2', 'Go-Live Report.docx', 'DOCX', 110, 'Saurav Deore', 15),
    ],
    knowledge: {
      summary: 'Project is delivered. Handover approved by the manager.',
      items: [
        item('k10', 'completed', 'Invoice submission and tracking are live.', 'S2'),
        item('k11', 'decision', 'Invoices are stored as PDFs for audit needs.', 'S1'),
        item('k12', 'pending', 'Quarterly vendor report export is still open.', 'S2'),
      ],
    },
  },
]
