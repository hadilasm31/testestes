// Admin functionality for LAMITI SHOP
class AdminManager {
    constructor() {
        this.isAdmin = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAdminSession();
    }

    bindEvents() {
        // Login form submission
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Login button click
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Enter key in login form
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        
        if (usernameInput && passwordInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAdminLogin();
                }
            });
            
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAdminLogin();
                }
            });
        }
    }

    checkAdminSession() {
        const adminSession = localStorage.getItem('lamiti-admin');
        if (adminSession) {
            try {
                const session = JSON.parse(adminSession);
                const now = new Date();
                const loginTime = new Date(session.loginTime);
                const sessionDuration = now - loginTime;
                
                // Check if session is still valid (1 hour)
                if (sessionDuration < 3600000) {
                    this.isAdmin = true;
                    this.showAdminDashboard();
                    this.loadAdminContent();
                } else {
                    // Session expired
                    localStorage.removeItem('lamiti-admin');
                }
            } catch (error) {
                console.error('Invalid admin session:', error);
                localStorage.removeItem('lamiti-admin');
            }
        }
    }

    handleAdminLogin() {
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value.trim();

        // Simple admin authentication (demo)
        if (username === 'admin' && password === 'lamiti2024') {
            this.isAdmin = true;
            
            // Save admin session
            localStorage.setItem('lamiti-admin', JSON.stringify({
                username,
                loginTime: new Date().toISOString()
            }));
            
            this.showAdminDashboard();
            this.showNotification('Connexion admin réussie!', 'success');
            this.loadAdminContent();
        } else {
            this.showNotification('Identifiants incorrects!', 'error');
            
            // Add shake animation to form
            const loginContainer = document.querySelector('.login-container');
            if (loginContainer) {
                loginContainer.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    loginContainer.style.animation = '';
                }, 500);
            }
        }
    }

    showAdminDashboard() {
        const loginSection = document.getElementById('admin-login');
        const dashboardSection = document.getElementById('admin-dashboard');
        
        if (loginSection && dashboardSection) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        }
    }

    loadAdminContent() {
        // Load dashboard stats
        this.loadDashboardStats();
        
        // Initialize charts
        this.initializeCharts();
        
        // Load products
        this.loadAdminProducts();
        
        // Load categories
        this.loadAdminCategories();
        
        // Load orders
        this.loadAdminOrders();
        
        // Load customers
        this.loadAdminCustomers();
    }

    loadDashboardStats() {
        if (!window.shop) return;
        
        const totalProducts = window.shop.products.length;
        const totalOrders = window.shop.orders.length;
        const totalRevenue = window.shop.orders.reduce((sum, order) => sum + order.total, 0);
        const lowStockItems = window.shop.products.filter(p => p.stock < 5).length;
        const pendingOrders = window.shop.orders.filter(o => o.status === 'pending').length;
        const completedOrders = window.shop.orders.filter(o => o.status === 'delivered').length;
        
        const elements = {
            'total-products': totalProducts,
            'total-orders': totalOrders,
            'total-revenue': window.shop.formatPrice(totalRevenue),
            'low-stock-items': lowStockItems,
            'pending-orders': pendingOrders,
            'completed-orders': completedOrders
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    initializeCharts() {
        // Initialize charts if ECharts is available
        if (typeof echarts !== 'undefined') {
            this.updateSalesChart();
            this.updateCategoriesChart();
        }
    }

    updateSalesChart() {
        const salesChart = echarts.init(document.getElementById('sales-chart'));
        if (salesChart) {
            const salesOption = {
                title: {
                    text: 'Ventes des 6 derniers mois',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis'
                },
                xAxis: {
                    type: 'category',
                    data: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        formatter: '{value} FCFA'
                    }
                },
                series: [{
                    data: [120000, 200000, 150000, 80000, 70000, 110000],
                    type: 'line',
                    smooth: true,
                    itemStyle: {
                        color: '#d4af37'
                    },
                    areaStyle: {
                        color: 'rgba(212, 175, 55, 0.3)'
                    }
                }]
            };
            salesChart.setOption(salesOption);
        }
    }

    updateCategoriesChart() {
        const categoriesChart = echarts.init(document.getElementById('categories-chart'));
        if (categoriesChart && window.shop) {
            const categoryStats = window.shop.getCategoryStats();
            const chartData = Object.entries(categoryStats).map(([name, value]) => ({
                value: value,
                name: name.charAt(0).toUpperCase() + name.slice(1)
            }));

            const categoriesOption = {
                title: {
                    text: 'Répartition par catégorie',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item'
                },
                series: [{
                    type: 'pie',
                    radius: '50%',
                    data: chartData,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            };
            categoriesChart.setOption(categoriesOption);
        }
    }

    loadAdminProducts() {
        if (!window.shop) return;
        
        const productsTable = document.getElementById('products-table');
        if (!productsTable) return;

        const products = window.shop.products;
        
        let html = `
            <div class="table-header">
                <div>Image</div>
                <div>Nom</div>
                <div>Catégorie</div>
                <div>Prix</div>
                <div>Stock</div>
                <div>Statut</div>
                <div>Actions</div>
            </div>
        `;
        
        products.forEach(product => {
            const stockClass = product.stock < 5 ? 'text-red-600 font-semibold' : '';
            const statusClass = product.active ? 'status-confirmed' : 'status-cancelled';
            const statusText = product.active ? 'Actif' : 'Inactif';
            const toggleIcon = product.active ? '✅' : '⏸️';
            
            html += `
                <div class="table-row">
                    <div class="table-image">
                        <img src="${product.images[0] || 'resources/product-placeholder.jpg'}" alt="${product.name}">
                    </div>
                    <div>
                        <div class="font-semibold">${product.name}</div>
                        <div class="text-sm text-gray-600">
                            ${product.description.substring(0, 50)}...
                        </div>
                    </div>
                    <div class="capitalize">${product.category}</div>
                    <div class="font-semibold">${window.shop.formatPrice(product.price)}</div>
                    <div class="${stockClass}">${product.stock}</div>
                    <div>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="table-actions">
                        <button class="action-btn edit-btn" onclick="editProduct('${product.id}')">✏️</button>
                        <button class="action-btn toggle-btn ${product.active ? 'active' : ''}" onclick="toggleProduct('${product.id}')">
                            ${toggleIcon}
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        productsTable.innerHTML = html;
    }

    loadAdminCategories() {
        if (!window.shop) return;
        
        const categoriesGrid = document.getElementById('categories-grid');
        if (!categoriesGrid) return;

        let html = '';
        
        window.shop.categories.forEach(category => {
            const subcategories = window.shop.subcategories[category] || [];
            const productCount = window.shop.products.filter(p => p.category === category).length;
            const categoryImage = window.shop.categoryImages ? window.shop.categoryImages[category] : null;
            
            html += `
                <div class="category-card">
                    <div class="category-header">
                        <div class="category-name capitalize">${category}</div>
                        <div class="category-actions">
                            <button class="action-btn edit-btn" onclick="editCategory('${category}')">✏️</button>
                            <button class="action-btn delete-btn" onclick="deleteCategory('${category}')">🗑️</button>
                        </div>
                    </div>
                    <div class="category-image">
                        <img src="${categoryImage || 'resources/category-placeholder.jpg'}" alt="${category}">
                        <div class="category-image-actions">
                            <button class="action-btn edit-btn" onclick="changeCategoryImage('${category}')">📷</button>
                        </div>
                    </div>
                    <div class="subcategories">
                        <div class="text-sm text-gray-600 mb-2">Sous-catégories:</div>
                        <div class="subcategory-list" id="subcategory-list-${category}">
                            ${subcategories.map(sub => `
                                <span class="subcategory-tag">
                                    ${sub}
                                    <button class="remove-subcategory" onclick="removeSubcategory('${category}', '${sub}')">&times;</button>
                                </span>
                            `).join('')}
                        </div>
                        <div class="add-subcategory-form">
                            <input type="text" class="add-subcategory-input" id="subcategory-input-${category}" placeholder="Nouvelle sous-catégorie">
                            <button class="add-subcategory-btn" onclick="addSubcategory('${category}')">+</button>
                        </div>
                    </div>
                    <div class="mt-4 text-sm text-gray-600">
                        ${productCount} produit(s) dans cette catégorie
                    </div>
                </div>
            `;
        });
        
        categoriesGrid.innerHTML = html;
    }

    loadAdminOrders() {
        if (!window.shop) return;
        
        const ordersTable = document.getElementById('orders-table');
        if (!ordersTable) return;

        ordersTable.innerHTML = `
            <div class="table-header">
                <div>ID</div>
                <div>Client</div>
                <div>Date</div>
                <div>Total</div>
                <div>Statut</div>
                <div>Actions</div>
            </div>
            ${window.shop.orders.map(order => `
                <div class="table-row">
                    <div class="font-mono text-sm">${order.id}</div>
                    <div>
                        <div class="font-semibold">${order.customer.firstName} ${order.customer.lastName}</div>
                        <div class="text-sm text-gray-600">${order.customer.email}</div>
                    </div>
                    <div class="text-sm">${new Date(order.orderDate).toLocaleDateString('fr-FR')}</div>
                    <div class="font-semibold">${window.shop.formatPrice(order.total)}</div>
                    <div>
                        <span class="order-status status-${order.status}">
                            ${this.getStatusLabel(order.status)}
                        </span>
                    </div>
                    <div class="table-actions">
                        <button class="action-btn edit-btn" onclick="viewOrderDetails('${order.id}')">👁️</button>
                        <button class="action-btn edit-btn" onclick="updateOrderStatus('${order.id}')">🔄</button>
                        <button class="action-btn delete-btn" onclick="deleteOrder('${order.id}')">🗑️</button>
                    </div>
                </div>
            `).join('')}
        `;
    }

    loadAdminCustomers() {
        if (!window.shop) return;
        
        const customersTable = document.getElementById('customers-table');
        if (!customersTable) return;

        // Get unique customers
        const customers = {};
        window.shop.orders.forEach(order => {
            const email = order.customer.email;
            if (!customers[email]) {
                customers[email] = {
                    ...order.customer,
                    orders: [],
                    totalSpent: 0
                };
            }
            customers[email].orders.push(order);
            customers[email].totalSpent += order.total;
        });
        
        customersTable.innerHTML = `
            <div class="table-header">
                <div>Nom</div>
                <div>Email</div>
                <div>Téléphone</div>
                <div>Commandes</div>
                <div>Total dépensé</div>
                <div>Dernière commande</div>
            </div>
            ${Object.values(customers).map(customer => `
                <div class="table-row">
                    <div class="font-semibold">${customer.firstName} ${customer.lastName}</div>
                    <div>${customer.email}</div>
                    <div>${customer.phone}</div>
                    <div class="text-center">${customer.orders.length}</div>
                    <div class="font-semibold">${window.shop.formatPrice(customer.totalSpent)}</div>
                    <div class="text-sm">
                        ${customer.orders.length > 0 ? 
                            new Date(Math.max(...customer.orders.map(o => new Date(o.orderDate)))).toLocaleDateString('fr-FR') : 
                            'N/A'
                        }
                    </div>
                </div>
            `).join('')}
        `;
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'shipped': 'Expédiée',
            'delivered': 'Livrée',
            'cancelled': 'Annulée'
        };
        return labels[status] || status;
    }

    logout() {
        localStorage.removeItem('lamiti-admin');
        this.isAdmin = false;
        location.reload();
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }

    // Load low stock products
    loadLowStockProducts() {
        if (!window.shop) return;
        
        const lowStockProducts = window.shop.getLowStockProducts();
        const productsTable = document.getElementById('products-table');
        if (!productsTable) return;

        let html = `
            <div class="table-header">
                <div>Image</div>
                <div>Nom</div>
                <div>Catégorie</div>
                <div>Prix</div>
                <div>Stock</div>
                <div>Statut</div>
                <div>Actions</div>
            </div>
        `;
        
        lowStockProducts.forEach(product => {
            const stockClass = 'text-red-600 font-semibold';
            const statusClass = product.active ? 'status-confirmed' : 'status-cancelled';
            const statusText = product.active ? 'Actif' : 'Inactif';
            const toggleIcon = product.active ? '✅' : '⏸️';
            
            html += `
                <div class="table-row">
                    <div class="table-image">
                        <img src="${product.images[0] || 'resources/product-placeholder.jpg'}" alt="${product.name}">
                    </div>
                    <div>
                        <div class="font-semibold">${product.name}</div>
                        <div class="text-sm text-gray-600">
                            ${product.description.substring(0, 50)}...
                        </div>
                    </div>
                    <div class="capitalize">${product.category}</div>
                    <div class="font-semibold">${window.shop.formatPrice(product.price)}</div>
                    <div class="${stockClass}">
                        <input type="number" id="stock-${product.id}" value="${product.stock}" min="0" class="stock-input">
                        <button class="update-stock-btn" onclick="updateProductStock('${product.id}')">💾</button>
                    </div>
                    <div>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="table-actions">
                        <button class="action-btn edit-btn" onclick="editProduct('${product.id}')">✏️</button>
                        <button class="action-btn toggle-btn ${product.active ? 'active' : ''}" onclick="toggleProduct('${product.id}')">
                            ${toggleIcon}
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        productsTable.innerHTML = html;
    }
}

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});

// Global functions for admin interface
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName + '-section').classList.add('active');
    
    // Update sidebar menu
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load section content
    switch(sectionName) {
        case 'dashboard':
            window.adminManager.loadDashboardStats();
            window.adminManager.initializeCharts();
            break;
        case 'products':
            window.adminManager.loadAdminProducts();
            break;
        case 'categories':
            window.adminManager.loadAdminCategories();
            break;
        case 'orders':
            window.adminManager.loadAdminOrders();
            break;
        case 'customers':
            window.adminManager.loadAdminCustomers();
            break;
        case 'analytics':
            loadDetailedAnalytics();
            break;
        case 'low-stock':
            window.adminManager.loadLowStockProducts();
            break;
    }
}

