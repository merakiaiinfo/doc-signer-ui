export const MOCK_DOCUMENTS = [
    {
        doc_id: "DOC-99215",
        title: "Quarterly_Budget_Plan.docx",
        current_stage_id: 2,
        status: "UNDER_REVIEW",
        author_id: "USR_001",
        author_name: "Alice Author",
        assigned_reviewer_id: "USR_042",
        assigned_approver_id: "USR_088",
        version: 3,
        department: "Finance",
        created_at: "2026-02-15T09:00:00Z",
        updated_at: "2026-02-18T14:30:00Z",
        total_age_days: 3.2,
        audit_log: [
            {
                stage: 1,
                action: "SUBMITTED",
                by: "USR_001",
                timestamp: "2026-02-15T09:00:00Z",
                comments: "Initial draft for Q1."
            },
            {
                stage: 2,
                action: "RETURNED",
                by: "USR_042",
                timestamp: "2026-02-16T11:00:00Z",
                comments: "Missing marketing spend details."
            }
        ]
    },
    {
        doc_id: "DOC-88120",
        title: "Legal_Partnership_Agr.docx",
        current_stage_id: 1,
        status: "DRAFT",
        author_id: "USR_001",
        author_name: "Alice Author",
        assigned_reviewer_id: "USR_045",
        assigned_approver_id: "USR_090",
        version: 1,
        department: "Legal",
        created_at: "2026-02-20T10:00:00Z",
        updated_at: "2026-02-20T10:00:00Z",
        total_age_days: 0.5,
        audit_log: []
    },
    {
        doc_id: "DOC-77341",
        title: "HR_Policy_Update.pdf",
        current_stage_id: 4,
        status: "CLOSED",
        author_id: "USR_002",
        author_name: "Bob HR",
        assigned_reviewer_id: "USR_042",
        assigned_approver_id: "USR_088",
        version: 2,
        department: "HR",
        created_at: "2026-01-10T09:00:00Z",
        updated_at: "2026-01-15T16:00:00Z",
        total_age_days: 5.3,
        audit_log: []
    }
];

export const MOCK_ANALYTICS = {
    summary_metrics: {
        avg_total_cycle_time: 5.4,
        bottleneck_stage: "STAGE_2_REVIEW",
        total_active_docs: 142
    },
    departmental_performance: [
        {
            dept_name: "Finance",
            avg_days_pending: 1.2,
            rejection_rate: "5%"
        },
        {
            dept_name: "Legal",
            avg_days_pending: 4.8,
            rejection_rate: "15%"
        },
        {
            dept_name: "HR",
            avg_days_pending: 2.1,
            rejection_rate: "8%"
        },
        {
            dept_name: "Engineering",
            avg_days_pending: 0.8,
            rejection_rate: "2%"
        }
    ]
};

export const MOCK_BOTTLENECKS = [
    {
        doc_id: "DOC-99215",
        title: "Quarterly_Budget_Plan.docx",
        current_holder: "John Reviewer",
        department: "Finance",
        days_pending: 3,
        hours_pending: 4
    },
    {
        doc_id: "DOC-99440",
        title: "Supplier_NDA_Signed.docx",
        current_holder: "Sarah Legal",
        department: "Legal",
        days_pending: 4,
        hours_pending: 12
    }
];
