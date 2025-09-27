// Invoice Generator TypeScript Implementation
// Modular invoice generation with clean separation of concerns

// Interface definitions for type safety
interface CompanyInfo {
    name: string;
    email: string;
    phone: string;
    website: string;
    address: string;
}

interface ClientInfo {
    name: string;
    email: string;
    address: string;
}

interface InvoiceMeta {
    number: string;
    date: string;
    dueDate: string;
    taxRate: number;
}

interface LineItem {
    description: string;
    quantity: number;
    price: number;
    total: number;
}

interface InvoiceData {
    company: CompanyInfo;
    client: ClientInfo;
    meta: InvoiceMeta;
    items: LineItem[];
    subtotal: number;
    taxAmount: number;
    grandTotal: number;
}

// Main Invoice Generator Class
class InvoiceGenerator {
    private currentItemIndex: number = 0;

    constructor() {
        this.initializeEventListeners();
        this.setDefaultDate();
    }

    // Initialize all event listeners for form interactions
    private initializeEventListeners(): void {
        // Generate preview button
        const generateBtn = document.getElementById('generatePreview');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generatePreview());
        }

        // Download PDF button
        const downloadBtn = document.getElementById('downloadPDF');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadPDF());
        }

        // Add item button
        const addItemBtn = document.getElementById('addItem');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addLineItem());
        }

        // Auto-calculate line item totals when inputs change
        this.setupLineItemCalculations();
    }

    // Set default invoice date to today
    private setDefaultDate(): void {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('invoiceDate') as HTMLInputElement;
        if (dateInput) {
            if (!dateInput.value || dateInput.value === '') (dateInput as any).value = today;
        }
    }

    // Setup automatic calculations for line items
    private setupLineItemCalculations(): void {
        const container = document.querySelector('.line-items-container');
        if (!container) return;

        // Use event delegation for dynamic line items
        container.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.classList.contains('item-quantity') || target.classList.contains('item-price')) {
                this.calculateLineItemTotal(target);
            }
        });
    }

    // Calculate total for a specific line item
    private calculateLineItemTotal(input: HTMLInputElement): void {
        const lineItem = input.closest('.line-item') as HTMLElement;
        if (!lineItem) return;

        const quantityInput = lineItem.querySelector('.item-quantity') as HTMLInputElement;
        const priceInput = lineItem.querySelector('.item-price') as HTMLInputElement;
        const totalInput = lineItem.querySelector('.item-total') as HTMLInputElement;

        if (!quantityInput || !priceInput || !totalInput) return;

        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;

        totalInput.value = total.toFixed(2);
    }

    // Add a new line item to the form
    private addLineItem(): void {
        this.currentItemIndex++;
        const container = document.querySelector('.line-items-container');
        if (!container) return;

        const newItem = document.createElement('div');
        newItem.className = 'line-item';
        newItem.setAttribute('data-item', this.currentItemIndex.toString());

        newItem.innerHTML = `
            <div class="form-row">
                <div class="form-field">
                    <label>Description *</label>
                    <input type="text" class="item-description" required>
                </div>
                <div class="form-field">
                    <label>Quantity *</label>
                    <input type="number" class="item-quantity" min="0" step="0.01" value="1" required>
                </div>
                <div class="form-field">
                    <label>Unit Price *</label>
                    <input type="number" class="item-price" min="0" step="0.01" required>
                </div>
                <div class="form-field">
                    <label>Total</label>
                    <input type="number" class="item-total" readonly>
                </div>
            </div>
        `;

        container.appendChild(newItem);
    }

    // Collect form data and validate inputs
    private collectFormData(): InvoiceData | null {
        try {
            // Collect company information
            const company: CompanyInfo = {
                name: this.getInputValue('companyName'),
                email: this.getInputValue('companyEmail'),
                phone: this.getInputValue('companyPhone'),
                website: this.getInputValue('companyWebsite'),
                address: this.getInputValue('companyAddress')
            };

            // Collect client information
            const client: ClientInfo = {
                name: this.getInputValue('clientName'),
                email: this.getInputValue('clientEmail'),
                address: this.getInputValue('clientAddress')
            };

            // Collect invoice metadata
            const meta: InvoiceMeta = {
                number: this.getInputValue('invoiceNumber'),
                date: this.getInputValue('invoiceDate'),
                dueDate: this.getInputValue('dueDate'),
                taxRate: parseFloat(this.getInputValue('taxRate')) || 0
            };

            // Collect line items
            const items = this.collectLineItems();

            // Validate required fields
            if (!company.name || !client.name || !meta.number || !meta.date) {
                alert('Please fill in all required fields (marked with *)');
                return null;
            }

            if (items.length === 0) {
                alert('Please add at least one invoice item');
                return null;
            }

            // Calculate totals
            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const taxAmount = (subtotal * meta.taxRate) / 100;
            const grandTotal = subtotal + taxAmount;

            return {
                company,
                client,
                meta,
                items,
                subtotal,
                taxAmount,
                grandTotal
            };

        } catch (error) {
            console.error('Error collecting form data:', error);
            alert('Error processing form data. Please check your inputs.');
            return null;
        }
    }

    // Helper method to get input values safely
    private getInputValue(id: string): string {
        const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
        return element ? element.value.trim() : '';
    }

    // Collect all line items from the form
    private collectLineItems(): LineItem[] {
        const items: LineItem[] = [];
        const lineItems = document.querySelectorAll('.line-item');

        lineItems.forEach((item) => {
            const description = (item.querySelector('.item-description') as HTMLInputElement)?.value.trim();
            const quantity = parseFloat((item.querySelector('.item-quantity') as HTMLInputElement)?.value || '0');
            const price = parseFloat((item.querySelector('.item-price') as HTMLInputElement)?.value || '0');
            const total = parseFloat((item.querySelector('.item-total') as HTMLInputElement)?.value || '0');

            // Only add items with description
            if (description) {
                items.push({
                    description,
                    quantity,
                    price,
                    total
                });
            }
        });

        return items;
    }

    // Generate and display the invoice preview
    public generatePreview(): void {
        const invoiceData = this.collectFormData();
        if (!invoiceData) return;

        const previewSection = document.getElementById('previewSection');
        const previewContainer = document.getElementById('invoicePreview');
        const downloadBtn = document.getElementById('downloadPDF') as HTMLButtonElement;

        if (!previewSection || !previewContainer) return;

        // Generate HTML for the invoice
        const invoiceHTML = this.generateInvoiceHTML(invoiceData);
        previewContainer.innerHTML = invoiceHTML;

        // Show preview section and enable download button
        previewSection.style.display = 'block';
        if (downloadBtn) {
            downloadBtn.disabled = false;
        }

        // Scroll to preview
        previewSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Generate HTML structure for the invoice
    private generateInvoiceHTML(data: InvoiceData): string {
        return `
            <div class="invoice-header">
                <div class="company-info">
                    <h2>${this.escapeHtml(data.company.name)}</h2>
                    ${data.company.address ? `<p>${this.escapeHtml(data.company.address).replace(/\n/g, '<br>')}</p>` : ''}
                    ${data.company.phone ? `<p>Phone: ${this.escapeHtml(data.company.phone)}</p>` : ''}
                    ${data.company.email ? `<p>Email: ${this.escapeHtml(data.company.email)}</p>` : ''}
                    ${data.company.website ? `<p>Website: ${this.escapeHtml(data.company.website)}</p>` : ''}
                </div>
                <div class="invoice-meta">
                    <h3>INVOICE</h3>
                    <p><strong>Invoice #:</strong> ${this.escapeHtml(data.meta.number)}</p>
                    <p><strong>Date:</strong> ${this.formatDate(data.meta.date)}</p>
                    ${data.meta.dueDate ? `<p><strong>Due Date:</strong> ${this.formatDate(data.meta.dueDate)}</p>` : ''}
                </div>
            </div>

            <div class="client-info">
                <h4>Bill To:</h4>
                <p><strong>${this.escapeHtml(data.client.name)}</strong></p>
                ${data.client.address ? `<p>${this.escapeHtml(data.client.address).replace(/\n/g, '<br>')}</p>` : ''}
                ${data.client.email ? `<p>Email: ${this.escapeHtml(data.client.email)}</p>` : ''}
            </div>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-center">Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                        <tr>
                            <td>${this.escapeHtml(item.description)}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right">$${item.price.toFixed(2)}</td>
                            <td class="text-right">$${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="invoice-totals">
                <table>
                    <tr>
                        <td class="total-label">Subtotal:</td>
                        <td class="total-amount">$${data.subtotal.toFixed(2)}</td>
                    </tr>
                    ${data.meta.taxRate > 0 ? `
                        <tr>
                            <td class="total-label">Tax (${data.meta.taxRate}%):</td>
                            <td class="total-amount">$${data.taxAmount.toFixed(2)}</td>
                        </tr>
                    ` : ''}
                    <tr class="grand-total">
                        <td class="total-label">Grand Total:</td>
                        <td class="total-amount">$${data.grandTotal.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <div class="invoice-footer">
                <p>Thank you for your business!</p>
            </div>
        `;
    }

    // Escape HTML to prevent XSS attacks
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Format date for display
    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Download invoice as PDF using browser's print functionality
    public downloadPDF(): void {
        const previewSection = document.getElementById('previewSection');
        if (!previewSection || previewSection.style.display === 'none') {
            alert('Please generate a preview first');
            return;
        }

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to download the PDF');
            return;
        }

        // Get the invoice HTML
        const invoiceHTML = document.getElementById('invoicePreview')?.innerHTML;
        if (!invoiceHTML) return;

        // Create the print document
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${this.getInputValue('invoiceNumber')}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #e9ecef;
                    }
                    .company-info h2 {
                        color: #2c3e50;
                        font-size: 1.8rem;
                        margin-bottom: 10px;
                    }
                    .company-info p {
                        color: #6c757d;
                        margin-bottom: 5px;
                    }
                    .invoice-meta {
                        text-align: right;
                    }
                    .invoice-meta h3 {
                        color: #2c3e50;
                        font-size: 1.5rem;
                        margin-bottom: 15px;
                    }
                    .invoice-meta p {
                        color: #6c757d;
                        margin-bottom: 5px;
                    }
                    .client-info {
                        margin-bottom: 40px;
                    }
                    .client-info h4 {
                        color: #495057;
                        margin-bottom: 10px;
                        font-size: 1.1rem;
                    }
                    .client-info p {
                        color: #6c757d;
                        margin-bottom: 5px;
                    }
                    .invoice-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    .invoice-table th,
                    .invoice-table td {
                        padding: 15px;
                        text-align: left;
                        border-bottom: 1px solid #e9ecef;
                    }
                    .invoice-table th {
                        background-color: #f8f9fa;
                        font-weight: 600;
                        color: #495057;
                        text-transform: uppercase;
                        font-size: 0.9rem;
                        letter-spacing: 0.5px;
                    }
                    .invoice-table .text-right {
                        text-align: right;
                    }
                    .invoice-table .text-center {
                        text-align: center;
                    }
                    .invoice-totals {
                        margin-left: auto;
                        width: 300px;
                    }
                    .invoice-totals table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .invoice-totals td {
                        padding: 10px 15px;
                        border-bottom: 1px solid #e9ecef;
                    }
                    .invoice-totals .total-label {
                        font-weight: 600;
                        color: #495057;
                    }
                    .invoice-totals .total-amount {
                        text-align: right;
                        font-weight: 600;
                        color: #2c3e50;
                    }
                    .invoice-totals .grand-total {
                        background-color: #f8f9fa;
                        font-size: 1.1rem;
                        border-top: 2px solid #667eea;
                    }
                    .invoice-footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #e9ecef;
                        text-align: center;
                        color: #6c757d;
                        font-style: italic;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${invoiceHTML}
            </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    }
}

// Initialize the invoice generator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InvoiceGenerator();
});