function editProduct(productId) {
    if (window.shop) {
        // Find the product
        const product = window.shop.products.find(p => p.id === productId);
        if (product) {
            // Open the add product modal in edit mode
            openAddProductModal();
            
            // Set the modal to edit mode
            document.getElementById('modal-title').textContent = 'Modifier le produit';
            currentEditingProduct = productId;
            
            // Populate form with product data
            const form = document.getElementById('add-product-form');
            form.name.value = product.name;
            form.category.value = product.category;
            form.price.value = product.price;
            form.originalPrice.value = product.originalPrice || '';
            form.stock.value = product.stock;
            form.sizes.value = product.sizes.join(', ');
            form.colors.value = product.colors.join(', ');
            form.description.value = product.description;
            form.featured.checked = product.featured;
            form.onSale.checked = product.onSale;
            
            // Populate category select
            const categorySelect = document.getElementById('product-category-select');
            categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
            if (window.shop && window.shop.categories) {
                window.shop.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                    categorySelect.appendChild(option);
                });
            }
            categorySelect.value = product.category;

            // Populate uploaded images
            uploadedImages = [...product.images];
            const uploadedImagesContainer = document.getElementById('uploaded-images');
            uploadedImagesContainer.innerHTML = '';
            uploadedImages.forEach((image, index) => {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'uploaded-image';
                imageDiv.innerHTML = `
                    <img src="${image}" alt="Uploaded">
                    <button class="remove-image" onclick="removeUploadedImage('${image}')">&times;</button>
                `;
                uploadedImagesContainer.appendChild(imageDiv);
            });
        }
    }
}

