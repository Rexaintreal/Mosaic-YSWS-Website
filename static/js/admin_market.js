// Admin Market Management JavaScript - Improved image handling and form submission

let allItems = [];
let allOrders = [];
let currentOrderFilter = 'all';
let editingItemId = null;
let uploadedImagePath = null;

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    loadOrders();
});

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Load all items
async function loadItems() {
    const itemsContainer = document.getElementById('admin-items');
    
    itemsContainer.innerHTML = `
        <div class="loading">
            <p>Loading products...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/admin/api/market/items');
        const data = await response.json();
        
        if (!response.ok) {
            await showAlert('Error loading items', 'error');
            return;
        }

        allItems = data.items || [];
        renderItems();
        
    } catch (e) {
        console.error('Error loading items:', e);
        await showAlert('Network error loading items', 'error');
    }
}

// Render items
function renderItems() {
    const itemsContainer = document.getElementById('admin-items');
    
    if (allItems.length === 0) {
        itemsContainer.innerHTML = `
            <div class="empty-state">
                <p>No items in the market yet</p>
            </div>
        `;
        return;
    }

    itemsContainer.innerHTML = allItems.map(item => `
        <div class="admin-item-card market-item ${!item.is_active ? 'inactive' : ''}">
            <div class="item-image">
                ${item.image_url ? 
                    `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'placeholder-box\\'>No Image</div>';">` : 
                    '<div class="placeholder-box">No Image</div>'
                }
            </div>
            ${!item.is_active ? '<div class="inactive-badge">Inactive</div>' : ''}
            <div class="item-content">
                <h3 class="item-title">${item.name}</h3>
                ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                <div class="item-footer">
                    <div>
                        <div class="item-price">
                            ${item.price} Tiles
                        </div>
                        <div style="color: #999; font-size: 12px; margin-top: 5px;">
                            Stock: ${item.stock_quantity === -1 ? 'Unlimited' : item.stock_quantity}
                        </div>
                    </div>
                </div>
            </div>
            <div class="admin-item-actions">
                <button class="btn-edit" onclick="openEditItemModal('${item.id}')">
                    Edit
                </button>
                <button class="btn-delete" onclick="confirmDeleteItem('${item.id}')">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Confirm delete with custom modal
async function confirmDeleteItem(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    
    const confirmed = await showConfirm(
        `Are you sure you want to delete "${item.name}"? This action cannot be undone and will permanently remove this item from the market.`,
        'Delete Item'
    );
    
    if (confirmed) {
        await deleteItem(itemId);
    }
}

// Delete item
async function deleteItem(itemId) {
    try {
        const response = await fetch(`/admin/api/market/items/${itemId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            await showAlert(error.error || 'Error deleting item', 'error');
            return;
        }

        await showAlert('Item deleted successfully!', 'success');
        await loadItems();
        
    } catch (e) {
        console.error('Error deleting item:', e);
        await showAlert('Network error deleting item', 'error');
    }
}

// Open add item modal
function openAddItemModal() {
    editingItemId = null;
    uploadedImagePath = null;
    
    document.getElementById('item-modal-title').textContent = 'Add New Item';
    document.getElementById('item-id').value = '';
    document.getElementById('item-name').value = '';
    document.getElementById('item-description').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-hours').value = '';
    document.getElementById('item-stock').value = '-1';
    document.getElementById('item-active').checked = true;
    document.getElementById('item-image-file').value = '';
    document.getElementById('item-image-path').value = '';
    
    const preview = document.getElementById('image-preview');
    preview.innerHTML = `
        <div style="text-align: center; color: #666;">
            <i class="fas fa-cloud-upload-alt" style="font-size: 40px; color: var(--blue-accent); margin-bottom: 10px;"></i>
            <p style="margin: 0;">Click or drag image here</p>
            <small style="color: #999;">Max 5MB | JPG, PNG, WebP, GIF</small>
        </div>
    `;
    
    document.getElementById('item-modal').classList.remove('hidden');
}

// Open edit item modal
function openEditItemModal(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    
    editingItemId = itemId;
    uploadedImagePath = item.image_url || null;
    
    document.getElementById('item-modal-title').textContent = 'Edit Item';
    document.getElementById('item-id').value = itemId;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-description').value = item.description || '';
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-hours').value = item.estimated_hours || '';
    document.getElementById('item-stock').value = item.stock_quantity;
    document.getElementById('item-active').checked = item.is_active;
    document.getElementById('item-image-file').value = '';
    document.getElementById('item-image-path').value = item.image_url || '';
    
    const preview = document.getElementById('image-preview');
    if (item.image_url) {
        preview.innerHTML = `
            <div style="position: relative;">
                <img src="${item.image_url}" alt="Preview" style="width: 100%; height: auto; border-radius: 8px; display: block;">
                <button type="button" onclick="removeImage()" style="position: absolute; top: 10px; right: 10px; background: rgba(211, 47, 47, 0.9); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">&times;</button>
            </div>
        `;
    } else {
        preview.innerHTML = `
            <div style="text-align: center; color: #666;">
                <i class="fas fa-cloud-upload-alt" style="font-size: 40px; color: var(--blue-accent); margin-bottom: 10px;"></i>
                <p style="margin: 0;">Click or drag image here</p>
                <small style="color: #999;">Max 5MB | JPG, PNG, WebP, GIF</small>
            </div>
        `;
    }
    
    document.getElementById('item-modal').classList.remove('hidden');
}

// Close item modal
function closeItemModal() {
    document.getElementById('item-modal').classList.add('hidden');
    editingItemId = null;
    uploadedImagePath = null;
}

// Remove image
function removeImage() {
    uploadedImagePath = null;
    document.getElementById('item-image-path').value = '';
    document.getElementById('item-image-file').value = '';
    
    const preview = document.getElementById('image-preview');
    preview.innerHTML = `
        <div style="text-align: center; color: #666;">
            <i class="fas fa-cloud-upload-alt" style="font-size: 40px; color: var(--blue-accent); margin-bottom: 10px;"></i>
            <p style="margin: 0;">Click or drag image here</p>
            <small style="color: #999;">Max 5MB | JPG, PNG, WebP, GIF</small>
        </div>
    `;
}

// Preview image with improved handling
function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showAlert('Invalid file type. Please upload PNG, JPG, GIF, or WebP', 'error');
        event.target.value = '';
        return;
    }
    
    // Show preview immediately
    const preview = document.getElementById('image-preview');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        preview.innerHTML = `
            <div style="position: relative;">
                <img src="${e.target.result}" alt="Preview" style="width: 100%; height: auto; border-radius: 8px; display: block;">
                <div style="position: absolute; top: 10px; right: 10px; background: rgba(255, 193, 7, 0.9); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                    Uploading...
                </div>
            </div>
        `;
    };
    
    reader.readAsDataURL(file);
    
    // Upload to server
    const formData = new FormData();
    formData.append('image', file);
    
    fetch('/admin/api/market/upload-image', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.image_url) {
            uploadedImagePath = data.image_url;
            document.getElementById('item-image-path').value = data.image_url;
            
            preview.innerHTML = `
                <div style="position: relative;">
                    <img src="${data.image_url}" alt="Preview" style="width: 100%; height: auto; border-radius: 8px; display: block;">
                    <div style="position: absolute; top: 10px; right: 10px; background: rgba(76, 175, 80, 0.9); color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                        Uploaded
                    </div>
                    <button type="button" onclick="removeImage()" style="position: absolute; top: 10px; left: 10px; background: rgba(211, 47, 47, 0.9); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
            `;
        } else {
            showAlert('Error uploading image', 'error');
            removeImage();
        }
    })
    .catch(e => {
        console.error('Upload error:', e);
        showAlert('Network error uploading image', 'error');
        removeImage();
    });
}

// Submit item form with improved validation and FormData
async function submitItem(event) {
    event.preventDefault();
    
    // Get form values and trim them
    const name = document.getElementById('item-name').value.trim();
    const description = document.getElementById('item-description').value.trim();
    const priceValue = document.getElementById('item-price').value.trim();
    const hoursValue = document.getElementById('item-hours').value.trim();
    const stockValue = document.getElementById('item-stock').value.trim();
    const isActive = document.getElementById('item-active').checked;
    const imageUrl = document.getElementById('item-image-path').value.trim();
    
    // Validation
    if (!name) {
        await showAlert('Please enter an item name', 'warning');
        document.getElementById('item-name').focus();
        return;
    }
    
    if (!priceValue) {
        await showAlert('Please enter a price', 'warning');
        document.getElementById('item-price').focus();
        return;
    }
    
    const price = parseInt(priceValue);
    if (isNaN(price) || price <= 0) {
        await showAlert('Please enter a valid price (must be a positive number)', 'warning');
        document.getElementById('item-price').focus();
        return;
    }
    
    // Create FormData (backend expects this format)
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price.toString());
    
    if (hoursValue) {
        formData.append('estimated_hours', parseFloat(hoursValue).toString());
    }
    
    if (stockValue) {
        formData.append('stock_quantity', parseInt(stockValue).toString());
    } else {
        formData.append('stock_quantity', '-1');
    }
    
    formData.append('is_active', isActive.toString());
    
    // Add image URL if uploaded separately
    if (imageUrl) {
        formData.append('image_url', imageUrl);
    }
    
    console.log('Submitting item data'); // Debug log
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = editingItemId ? 'Updating...' : 'Creating...';
    
    try {
        const url = editingItemId 
            ? `/admin/api/market/items/${editingItemId}`
            : '/admin/api/market/items';
        
        const method = editingItemId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData // Send as FormData, not JSON
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            console.error('Server error:', responseData); // Debug log
            await showAlert(responseData.error || 'Error saving item', 'error');
            return;
        }
        
        await showAlert(
            editingItemId ? 'Item updated successfully!' : 'Item created successfully!',
            'success'
        );
        
        closeItemModal();
        await loadItems();
        
    } catch (e) {
        console.error('Error saving item:', e);
        await showAlert('Network error saving item', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Load all orders
async function loadOrders() {
    try {
        const response = await fetch('/admin/api/market/orders');
        const data = await response.json();
        
        if (!response.ok) {
            await showAlert('Error loading orders', 'error');
            return;
        }

        // Map user_slack_id to slack_id for frontend consistency
        allOrders = (data.orders || []).map(order => ({
            ...order,
            slack_id: order.user_slack_id || order.slack_id || 'N/A'
        }));
        
        renderOrders();
        
    } catch (e) {
        console.error('Error loading orders:', e);
        await showAlert('Network error loading orders', 'error');
    }
}

// Render orders
function renderOrders() {
    const ordersBody = document.getElementById('orders-tbody');
    
    let filteredOrders = allOrders;
    if (currentOrderFilter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === currentOrderFilter);
    }
    
    if (filteredOrders.length === 0) {
        ordersBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <p>No orders found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    ordersBody.innerHTML = filteredOrders.map(order => `
        <tr>
            <td style="font-family: monospace; font-size: 12px;">${order.id.substring(0, 8)}...</td>
            <td>${order.user_name || 'Unknown'}</td>
            <td style="font-family: monospace; font-size: 13px;">${order.slack_id}</td>
            <td>${order.item_name || 'Unknown Item'}</td>
            <td style="text-align: center;">${order.quantity}</td>
            <td style="font-weight: 600; color: var(--blue-accent);">${order.total_price}</td>
            <td><span class="order-status ${order.status}">${order.status}</span></td>
            <td style="font-size: 12px;">${formatDate(order.created_at)}</td>
            <td>
                <div class="order-actions-btns">
                    <button class="btn-view" onclick="viewOrderDetails('${order.id}')">View</button>
                    ${order.status !== 'fulfilled' && order.status !== 'cancelled' ? 
                        `<button class="btn-update" onclick="openUpdateOrderModal('${order.id}')">Update</button>` : 
                        ''
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter orders
function filterOrders(status) {
    currentOrderFilter = status;
    
    document.querySelectorAll('.orders-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('active');
    
    renderOrders();
}

// View order details
function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('order-modal');
    const detailsContainer = document.getElementById('order-details');
    
    detailsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
            <div>
                <p style="font-size: 12px; color: #999; margin-bottom: 4px;">ORDER ID</p>
                <p style="font-family: monospace; font-size: 13px;">${order.id}</p>
            </div>
            <div>
                <p style="font-size: 12px; color: #999; margin-bottom: 4px;">STATUS</p>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div>
                <p style="font-size: 12px; color: #999; margin-bottom: 4px;">USER</p>
                <p style="font-size: 14px;">${order.user_name || 'Unknown'}</p>
            </div>
            <div>
                <p style="font-size: 12px; color: #999; margin-bottom: 4px;">SLACK ID</p>
                <p style="font-size: 14px; font-family: monospace;">${order.slack_id}</p>
            </div>
            <div>
                <p style="font-size: 12px; color: #999; margin-bottom: 4px;">ITEM</p>
                <p style="font-size: 14px; font-weight: 600;">${order.item_name || 'Unknown Item'}</p>
            </div>
            <div>
                <p style="font-size: 12px; color: #999; margin-bottom: 4px;">QUANTITY</p>
                <p style="font-size: 14px;">${order.quantity}</p>
            </div>
            <div>
                <p style="font-size: 12px; color: #999; margin-bottom: 4px;">TOTAL PRICE</p>
                <p style="font-size: 16px; font-weight: 700; color: var(--blue-accent);">${order.total_price} tiles</p>
            </div>
            <div>
                <p style="font-size: 12px; color: #999; margin-bottom: 4px;">ORDERED ON</p>
                <p style="font-size: 14px;">${formatDate(order.created_at)}</p>
            </div>
        </div>
        
        ${order.contact_info ? `
            <div style="margin-bottom: 20px;">
                <p style="font-size: 12px; color: #999; margin-bottom: 4px;">CONTACT INFORMATION</p>
                <p style="font-size: 14px; background: #f5f5f5; padding: 12px; border-radius: 8px;">${order.contact_info}</p>
            </div>
        ` : ''}
        
        ${order.notes ? `
            <div style="margin-bottom: 20px;">
                <p style="font-size: 12px; color: #999; margin-bottom: 4px;">ORDER NOTES</p>
                <p style="font-size: 14px; background: #f5f5f5; padding: 12px; border-radius: 8px; line-height: 1.6;">${order.notes}</p>
            </div>
        ` : ''}
        
        ${order.status !== 'fulfilled' && order.status !== 'cancelled' ? `
            <button class="btn-primary" style="width: 100%; margin-top: 10px;" onclick="closeOrderModal(); openUpdateOrderModal('${order.id}')">
                Update Status
            </button>
        ` : ''}
    `;
    
    modal.classList.remove('hidden');
}

// Close order modal
function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

// Open update order status modal with dropdown
async function openUpdateOrderModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('order-modal');
    const detailsContainer = document.getElementById('order-details');
    
    const currentStatus = order.status;
    
    detailsContainer.innerHTML = `
        <h3 style="margin-bottom: 20px; color: var(--blue-accent);">Update Order Status</h3>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <p style="margin: 0 0 5px 0; font-weight: 600;">${order.item_name}</p>
            <p style="margin: 0; font-size: 14px; color: #666;">Order ID: ${order.id.substring(0, 16)}...</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">User: ${order.user_name} | Qty: ${order.quantity} | Total: ${order.total_price} tiles</p>
        </div>
        
        <div class="form-group">
            <label for="new-status">New Status *</label>
            <select id="new-status" class="status-dropdown">
                <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="processing" ${currentStatus === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="fulfilled" ${currentStatus === 'fulfilled' ? 'selected' : ''}>Fulfilled</option>
                <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>Cancelled (Refund)</option>
            </select>
            <small style="display: block; margin-top: 8px; color: #999;">
                ${currentStatus === 'cancelled' ? 'This order is already cancelled and refunded.' : 'Changing to "Cancelled" will automatically refund tiles to the user.'}
            </small>
        </div>
        
        <div class="form-actions" style="margin-top: 25px;">
            <button class="btn-secondary" onclick="closeOrderModal()">Cancel</button>
            <button class="btn-primary" onclick="confirmUpdateOrderStatus('${orderId}')">
                Update Status
            </button>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Confirm update order status
async function confirmUpdateOrderStatus(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const newStatus = document.getElementById('new-status').value;
    const oldStatus = order.status;
    
    // If status hasn't changed, just close
    if (newStatus === oldStatus) {
        closeOrderModal();
        return;
    }
    
    // Special confirmation for cancellation
    if (newStatus === 'cancelled') {
        const confirmed = await showConfirm(
            `Are you sure you want to CANCEL this order?\n\nThis will automatically REFUND ${order.total_price} tiles to ${order.user_name}.\n\nThis action cannot be easily undone.`,
            'Confirm Cancellation & Refund'
        );
        
        if (!confirmed) return;
    } else {
        const confirmed = await showConfirm(
            `Change order status from "${oldStatus}" to "${newStatus}"?`,
            'Confirm Status Change'
        );
        
        if (!confirmed) return;
    }
    
    await updateOrderStatus(orderId, newStatus);
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/admin/api/market/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            const error = await response.json();
            await showAlert(error.error || 'Error updating order status', 'error');
            return;
        }
        
        const message = newStatus === 'cancelled' 
            ? 'Order cancelled and tiles refunded successfully!' 
            : 'Order status updated successfully!';
        
        await showAlert(message, 'success');
        closeOrderModal();
        await loadOrders();
        
    } catch (e) {
        console.error('Error updating order:', e);
        await showAlert('Network error updating order', 'error');
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Close modals on outside click
document.getElementById('item-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'item-modal') {
        closeItemModal();
    }
});

document.getElementById('order-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'order-modal') {
        closeOrderModal();
    }
});

// Handle escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const itemModal = document.getElementById('item-modal');
        const orderModal = document.getElementById('order-modal');
        
        if (itemModal && !itemModal.classList.contains('hidden')) {
            closeItemModal();
        } else if (orderModal && !orderModal.classList.contains('hidden')) {
            closeOrderModal();
        }
    }
});