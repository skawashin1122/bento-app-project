// ============================================
// グローバル変数
// ============================================
const API_BASE_URL = 'http://localhost:8000';
let menusData = [];

// ============================================
// 初期化処理
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // メニュー一覧を取得
    loadMenus();
    
    // 注文フォームのイベントリスナー
    const orderForm = document.getElementById('order-form');
    orderForm.addEventListener('submit', handleOrderSubmit);
    
    // メニュー選択と数量変更のイベントリスナー
    const menuSelect = document.getElementById('menu-select');
    const quantityInput = document.getElementById('quantity');
    menuSelect.addEventListener('change', updateTotalPrice);
    quantityInput.addEventListener('input', updateTotalPrice);
    
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
        
        // セレクトボックスにメニューを追加
        populateMenuSelect(menusData);
        
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
            <span class="menu-id">ID: ${menu.id}</span>
        </div>
    `).join('');
}

/**
 * セレクトボックスにメニューを追加
 */
function populateMenuSelect(menus) {
    const menuSelect = document.getElementById('menu-select');
    
    // 既存のオプション（最初の選択肢）以外をクリア
    menuSelect.innerHTML = '<option value="">-- メニューを選択してください --</option>';
    
    menus.forEach(menu => {
        const option = document.createElement('option');
        option.value = menu.id;
        option.textContent = `${menu.name} (¥${menu.price.toLocaleString()})`;
        option.dataset.price = menu.price;
        menuSelect.appendChild(option);
    });
}

/**
 * 合計金額を更新
 */
function updateTotalPrice() {
    const menuSelect = document.getElementById('menu-select');
    const quantityInput = document.getElementById('quantity');
    const totalPriceDisplay = document.getElementById('total-price');
    
    const selectedOption = menuSelect.options[menuSelect.selectedIndex];
    const price = selectedOption ? parseInt(selectedOption.dataset.price) || 0 : 0;
    const quantity = parseInt(quantityInput.value) || 0;
    
    const totalPrice = price * quantity;
    totalPriceDisplay.textContent = `¥${totalPrice.toLocaleString()}`;
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
    const menuId = parseInt(document.getElementById('menu-select').value);
    const quantity = parseInt(document.getElementById('quantity').value);
    
    // バリデーション
    if (!userName) {
        showModal('お名前を入力してください。', 'error');
        return;
    }
    
    if (!menuId) {
        showModal('メニューを選択してください。', 'error');
        return;
    }
    
    if (quantity < 1) {
        showModal('数量は1以上を指定してください。', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_name: userName,
                menu_id: menuId,
                quantity: quantity
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '注文の送信に失敗しました');
        }
        
        const orderData = await response.json();
        
        // 成功メッセージを表示
        showModal(
            `注文が完了しました！<br><br>
            <strong>注文ID:</strong> ${orderData.id}<br>
            <strong>メニュー:</strong> ${orderData.menu_name}<br>
            <strong>数量:</strong> ${orderData.quantity}<br>
            <strong>合計金額:</strong> ¥${orderData.total_price.toLocaleString()}<br>
            <strong>注文日時:</strong> ${formatDateTime(orderData.ordered_at)}`,
            'success'
        );
        
        // フォームをリセット
        document.getElementById('order-form').reset();
        updateTotalPrice();
        
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