function toggleProduct(productId) {
    if (window.shop) {
        window.shop.toggleProductStatus(productId);
        // Reload the products table
        if (window.adminManager) {
            window.adminManager.loadAdminProducts();
        }
    }
}

function deleteProduct(productId) {
    if (window.shop) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            window.shop.deleteProduct(productId);
            // Reload the products table
            if (window.adminManager) {
                window.adminManager.loadAdminProducts();
                window.adminManager.updateCategoriesChart();
            }
        }
    }
}

function editCategory(categoryName) {
    const newName = prompt('Modifier le nom de la catégorie:', categoryName);
    if (newName && newName.trim() && newName !== categoryName) {
        if (window.shop) {
            // Update category name in categories array
            const index = window.shop.categories.indexOf(categoryName);
            if (index !== -1) {
                window.shop.categories[index] = newName.trim().toLowerCase();
                
                // Update subcategories reference
                window.shop.subcategories[newName] = window.shop.subcategories[categoryName] || [];
                delete window.shop.subcategories[categoryName];
                
                // Update category image
                if (window.shop.categoryImages && window.shop.categoryImages[categoryName]) {
                    window.shop.categoryImages[newName] = window.shop.categoryImages[categoryName];
                    delete window.shop.categoryImages[categoryName];
                }
                
                // Update products with this category
                window.shop.products.forEach(product => {
                    if (product.category === categoryName) {
                        product.category = newName.trim().toLowerCase();
                    }
                });
                
                window.shop.saveCategories();
                window.shop.saveProducts();
                window.shop.showNotification('Catégorie modifiée avec succès!', 'success');
                
                // Reload categories and products
                if (window.adminManager) {
                    window.adminManager.loadAdminCategories();
                    window.adminManager.loadAdminProducts();
                    window.adminManager.updateCategoriesChart();
                }
            }
        }
    }
}

