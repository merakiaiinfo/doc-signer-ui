import { MOCK_DOCUMENTS, MOCK_ANALYTICS, MOCK_BOTTLENECKS } from '../mock/mockData';
import * as mammoth from 'mammoth';

const USE_MOCK = false; // Easily switch to false when backend is ready
const API_BASE_URL = '/api';

export const docService = {
    // Get all documents
    async getDocuments() {
        if (USE_MOCK) return Promise.resolve(MOCK_DOCUMENTS);
        const userId = localStorage.getItem('sim_user_id') || '4'; // Default to Admin (Dave)
        const response = await fetch(`${API_BASE_URL}/documents`, {
            headers: { 'x-user-id': userId }
        });
        return response.json();
    },

    // Create document (Using FormData for Actual File Upload)
    async createDocument(data) {
        if (USE_MOCK) return Promise.resolve({ success: true, doc_id: "DOC-NEW" });
        const userId = localStorage.getItem('sim_user_id') || '1';

        const formData = new FormData();
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (value === null || value === undefined) return;
            if (Array.isArray(value)) {
                value.forEach(item => formData.append(key, item));
            } else {
                formData.append(key, value);
            }
        });

        const response = await fetch(`${API_BASE_URL}/documents`, {
            method: 'POST',
            headers: {
                'x-user-id': userId
            },
            body: formData
        });
        return response.json();
    },

    // Get document by ID
    async getDocumentById(id) {
        if (USE_MOCK) return Promise.resolve(MOCK_DOCUMENTS.find(d => d.doc_id === id));
        const userId = localStorage.getItem('sim_user_id') || '4';
        const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
            headers: { 'x-user-id': userId },
            cache: 'no-store'
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Document request failed (${response.status})`);
        }
        return response.json();
    },

    // Download document source
    async downloadDocument(id) {
        if (USE_MOCK) return;
        const userId = localStorage.getItem('sim_user_id') || '4';
        const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
            headers: { 'x-user-id': userId }
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const disposition = response.headers.get('content-disposition') || '';
        const uriMatch = disposition.match(/filename="?([^";]+)"?/);
        const fileName = uriMatch?.[1] || `${id}.docx`;
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    },

    async getDocumentPreview(id) {
        if (USE_MOCK) return null;
        const userId = localStorage.getItem('sim_user_id') || '4';
        const response = await fetch(`${API_BASE_URL}/documents/${id}/preview?userId=${userId}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Preview failed (${response.status})`);
        }
        const blob = await response.blob();
        if (blob.type === 'application/pdf') {
            return { type: 'pdf', url: window.URL.createObjectURL(blob) };
        }
        if (blob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() });
            return { type: 'html', content: result.value };
        }
        throw new Error(`Unsupported preview file type: ${blob.type || 'unknown'}`);
    },

    // Transition a document
    async transitionDocument(id, transitionData) {
        if (USE_MOCK) return Promise.resolve({ success: true });
        const userId = localStorage.getItem('sim_user_id') || transitionData.performer_id.toString();
        const response = await fetch(`${API_BASE_URL}/documents/${id}/transition`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify(transitionData)
        });
        return response.json();
    },

    // Signature Management
    async getSignature(userId) {
        const response = await fetch(`${API_BASE_URL}/signatures/${userId}`);
        return response.json();
    },

    async saveSignature(sigData) {
        const response = await fetch(`${API_BASE_URL}/signatures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sigData)
        });
        return response.json();
    },

    // Get Analytics Summary
    async getAnalytics() {
        if (USE_MOCK) return Promise.resolve(MOCK_ANALYTICS);
        const userId = localStorage.getItem('sim_user_id') || '4';
        const response = await fetch(`${API_BASE_URL}/analytics/aging`, {
            headers: { 'x-user-id': userId }
        });
        return response.json();
    },

    // Get Bottlenecks
    async getBottlenecks() {
        if (USE_MOCK) return Promise.resolve(MOCK_BOTTLENECKS);
        const userId = localStorage.getItem('sim_user_id') || '4';
        const response = await fetch(`${API_BASE_URL}/analytics/bottlenecks`, {
            headers: { 'x-user-id': userId }
        });
        return response.json();
    },

    // Get reviewers/approvers for document creation (DOC_CREATE permission)
    async getSigners() {
        const userId = localStorage.getItem('sim_user_id') || '1';
        const response = await fetch(`${API_BASE_URL}/users/signers`, {
            headers: { 'x-user-id': userId }
        });
        if (!response.ok) return [];
        return response.json();
    },

    // Admin Methods
    async getUsers() {
        const userId = localStorage.getItem('sim_user_id') || '4';
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: { 'x-user-id': userId }
        });
        return response.json();
    },

    async getDepartments() {
        const userId = localStorage.getItem('sim_user_id') || '4';
        const response = await fetch(`${API_BASE_URL}/admin/departments`, {
            headers: { 'x-user-id': userId }
        });
        return response.json();
    },

    async getRoles() {
        const userId = localStorage.getItem('sim_user_id') || '4';
        const response = await fetch(`${API_BASE_URL}/admin/roles`, {
            headers: { 'x-user-id': userId }
        });
        return response.json();
    }
};
