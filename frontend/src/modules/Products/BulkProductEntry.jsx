import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import Icons from '../../components/common/Icons';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import productApi from '../../api/product.api';
import categoryApi from '../../api/category.api';
import storeTaxApi from '../../api/storeTax.api';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Card from '../../components/common/Card/Card';
import Loader from '../../components/common/Loader/Loader';

const INITIAL_ROWS = 5;
const COLUMNS = [
    { key: 'product_name', label: 'Product Name', required: true, width: '250px' },
    { key: 'sku', label: 'SKU', width: '150px' },
    { key: 'barcode', label: 'Barcode', width: '150px' },
    { key: 'category_id', label: 'Category', required: true, type: 'select', width: '200px' },
    { key: 'tax_id', label: 'Tax Rule', required: true, type: 'select', width: '200px' },
    { key: 'price', label: 'Sale Price', required: true, type: 'number', width: '120px' },
    { key: 'unit', label: 'Unit', required: true, width: '100px' },
    { key: 'min_stock', label: 'Min Stock', type: 'number', width: '100px' },
    { key: 'description', label: 'Description', width: '300px' },
    { key: 'status', label: 'Status', type: 'status', width: '120px' },
    { key: 'message', label: 'Response Message', type: 'message', width: '250px' }
];

const BulkProductEntry = () => {
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    // Initial rows for the table
    const [rows, setRows] = useState(
        Array(INITIAL_ROWS).fill().map((_, i) => ({
            id: i,
            product_name: '',
            sku: '',
            barcode: '',
            category_id: '',
            tax_id: '',
            price: '',
            unit: 'Pcs',
            min_stock: '0',
            description: '',
            status: null,
            message: ''
        }))
    );

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [catRes, taxRes] = await Promise.all([
                categoryApi.getActiveCategories(),   // active categories for this owner
                storeTaxApi.getStoreTaxes()           // taxes assigned to this owner
            ]);
            setCategories(catRes.data || []);
            // Filter to only show active taxes for this owner
            const allTaxes = taxRes.data || [];
            setTaxes(allTaxes.filter(t => t.is_active === true || t.is_active === 1));
        } catch (error) {
            showAlert('danger', 'Failed to fetch categories or taxes');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const handleCellChange = (index, key, value) => {
        const newRows = [...rows];
        newRows[index][key] = value;
        setRows(newRows);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    showAlert('warning', 'The uploaded Excel file is empty.');
                    return;
                }

                const mappedRows = jsonData.map((item, index) => {
                    const cat = categories.find(c =>
                        c.category_name.toLowerCase().trim() === (item.Category || item.category || '').toLowerCase().trim()
                    );
                    const tax = taxes.find(t =>
                        t.tax_name.toLowerCase().trim() === (item['Tax Rule'] || item.tax_rule || '').toLowerCase().trim()
                    );

                    return {
                        id: Date.now() + index + Math.random(),
                        product_name: item['Product Name'] || item.product_name || '',
                        sku: item.SKU || item.sku || '',
                        barcode: item.Barcode || item.barcode || '',
                        category_id: cat ? cat.id : '',
                        tax_id: tax ? tax.id : '',
                        price: item['Sale Price'] || item.sale_price || item.price || '',
                        unit: item.Unit || item.unit || 'Pcs',
                        min_stock: item['Min Stock'] || item.min_stock || '0',
                        description: item.Description || item.description || '',
                        status: null,
                        message: ''
                    };
                });

                // Prepend or replace
                setRows([...mappedRows, ...rows.filter(r => r.product_name === '')]);
                showAlert('success', `Successfully imported ${jsonData.length} records.`);
                e.target.value = null;
            } catch (err) {
                showAlert('danger', 'Failed to parse Excel file.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const downloadSample = () => {
        const sampleData = [
            {
                'Product Name': 'Sample Item',
                'SKU': 'SKU123',
                'Barcode': '123456789',
                'Category': categories[0]?.category_name || 'General',
                'Tax Rule': taxes[0]?.tax_name || 'Standard',
                'Sale Price': 100,
                'Unit': 'Pcs',
                'Min Stock': 10,
                'Description': 'Sample description'
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, 'Bulk_Product_Template.xlsx');
    };

    const handleAddRow = () => {
        setRows([...rows, {
            id: Date.now() + Math.random(),
            product_name: '',
            sku: '',
            barcode: '',
            category_id: '',
            tax_id: '',
            price: '',
            unit: 'Pcs',
            min_stock: '0',
            description: '',
            status: null,
            message: ''
        }]);
    };

    const handleReset = () => {
        if (window.confirm('Clear all entries?')) {
            setRows(Array(INITIAL_ROWS).fill().map((_, i) => ({
                id: i,
                product_name: '',
                sku: '',
                barcode: '',
                category_id: '',
                tax_id: '',
                price: '',
                unit: 'Pcs',
                min_stock: '20',
                description: '',
                status: null,
                message: ''
            })));
        }
    };

    // Helper to sanitize a row for API
    const sanitizeRow = (r) => ({
        product_name: String(r.product_name).trim(),
        sku: r.sku !== '' && r.sku != null ? String(r.sku).trim() || null : null,
        barcode: r.barcode !== '' && r.barcode != null ? String(r.barcode).trim() || null : null,
        category_id: parseInt(r.category_id, 10),
        tax_id: parseInt(r.tax_id, 10),
        price: parseFloat(r.price),
        unit: String(r.unit).trim() || 'Pcs',
        min_stock: r.min_stock !== '' && r.min_stock != null ? parseInt(r.min_stock, 10) : 0,
        description: r.description !== '' && r.description != null ? String(r.description).trim() || null : null
    });

    const handleDeleteRow = (rowId) => {
        setRows(prev => prev.filter(r => r.id !== rowId));
    };

    const handleSubmit = async () => {
        const activeRows = rows.filter(r => r.product_name?.trim() !== '');
        if (activeRows.length === 0) {
            showAlert('warning', 'Please add at least one product name.');
            return;
        }

        // Step 1: Validate all rows — mark errors immediately, collect valid ones
        let currentRows = rows.map(row => {
            if (!row.product_name?.trim()) return { ...row, status: null, message: '' };
            const error = validateRow(row);
            if (error) return { ...row, status: 'error', message: error };
            return { ...row, status: 'pending', message: 'Queued...' };
        });
        setRows([...currentRows]);

        const validRows = currentRows.filter(r => r.status === 'pending');
        if (validRows.length === 0) {
            showAlert('danger', 'Please fix all highlighted errors before submitting.');
            return;
        }

        setIsSubmitting(true);

        // Step 2: Submit valid rows one by one
        for (const vr of validRows) {
            // Mark this row as processing
            currentRows = currentRows.map(r =>
                r.id === vr.id ? { ...r, status: 'pending', message: 'Submitting...' } : r
            );
            setRows([...currentRows]);

            try {
                const response = await productApi.bulkCreateProducts([sanitizeRow(vr)]);
                const result = response.data?.[0];
                currentRows = currentRows.map(r =>
                    r.id === vr.id
                        ? { ...r, status: result?.status || 'success', message: result?.message || 'Created successfully' }
                        : r
                );
            } catch (err) {
                const msg = err?.message || err?.error || 'Failed to create product';
                currentRows = currentRows.map(r =>
                    r.id === vr.id ? { ...r, status: 'error', message: msg } : r
                );
            }
            setRows([...currentRows]);
        }

        setIsSubmitting(false);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="page-loading">
                    <Loader size="large" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="bulk-entry-container">
                <div className="page-header">
                    <div>
                        <h1>Bulk Product Entry</h1>
                        <p>High-speed catalog management with Excel-like grid</p>
                    </div>
                    <div className="header-actions">
                        <Button variant="outline" onClick={downloadSample}>
                            <Icons.Download size={20} /> Sample Excel
                        </Button>
                        <Button variant="primary" onClick={() => fileInputRef.current.click()}>
                            <Icons.Upload size={20} /> Upload Excel
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                        />
                    </div>
                </div>

                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                <Card className="excel-card">
                    {/* Excel Grid — both axes scroll inside this wrapper */}
                    <div className="bulk-grid-wrapper">
                        <table className="bulk-grid">
                            <thead>
                                <tr>
                                    <th className="sticky-col-first-header" style={{ width: '50px', textAlign: 'center' }}>#</th>
                                    {COLUMNS.map(col => (
                                        <th key={col.key} style={{ width: col.width }}>
                                            {col.label}
                                            {col.required && <span style={{ color: 'var(--danger-color)', marginLeft: '2px' }}>*</span>}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={row.id}>
                                        <td className="sticky-col-first" style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '11px', fontWeight: 600 }}>
                                            {index + 1}
                                        </td>
                                        {COLUMNS.map(col => (
                                            <td key={col.key}>
                                                {col.type === 'select' ? (
                                                    <select
                                                        className="grid-select"
                                                        value={row[col.key]}
                                                        onChange={(e) => handleCellChange(index, col.key, e.target.value)}
                                                    >
                                                        <option value="">Select {col.label}</option>
                                                        {col.key === 'category_id' ? (
                                                            categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)
                                                        ) : (
                                                            taxes.map(t => <option key={t.id} value={t.id}>{t.tax_name}</option>)
                                                        )}
                                                    </select>
                                                ) : col.type === 'status' ? (
                                                    <div className="grid-status-cell">
                                                        {row.status && (
                                                            <span className={`status-badge ${row.status}`}>
                                                                {row.status === 'success' ? '✓ Success' : '✗ Error'}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : col.type === 'message' ? (
                                                    <div
                                                        className="grid-status-cell"
                                                        title={row.message}
                                                        style={{
                                                            fontSize: '11px',
                                                            color: row.status === 'success' ? '#166534' : row.status === 'error' ? '#991b1b' : 'var(--gray-500)',
                                                            fontWeight: row.status ? 500 : 400,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: col.width
                                                        }}
                                                    >
                                                        {row.message}
                                                    </div>
                                                ) : (
                                                    <input
                                                        type={col.type === 'number' ? 'number' : 'text'}
                                                        className="grid-input"
                                                        value={row[col.key]}
                                                        onChange={(e) => handleCellChange(index, col.key, e.target.value)}
                                                        placeholder="..."
                                                    />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Actions */}
                    <div className="bulk-card-footer">
                        <div className="footer-actions-left">
                            <Button variant="outline" onClick={handleAddRow}>
                                <Icons.Plus size={18} /> Add Row
                            </Button>
                        </div>
                        <div className="footer-actions-right">
                            <Button variant="outline" onClick={handleReset} color="danger">
                                Reset/Clear
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={isSubmitting || rows.length === 0}
                            >
                                {isSubmitting ? 'Processing...' : 'Add all Products'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default BulkProductEntry;