function deleteCategory(categoryName) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ? Cette action est irréversible.`)) {
        if (window.shop) {
            if (window.shop.deleteCategory(categoryName)) {
                // Reload categories
                if (window.adminManager) {
                    window.adminManager.loadAdminCategories();
                    window.adminManager.updateCategoriesChart();
                }
            }
        }
    }
}

function addSubcategory(categoryName) {
    const input = document.getElementById(`subcategory-input-${categoryName}`);
    if (input && window.shop) {
        const subcategoryName = input.value.trim();
        
        if (!subcategoryName) {
            window.shop.showNotification('Veuillez entrer un nom de sous-catégorie', 'error');
            return;
        }
        
        if (!window.shop.subcategories[categoryName]) {
            window.shop.subcategories[categoryName] = [];
        }
        
        if (!window.shop.subcategories[categoryName].includes(subcategoryName)) {
            window.shop.subcategories[categoryName].push(subcategoryName);
            window.shop.saveCategories();
            window.shop.showNotification('Sous-catégorie ajoutée avec succès!', 'success');
            input.value = '';
            
            // Reload categories
            if (window.adminManager) {
                window.adminManager.loadAdminCategories();
            }
        } else {
            window.shop.showNotification('Cette sous-catégorie existe déjà!', 'error');
        }
    }
}

function removeSubcategory(categoryName, subcategoryName) {
    if (confirm(`Supprimer la sous-catégorie "${subcategoryName}" ?`)) {
        if (window.shop) {
            window.shop.subcategories[categoryName] = window.shop.subcategories[categoryName].filter(
                sub => sub !== subcategoryName
            );
            window.shop.saveCategories();
            window.shop.showNotification('Sous-catégorie supprimée!', 'info');
            
            // Reload categories
            if (window.adminManager) {
                window.adminManager.loadAdminCategories();
            }
        }
    }
}

function viewOrderDetails(orderId) {
    if (window.shop) {
        const order = window.shop.orders.find(o => o.id === orderId);
        if (order) {
            currentEditingOrder = orderId;
            
            const content = `
                <div class="order-info">
                    <div class="order-section">
                        <h3 class="font-semibold mb-3">Informations client</h3>
                        <div class="space-y-2">
                            <div><strong>Nom:</strong> ${order.customer.firstName} ${order.customer.lastName}</div>
                            <div><strong>Email:</strong> ${order.customer.email}</div>
                            <div><strong>Téléphone:</strong> ${order.customer.phone}</div>
                        </div>
                    </div>
                    
                    <div class="order-section">
                        <h3 class="font-semibold mb-3">Adresse de livraison</h3>
                        <div class="space-y-2">
                            <div><strong>Adresse:</strong> ${order.shippingAddress.address}</div>
                            <div><strong>Ville:</strong> ${order.shippingAddress.city}</div>
                            <div><strong>Code postal:</strong> ${order.shippingAddress.zipCode}</div>
                            <div><strong>Pays:</strong> ${order.shippingAddress.country}</div>
                        </div>
                    </div>
                </div>
                
                <div class="order-section">
                    <h3 class="font-semibold mb-3">Informations de commande</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div><strong>ID:</strong> ${order.id}</div>
                        <div><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString('fr-FR')}</div>
                        <div><strong>Statut:</strong> <span class="order-status status-${order.status}">${getStatusLabel(order.status)}</span></div>
                        <div><strong>Paiement:</strong> ${order.paymentMethod === 'card' ? 'Carte bancaire' : 'Paiement mobile'}</div>
                        <div><strong>Total:</strong> ${window.shop.formatPrice(order.total)}</div>
                        <div><strong>Code suivi:</strong> ${order.trackingCode}</div>
                    </div>
                </div>
                
                <div class="order-items">
                    <h3 class="font-semibold mb-3">Articles commandés</h3>
                    ${order.items.map(item => {
                        const product = window.shop.products.find(p => p.id === item.productId);
                        return `
                            <div class="order-item">
                                <div class="order-item-image">
                                    <img src="${product ? product.images[0] : ''}" alt="${product ? product.name : 'Produit'}">
                                </div>
                                <div class="flex-1">
                                    <div class="font-semibold">${product ? product.name : 'Produit inconnu'}</div>
                                    <div class="text-sm text-gray-600">
                                        ${item.size ? `Taille: ${item.size}` : ''}
                                        ${item.color ? `Couleur: ${item.color}` : ''}
                                        Quantité: ${item.quantity}
                                    </div>
                                    <div class="font-semibold text-right">
                                        ${window.shop.formatPrice(product ? product.price * item.quantity : 0)}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="flex gap-4 mt-6">
                    <button class="add-product-btn" onclick="updateOrderStatus('${order.id}')">
                        Mettre à jour le statut
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteOrder('${order.id}')">
                        Supprimer la commande
                    </button>
                </div>
            `;
            
            document.getElementById('order-details-content').innerHTML = content;
            
            const modal = document.getElementById('order-details-modal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    }
}

function updateOrderStatus(orderId) {
    if (window.shop) {
        const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        const order = window.shop.orders.find(o => o.id === orderId);
        if (order) {
            const currentIndex = statuses.indexOf(order.status);
            const nextIndex = (currentIndex + 1) % statuses.length;
            const newStatus = statuses[nextIndex];
            
            window.shop.updateOrderStatus(orderId, newStatus);
            window.shop.showNotification(`Statut mis à jour: ${getStatusLabel(newStatus)}`, 'success');
            
            // Reload orders
            if (window.adminManager) {
                window.adminManager.loadAdminOrders();
            }
        }
    }
}

function deleteOrder(orderId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
        if (window.shop) {
            window.shop.orders = window.shop.orders.filter(o => o.id !== orderId);
            localStorage.setItem('lamiti-orders', JSON.stringify(window.shop.orders));
            window.shop.showNotification('Commande supprimée avec succès!', 'info');
            
            // Reload orders
            if (window.adminManager) {
                window.adminManager.loadAdminOrders();
            }
            
            closeOrderDetailsModal();
        }
    }
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'En attente',
        'confirmed': 'Confirmée',
        'shipped': 'Expédiée',
        'delivered': 'Livrée',
        'cancelled': 'Annulée'
    };
    return labels[status] || status;
}

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .category-image {
        position: relative;
    }
    
    .category-image-actions {
        position: absolute;
        top: 10px;
        right: 10px;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .category-card:hover .category-image-actions {
        opacity: 1;
    }
    
    .stock-input {
        width: 60px;
        padding: 4px;
        border: 1px solid #ddd;
        border-radius: 4px;
        text-align: center;
    }
    
    .update-stock-btn {
        background: #27ae60;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 5px;
    }
    
    .update-stock-btn:hover {
        background: #219a52;
    }
`;
document.head.appendChild(style);

// Global variables
let uploadedImages = [];
let currentEditingProduct = null;
let currentEditingOrder = null;
let currentEditingCategory = null;
let categoryImages = [];

// Modal functions
function openAddProductModal() {
    currentEditingProduct = null;
    document.getElementById('modal-title').textContent = 'Ajouter un produit';
    document.getElementById('add-product-form').reset();
    uploadedImages = [];
    document.getElementById('uploaded-images').innerHTML = '';
    
    // Populate category select
    const categorySelect = document.getElementById('product-category-select');
    categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
    if (window.shop && window.shop.categories) {
        window.shop.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categorySelect.appendChild(option);
        });
    }
    
    const modal = document.getElementById('add-product-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Reset form
    document.getElementById('add-product-form').reset();
    uploadedImages = [];
    document.getElementById('uploaded-images').innerHTML = '';
    currentEditingProduct = null;
}

function openAddCategoryModal() {
    document.getElementById('add-category-form').reset();
    categoryImages = [];
    document.getElementById('category-uploaded-images').innerHTML = '';
    
    const modal = document.getElementById('add-category-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAddCategoryModal() {
    const modal = document.getElementById('add-category-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Reset form
    document.getElementById('add-category-form').reset();
    categoryImages = [];
    document.getElementById('category-uploaded-images').innerHTML = '';
}

function closeOrderDetailsModal() {
    const modal = document.getElementById('order-details-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    currentEditingOrder = null;
}

// Image handling functions
function handleImageUpload(event) {
    const files = event.target.files;
    const uploadedImagesContainer = document.getElementById('uploaded-images');
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedImages.push(e.target.result);
                
                const imageDiv = document.createElement('div');
                imageDiv.className = 'uploaded-image';
                imageDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Uploaded">
                    <button class="remove-image" onclick="removeUploadedImage('${e.target.result}')">&times;</button>
                `;
                
                uploadedImagesContainer.appendChild(imageDiv);
            };
            reader.readAsDataURL(file);
        }
    });
}

