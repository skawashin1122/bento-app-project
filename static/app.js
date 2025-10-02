// ============================================
// グローバル変数
// ============================================
const API_BASE_URL = 'http://localhost:8000';
let menusData = [];
let cart = {}; // カート: {menuId: quantity}

// ============================================
// 初期化処理
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // メニュー一覧を取得
    loadMenus();
    
    // 注文フォームのイベントリスナー
    const orderForm = document.getElementById('order-form');
    orderForm.addEventListener('submit', handleOrderSubmit);
    
    // 注文履歴表示ボタンのイベントリスナー
    const loadHistoryBtn = document.getElementById('load-history-btn');
    loadHistoryBtn.addEventListener('click', loadOrderHistory);
    
    // モーダルのクローズボタン
    const closeBtn = document.querySelector('.close-btn');
    closeBtn.addEventListener('click', closeModal);
    
    // モーダルの外側をクリックしたら閉じる
    const modal = document.getElementById('modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
});

// ============================================
// メニュー関連の関数
// ============================================

/**
 * メニュー一覧を取得して表示
 */
async function loadMenus() {
    const menuList = document.getElementById('menu-list');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/menus`);
        
        if (!response.ok) {
            throw new Error('メニューの取得に失敗しました');
        }
        
        menusData = await response.json();
        
        if (menusData.length === 0) {
            menuList.innerHTML = '<p class="info-message">現在、メニューはありません。</p>';
            return;
        }
        
        // メニューカードを表示
        displayMenuCards(menusData);
        
    } catch (error) {
        console.error('メニュー取得エラー:', error);
        menuList.innerHTML = `<p class="error-message">メニューの読み込みに失敗しました: ${error.message}</p>`;
    }
}

/**
 * メニューカードを表示
 */
function displayMenuCards(menus) {
    const menuList = document.getElementById('menu-list');
    
    menuList.innerHTML = menus.map(menu => `
        <div class="menu-card" data-menu-id="${menu.id}">
            <h3>${menu.name}</h3>
            <div class="price">¥${menu.price.toLocaleString()}</div>
            <p class="description">${menu.description || '説明なし'}</p>
            <div class="quantity-controls">
                <button type="button" class="quantity-btn quantity-minus" onclick="updateQuantity(${menu.id}, -1)">-</button>
                <span class="quantity-display" id="quantity-${menu.id}">0</span>
                <button type="button" class="quantity-btn quantity-plus" onclick="updateQuantity(${menu.id}, 1)">+</button>
            </div>
            <span class="menu-id">ID: ${menu.id}</span>
        </div>
    `).join('');
}

// ============================================
// カート関連の関数
// ============================================

/**
 * 数量を更新する
 */
function updateQuantity(menuId, change) {
    const currentQuantity = cart[menuId] || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    
    if (newQuantity === 0) {
        delete cart[menuId];
    } else {
        cart[menuId] = newQuantity;
    }
    
    // UI更新
    updateQuantityDisplay(menuId, newQuantity);
    updateCartDisplay();
}

/**
 * 数量表示を更新
 */
function updateQuantityDisplay(menuId, quantity) {
    const quantityDisplay = document.getElementById(`quantity-${menuId}`);
    if (quantityDisplay) {
        quantityDisplay.textContent = quantity;
    }
}

/**
 * カート表示を更新
 */
function updateCartDisplay() {
    const cartContent = document.getElementById('cart-content');
    const cartSummary = document.getElementById('cart-summary');
    const orderForm = document.getElementById('order-form');
    const totalItemsDisplay = document.getElementById('total-items');
    const cartTotalPriceDisplay = document.getElementById('cart-total-price');
    
    const cartItems = Object.entries(cart);
    
    if (cartItems.length === 0) {
        // カートが空の場合
        cartContent.innerHTML = `
            <div class="cart-empty">
                <p>カートに商品がありません</p>
                <p class="cart-help">上記のメニューから「+」ボタンを押して商品を追加してください</p>
            </div>
        `;
        cartSummary.style.display = 'none';
        orderForm.style.display = 'none';
        return;
    }
    
    // カートの内容を表示
    let totalItems = 0;
    let totalPrice = 0;
    
    const cartItemsHTML = cartItems.map(([menuId, quantity]) => {
        const menu = menusData.find(m => m.id == menuId);
        if (!menu) return '';
        
        const itemTotal = menu.price * quantity;
        totalItems += quantity;
        totalPrice += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${menu.name}</h4>
                    <p class="cart-item-price">¥${menu.price.toLocaleString()} × ${quantity}</p>
                </div>
                <div class="cart-item-controls">
                    <button type="button" class="cart-btn cart-minus" onclick="updateQuantity(${menuId}, -1)">-</button>
                    <span class="cart-quantity">${quantity}</span>
                    <button type="button" class="cart-btn cart-plus" onclick="updateQuantity(${menuId}, 1)">+</button>
                </div>
                <div class="cart-item-total">¥${itemTotal.toLocaleString()}</div>
            </div>
        `;
    }).join('');
    
    cartContent.innerHTML = cartItemsHTML;
    
    // サマリー更新
    totalItemsDisplay.textContent = totalItems;
    cartTotalPriceDisplay.textContent = `¥${totalPrice.toLocaleString()}`;
    
    // 表示制御
    cartSummary.style.display = 'flex';
    orderForm.style.display = 'block';
}

