// Market JavaScript - Improved with confirmation modal before purchase

let allItems = [];
let currentCategory = 'all';
let currentSort = 'price-asc';
let myOrders = [];
let userData = null; // Store user data

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadMarketItems();
    loadMyOrders();
});

// Load user data for auto-filling
async function loadUserData() {
    try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
            const data = await response.json();
            userData = data.user;
        }
    } catch (e) {
        console.error('Error loading user data:', e);
    }
}

// Load market items
async function loadMarketItems() {
    const itemsContainer = document.getElementById('market-items');
    
    try {
        const response = await fetch('/api/market/items');
        const data = await response.json();
        
        if (!response.ok) {
            itemsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading market items</p>
                </div>
            `;
            return;
        }

        allItems = data.items || [];
        renderItems();
        
    } catch (e) {
        console.error('Error loading items:', e);
        itemsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Network error loading items</p>
            </div>
        `;
    }
}

// Render items
function renderItems() {
    const itemsContainer = document.getElementById('market-items');
    
    // Filter items
    let filteredItems = allItems.filter(item => {
        // Category filter
        if (currentCategory !== 'all' && item.category !== currentCategory) {
            return false;
        }
        
        // Search filter
        const searchTerm = document.getElementById('item-search')?.value.toLowerCase() || '';
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && 
            !(item.description || '').toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        return true;
    });

    // Sort items
    filteredItems.sort((a, b) => {
        switch (currentSort) {
            case 'price-asc':
                return a.price - b.price;
            case 'price-desc':
                return b.price - a.price;
            case 'hours-asc':
                return (a.estimated_hours || 0) - (b.estimated_hours || 0);
            case 'hours-desc':
                return (b.estimated_hours || 0) - (a.estimated_hours || 0);
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });

    if (filteredItems.length === 0) {
        itemsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No items found</p>
            </div>
        `;
        return;
    }

    itemsContainer.innerHTML = filteredItems.map(item => {
        const isOutOfStock = item.stock_quantity === 0;
        const isLimited = item.stock_quantity > 0 && item.stock_quantity <= 10;
        
        return `
            <div class="market-item ${isOutOfStock ? 'item-out-of-stock' : ''}" 
                 onclick="${isOutOfStock ? '' : `openPurchaseModal('${item.id}')`}">
                <div class="item-image">
                    ${item.image_url ? 
                        `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-box\\'></i>';">` : 
                        '<i class="fas fa-box"></i>'
                    }
                </div>
                ${isLimited && !isOutOfStock ? `<div class="item-badge limited">Only ${item.stock_quantity} left</div>` : ''}
                <div class="item-content">
                    ${item.category ? `<span class="item-category">${item.category}</span>` : ''}
                    <h3 class="item-title">${item.name}</h3>
                    ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                    <div class="item-footer">
                        <div>
                            <div class="item-price">
                                ${item.price} Tiles
                            </div>
                        </div>
                        <button class="buy-btn" ${isOutOfStock ? 'disabled' : ''} 
                                onclick="event.stopPropagation(); ${isOutOfStock ? '' : `openPurchaseModal('${item.id}')`}">
                            ${isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Filter by category
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-category="${category}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    renderItems();
}

// Filter items by search
function filterItems() {
    renderItems();
}

// Sort items
function sortItems() {
    currentSort = document.getElementById('sort-select').value;
    renderItems();
}

// Open purchase modal
async function openPurchaseModal(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    
    const modal = document.getElementById('purchase-modal');
    const modalBody = document.getElementById('purchase-modal-body');
    
    // Generate contact info from user data (for backend, not shown to user)
    let contactInfo = '';
    if (userData) {
        const parts = [];
        if (userData.email) parts.push(userData.email);
        if (userData.slack_id) parts.push(`Slack: ${userData.slack_id}`);
        contactInfo = parts.join(' | ');
    }
    
    modalBody.innerHTML = `
        <div class="purchase-item-preview">
            <div class="preview-image">
                ${item.image_url ? 
                    `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-box\\'></i>';">` : 
                    '<i class="fas fa-box"></i>'
                }
            </div>
            <div class="preview-info">
                <h3>${item.name}</h3>
                <p>${item.description || 'No description available'}</p>
                <div class="preview-price">
                    ${item.price} Tiles
                </div>
            </div>
        </div>
        
        <form class="purchase-form" onsubmit="showPurchaseConfirmation(event, '${item.id}', '${item.name}', ${item.price}, '${contactInfo.replace(/'/g, "\\'")}')">
            <div class="form-group">
                <label for="quantity">Quantity *</label>
                <input type="number" id="quantity" min="1" ${item.stock_quantity > 0 ? `max="${item.stock_quantity}"` : ''} value="1" required>
                ${item.stock_quantity > 0 ? `<small>Available: ${item.stock_quantity}</small>` : '<small>Unlimited stock available</small>'}
            </div>
            
            <input type="hidden" id="contact-info" value="${contactInfo}">
            
            <div class="form-group">
                <label for="order-notes">Additional Notes (Optional)</label>
                <textarea id="order-notes" placeholder="Any special requests or delivery preferences..." rows="3"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closePurchaseModal()">Cancel</button>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-shopping-cart"></i> Continue to Checkout
                </button>
            </div>
        </form>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Show purchase confirmation modal
async function showPurchaseConfirmation(event, itemId, itemName, itemPrice, contactInfo) {
    event.preventDefault();
    
    const quantity = parseInt(document.getElementById('quantity').value);
    const notes = document.getElementById('order-notes').value.trim();
    const totalPrice = itemPrice * quantity;
    
    // Get current balance
    const currentBalance = userData ? userData.tiles_balance : 0;
    
    // Check if user has enough tiles
    if (currentBalance < totalPrice) {
        await showAlert(`Insufficient tiles! You need ${totalPrice} tiles but only have ${currentBalance}.`, 'error');
        return;
    }
    
    // Show confirmation modal
    const confirmed = await showConfirm(
        `Are you sure you want to purchase ${quantity}x ${itemName} for ${totalPrice} Tiles?\n\nTiles will be deducted immediately from your balance.\nAn admin will contact you to coordinate delivery.`,
        'Confirm Purchase'
    );
    
    if (confirmed) {
        await submitPurchase(itemId, quantity, contactInfo, notes, totalPrice);
    }
}

// Submit purchase
async function submitPurchase(itemId, quantity, contactInfo, notes, totalPrice) {
    if (!contactInfo) {
        await showAlert('Contact information is required', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/market/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_id: itemId,
                quantity: quantity,
                contact_info: contactInfo,
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            await showAlert(data.error || 'Error processing purchase', 'error');
            return;
        }

        await showAlert('Purchase successful! An admin will contact you soon.', 'success');
        closePurchaseModal();
        
        // Reload data
        await loadMarketItems();
        await loadMyOrders();
        
        // Update user data and balance
        if (data.new_balance !== undefined) {
            if (userData) {
                userData.tiles_balance = data.new_balance;
            }
            const balanceElement = document.querySelector('.balance-amount');
            if (balanceElement) {
                balanceElement.textContent = `${data.new_balance} tiles`;
            }
        }
        
    } catch (e) {
        console.error('Error submitting purchase:', e);
        await showAlert('Network error processing purchase', 'error');
    }
}

// Close purchase modal
function closePurchaseModal() {
    document.getElementById('purchase-modal').classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
}

// Load my orders
async function loadMyOrders() {
    const ordersContainer = document.getElementById('my-orders');
    
    try {
        const response = await fetch('/api/market/my-orders');
        const data = await response.json();
        
        if (!response.ok) {
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading orders</p>
                </div>
            `;
            return;
        }

        myOrders = data.orders || [];
        
        if (myOrders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <p>No orders yet</p>
                </div>
            `;
            return;
        }

        ordersContainer.innerHTML = myOrders.map(order => `
            <div class="order-card">
                <div class="order-info">
                    <div class="order-item-name">${order.item_name || 'Unknown Item'}</div>
                    <div class="order-details">
                        <span><i class="fas fa-calendar"></i> ${formatDate(order.created_at)}</span>
                        <span><i class="fas fa-hashtag"></i> Qty: ${order.quantity}</span>
                        <span><i class="fas fa-dice"></i> ${order.total_price} Tiles</span>
                    </div>
                    ${order.notes ? `<div style="margin-top: 8px; color: #999; font-size: 12px;">Note: ${order.notes}</div>` : ''}
                </div>
                <div class="order-status ${order.status}">
                    ${order.status}
                </div>
            </div>
        `).join('');
        
    } catch (e) {
        console.error('Error loading orders:', e);
        ordersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Network error loading orders</p>
            </div>
        `;
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

// Toggle orders sidebar
function toggleOrdersSidebar() {
    const sidebar = document.getElementById('orders-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isActive = sidebar.classList.contains('active');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Prevent background scrolling when sidebar is open
    if (!isActive) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Close modal on outside click
document.getElementById('purchase-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'purchase-modal') {
        closePurchaseModal();
    }
});

// Close sidebar on overlay click
document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    toggleOrdersSidebar();
});

// Handle escape key to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const purchaseModal = document.getElementById('purchase-modal');
        const sidebar = document.getElementById('orders-sidebar');
        
        if (purchaseModal && !purchaseModal.classList.contains('hidden')) {
            closePurchaseModal();
        } else if (sidebar && sidebar.classList.contains('active')) {
            toggleOrdersSidebar();
        }
    }
});