function handleCategoryImageUpload(event) {
    const files = event.target.files;
    const uploadedImagesContainer = document.getElementById('category-uploaded-images');
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                categoryImages = [e.target.result]; // Only one image for category
                
                const imageDiv = document.createElement('div');
                imageDiv.className = 'uploaded-image';
                imageDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Uploaded">
                    <button class="remove-image" onclick="removeCategoryImage('${e.target.result}')">&times;</button>
                `;
                
                uploadedImagesContainer.innerHTML = '';
                uploadedImagesContainer.appendChild(imageDiv);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeUploadedImage(imageSrc) {
    uploadedImages = uploadedImages.filter(img => img !== imageSrc);
    const imageDiv = document.querySelector(`img[src="${imageSrc}"]`).parentElement;
    imageDiv.remove();
}

function removeCategoryImage(imageSrc) {
    categoryImages = categoryImages.filter(img => img !== imageSrc);
    const imageDiv = document.querySelector(`img[src="${imageSrc}"]`).parentElement;
    imageDiv.remove();
}

// Form handlers
function handleAddProduct(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productData = {
        name: formData.get('name'),
        category: formData.get('category'),
        price: parseInt(formData.get('price')),
        originalPrice: parseInt(formData.get('originalPrice')) || null,
        stock: parseInt(formData.get('stock')),
        sizes: formData.get('sizes').split(',').map(s => s.trim()).filter(s => s),
        colors: formData.get('colors').split(',').map(s => s.trim()).filter(s => s),
        description: formData.get('description'),
        featured: formData.has('featured'),
        onSale: formData.has('onSale'),
        images: uploadedImages.length > 0 ? uploadedImages : ['resources/product-placeholder.jpg']
    };
    
    if (currentEditingProduct) {
        // Update existing product
        window.shop.updateProduct(currentEditingProduct, productData);
        window.shop.showNotification('Produit mis à jour avec succès!', 'success');
    } else {
        // Add new product
        window.shop.addProduct(productData);
    }
    
    closeAddProductModal();
    window.adminManager.loadAdminProducts();
    window.adminManager.updateCategoriesChart();
}

function handleAddCategory(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const categoryData = {
        name: formData.get('name').trim().toLowerCase(),
        subcategories: formData.get('subcategories').split(',').map(s => s.trim()).filter(s => s),
        image: categoryImages.length > 0 ? categoryImages[0] : null
    };
    
    if (window.shop.addCategory(categoryData.name, categoryData.subcategories, categoryData.image)) {
        closeAddCategoryModal();
        window.adminManager.loadAdminCategories();
        window.adminManager.updateCategoriesChart();
    }
}

// Stock management
function updateProductStock(productId) {
    const stockInput = document.getElementById(`stock-${productId}`);
    if (stockInput && window.shop) {
        const newStock = parseInt(stockInput.value);
        if (!isNaN(newStock) && newStock >= 0) {
            const product = window.shop.products.find(p => p.id === productId);
            if (product) {
                product.stock = newStock;
                window.shop.saveProducts();
                window.shop.showNotification('Stock mis à jour!', 'success');
                
                // Reload low stock products
                window.adminManager.loadLowStockProducts();
                window.adminManager.loadDashboardStats();
            }
        }
    }
}

// Category image change
function changeCategoryImage(categoryName) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                if (window.shop) {
                    if (!window.shop.categoryImages) {
                        window.shop.categoryImages = {};
                    }
                    window.shop.categoryImages[categoryName] = e.target.result;
                    window.shop.saveCategoryImages();
                    window.shop.showNotification('Image de catégorie mise à jour!', 'success');
                    window.adminManager.loadAdminCategories();
                }
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// Detailed analytics
function loadDetailedAnalytics() {
    if (typeof echarts !== 'undefined') {
        // Detailed Sales Chart
        const detailedSalesChart = echarts.init(document.getElementById('detailed-sales-chart'));
        const detailedSalesOption = {
            title: {
                text: 'Analyse détaillée des ventes',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['Ventes', 'Bénéfices', 'Commandes']
            },
            xAxis: {
                type: 'category',
                data: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'FCFA',
                    axisLabel: {
                        formatter: '{value} FCFA'
                    }
                },
                {
                    type: 'value',
                    name: 'Commandes',
                    axisLabel: {
                        formatter: '{value}'
                    }
                }
            ],
            series: [
                {
                    name: 'Ventes',
                    type: 'bar',
                    data: [120000, 200000, 150000, 80000, 70000, 110000],
                    itemStyle: {
                        color: '#d4af37'
                    }
                },
                {
                    name: 'Bénéfices',
                    type: 'line',
                    data: [30000, 50000, 35000, 20000, 15000, 25000],
                    itemStyle: {
                        color: '#27ae60'
                    }
                },
                {
                    name: 'Commandes',
                    type: 'line',
                    yAxisIndex: 1,
                    data: [12, 25, 18, 10, 8, 15],
                    itemStyle: {
                        color: '#3498db'
                    }
                }
            ]
        };
        detailedSalesChart.setOption(detailedSalesOption);
        
        // Products Performance Chart
        const productsChart = echarts.init(document.getElementById('products-performance-chart'));
        const productsOption = {
            title: {
                text: 'Performance des produits',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: ['Sac Cuir', 'Blazer', 'Montre', 'Lunettes', 'Robe', 'Chemise']
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: '{value}'
                }
            },
            series: [{
                name: 'Ventes',
                type: 'bar',
                data: [8, 15, 5, 12, 10, 7],
                itemStyle: {
                    color: '#d4af37'
                }
            }]
        };
        productsChart.setOption(productsOption);
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeAddProductModal();
        closeAddCategoryModal();
        closeOrderDetailsModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAddProductModal();
        closeAddCategoryModal();
        closeOrderDetailsModal();
    }
});

// Listen for data updates
document.addEventListener('shopDataUpdate', function() {
    if (window.adminManager && window.adminManager.isAdmin) {
        window.adminManager.loadDashboardStats();
        window.adminManager.updateCategoriesChart();
    }
});