// ============================================
// 注文関連の関数
// ============================================

/**
 * 注文フォームの送信処理
 */
async function handleOrderSubmit(e) {
    e.preventDefault();
    
    const userName = document.getElementById('user-name').value.trim();
    
    // バリデーション
    if (!userName) {
        showModal('お名前を入力してください。', 'error');
        return;
    }
    
    const cartItems = Object.entries(cart);
    if (cartItems.length === 0) {
        showModal('カートに商品を追加してください。', 'error');
        return;
    }
    
    try {
        // 複数の注文を順次送信
        const orderPromises = cartItems.map(([menuId, quantity]) => {
            return fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_name: userName,
                    menu_id: parseInt(menuId),
                    quantity: quantity
                })
            });
        });
        
        const responses = await Promise.all(orderPromises);
        
        // すべてのレスポンスが成功したかチェック
        for (const response of responses) {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '注文の送信に失敗しました');
            }
        }
        
        const orders = await Promise.all(responses.map(r => r.json()));
        
        // 成功メッセージを表示
        const totalPrice = orders.reduce((sum, order) => sum + order.total_price, 0);
        const totalItems = orders.reduce((sum, order) => sum + order.quantity, 0);
        
        showModal(
            `注文が完了しました！<br><br>
            <strong>合計商品数:</strong> ${totalItems}個<br>
            <strong>合計金額:</strong> ¥${totalPrice.toLocaleString()}<br>
            <strong>注文日時:</strong> ${formatDateTime(orders[0].ordered_at)}`,
            'success'
        );
        
        // カートをクリア
        cart = {};
        updateCartDisplay();
        
        // 全ての数量表示をリセット
        menusData.forEach(menu => {
            updateQuantityDisplay(menu.id, 0);
        });
        
        // フォームをリセット
        document.getElementById('order-form').reset();
        
    } catch (error) {
        console.error('注文送信エラー:', error);
        showModal(`注文の送信に失敗しました: ${error.message}`, 'error');
    }
}

// ============================================
// 注文履歴関連の関数
// ============================================

/**
 * 注文履歴を取得して表示
 */
async function loadOrderHistory() {
    const orderHistory = document.getElementById('order-history');
    orderHistory.innerHTML = '<p class="loading">注文履歴を読み込み中...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`);
        
        if (!response.ok) {
            throw new Error('注文履歴の取得に失敗しました');
        }
        
        const orders = await response.json();
        
        if (orders.length === 0) {
            orderHistory.innerHTML = '<p class="info-message">注文履歴はまだありません。</p>';
            return;
        }
        
        // 注文履歴を表示
        displayOrderHistory(orders);
        
    } catch (error) {
        console.error('注文履歴取得エラー:', error);
        orderHistory.innerHTML = `<p class="error-message">注文履歴の読み込みに失敗しました: ${error.message}</p>`;
    }
}

/**
 * 注文履歴をテーブルで表示
 */
function displayOrderHistory(orders) {
    const orderHistory = document.getElementById('order-history');
    
    const tableHTML = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>注文ID</th>
                    <th>注文者</th>
                    <th>メニュー</th>
                    <th>数量</th>
                    <th>合計金額</th>
                    <th>注文日時</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.user_name}</td>
                        <td>${order.menu_name}</td>
                        <td>${order.quantity}</td>
                        <td class="price-cell">¥${order.total_price.toLocaleString()}</td>
                        <td class="date-cell">${formatDateTime(order.ordered_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    orderHistory.innerHTML = tableHTML;
}

// ============================================
// モーダル関連の関数
// ============================================

/**
 * モーダルを表示
 */
function showModal(message, type = 'info') {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    
    modalMessage.innerHTML = message;
    modalMessage.className = `modal-message ${type}`;
    
    modal.classList.add('show');
}

/**
 * モーダルを閉じる
 */
function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
}

// ============================================
// ユーティリティ関数
// ============================================

/**
 * 日時をフォーマット
 */
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}
