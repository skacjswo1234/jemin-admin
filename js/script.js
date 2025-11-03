// 전역 변수
let properties = [];

// 로컬 스토리지에서 데이터 로드
function loadFromStorage() {
    const stored = localStorage.getItem('properties');
    if (stored) {
        properties = JSON.parse(stored);
    } else {
        // 더미 데이터 추가 (최초 실행시)
        properties = [
            {
                id: Date.now(),
                buildingName: '강남타워',
                roomNumber: '1503',
                deposit: 5000,
                monthlyRent: 50,
                password: '1234#',
                moveIn: '전입',
                status: '임대중',
                options: ['에어컨', '냉장고', '세탁기', '침대'],
                notes: '깨끗하게 관리되고 있습니다. 역 근처 편리한 위치.',
                contact: '010-1234-5678',
                createdAt: new Date().toISOString()
            }
        ];
        saveToStorage();
    }
    updateDashboard();
    renderPropertiesList();
    renderStats();
}

// 로컬 스토리지에 저장
function saveToStorage() {
    localStorage.setItem('properties', JSON.stringify(properties));
}

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadFromStorage();
    initializeEventListeners();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    // 사이드바 토글
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    sidebarToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (window.innerWidth <= 1024) {
            // 모바일: active 클래스만 토글
            sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        } else {
            // 데스크톱: collapsed 클래스 토글
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    });

    // 모바일에서 사이드바 외부 클릭 시 닫기
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1024) {
            const isClickInsideSidebar = sidebar.contains(e.target);
            const isClickOnToggle = sidebarToggle.contains(e.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        }
    });

    // 네비게이션 클릭
    const navItems = document.querySelectorAll('.nav-item a');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);

            // 활성 상태 업데이트
            navItems.forEach(nav => nav.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');

            // 모바일에서 메뉴 클릭 시 사이드바 자동 닫기
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    });

    // 폼 제출
    const propertyForm = document.getElementById('propertyForm');
    propertyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addProperty();
    });

    // 검색
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        renderPropertiesList();
    });

    // 필터
    const filterMoveIn = document.getElementById('filterMoveIn');
    const filterStatus = document.getElementById('filterStatus');
    filterMoveIn.addEventListener('change', renderPropertiesList);
    filterStatus.addEventListener('change', renderPropertiesList);
}

// 탭 전환
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.content-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // 통계 탭일 경우 차트 렌더링
    if (tabName === 'stats') {
        renderStats();
    }
}

// 매물 추가
function addProperty() {
    // 옵션 체크박스 값 가져오기
    const optionCheckboxes = document.querySelectorAll('input[name="option"]:checked');
    const options = Array.from(optionCheckboxes).map(cb => cb.value);

    const property = {
        id: Date.now(),
        buildingName: document.getElementById('buildingName').value,
        roomNumber: document.getElementById('roomNumber').value,
        deposit: parseInt(document.getElementById('deposit').value),
        monthlyRent: parseInt(document.getElementById('monthlyRent').value),
        password: document.getElementById('password').value,
        moveIn: document.getElementById('moveIn').value,
        status: document.getElementById('status').value,
        options: options,
        notes: document.getElementById('notes').value,
        contact: document.getElementById('contact').value,
        createdAt: new Date().toISOString()
    };

    properties.push(property);
    saveToStorage();
    updateDashboard();
    renderPropertiesList();

    // 폼 초기화 및 리스트 탭으로 이동
    document.getElementById('propertyForm').reset();
    showNotification('매물이 성공적으로 등록되었습니다!', 'success');
    
    // 리스트 탭으로 자동 전환
    setTimeout(() => {
        switchTab('list');
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.querySelector('[data-tab="list"]')) {
                item.classList.add('active');
            }
        });
    }, 1000);
}

// 대시보드 업데이트
function updateDashboard() {
    const total = properties.length;
    const vacant = properties.filter(p => p.status === '공실').length;
    const rented = properties.filter(p => p.status === '임대중').length;
    const totalRevenue = properties
        .filter(p => p.status === '임대중')
        .reduce((sum, p) => sum + p.monthlyRent, 0);

    document.getElementById('totalProperties').textContent = total;
    document.getElementById('activeProperties').textContent = vacant;
    document.getElementById('soldProperties').textContent = rented;
    document.getElementById('totalRevenue').textContent = `${totalRevenue.toLocaleString()}만원`;

    // 최근 매물 표시
    const recentProperties = properties.slice(-5).reverse();
    const recentContainer = document.getElementById('recentProperties');

    if (recentProperties.length === 0) {
        recentContainer.innerHTML = '<p class="empty-message">등록된 매물이 없습니다.</p>';
    } else {
        recentContainer.innerHTML = recentProperties.map(property => `
            <div class="property-item">
                <div class="property-item-info">
                    <h4>${property.buildingName || '미등록'} ${property.roomNumber || ''}호</h4>
                    <p>보증금 ${(property.deposit || 0).toLocaleString()}만 / 월세 ${(property.monthlyRent || 0).toLocaleString()}만</p>
                </div>
                <div class="property-item-price">${property.status || '상태미정'}</div>
            </div>
        `).join('');
    }
}

// 매물 리스트 렌더링
function renderPropertiesList() {
    const searchInput = document.getElementById('searchInput');
    const filterMoveIn = document.getElementById('filterMoveIn');
    const filterStatus = document.getElementById('filterStatus');
    
    if (!searchInput || !filterMoveIn || !filterStatus) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filterMoveInValue = filterMoveIn.value;
    const filterStatusValue = filterStatus.value;

    let filtered = properties.filter(property => {
        const buildingName = property.buildingName || '';
        const roomNumber = property.roomNumber || '';
        const matchesSearch = buildingName.toLowerCase().includes(searchTerm) ||
                            roomNumber.toLowerCase().includes(searchTerm);
        const matchesMoveIn = !filterMoveInValue || property.moveIn === filterMoveInValue;
        const matchesStatus = !filterStatusValue || property.status === filterStatusValue;

        return matchesSearch && matchesMoveIn && matchesStatus;
    });

    // 데스크톱 테이블 뷰 렌더링
    const tbody = document.getElementById('propertiesTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-row">매물이 없습니다.</td></tr>';
    } else {
        tbody.innerHTML = filtered.map((property, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${property.buildingName || '미등록'}</td>
                <td>${property.roomNumber || '-'}호</td>
                <td>${(property.deposit || 0).toLocaleString()}만</td>
                <td>${(property.monthlyRent || 0).toLocaleString()}만</td>
                <td>${property.moveIn || '-'}</td>
                <td><span class="status-badge ${getStatusClass(property.status)}">${property.status || '미정'}</span></td>
                <td>${property.contact || '-'}</td>
                <td>${formatDate(property.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="viewProperty(${property.id})" title="상세보기">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteProperty(${property.id})" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // 모바일 카드 뷰 렌더링
    const cardsContainer = document.getElementById('propertiesCards');
    
    if (filtered.length === 0) {
        cardsContainer.innerHTML = '<div class="empty-message">매물이 없습니다.</div>';
    } else {
        cardsContainer.innerHTML = filtered.map(property => `
            <div class="property-card">
                <div class="property-card-header">
                    <div class="property-card-title">
                        <h4>${property.buildingName || '미등록'} ${property.roomNumber || ''}호</h4>
                        <p>${property.contact || '-'}</p>
                    </div>
                    <div class="property-card-price">${(property.deposit || 0).toLocaleString()}/${(property.monthlyRent || 0).toLocaleString()}</div>
                </div>
                <div class="property-card-details">
                    <div class="property-card-detail">
                        <i class="fas fa-won-sign"></i>
                        <span>보증금 ${(property.deposit || 0).toLocaleString()}만</span>
                    </div>
                    <div class="property-card-detail">
                        <i class="fas fa-credit-card"></i>
                        <span>월세 ${(property.monthlyRent || 0).toLocaleString()}만</span>
                    </div>
                    <div class="property-card-detail">
                        <i class="fas fa-user-check"></i>
                        <span>${property.moveIn || '-'}</span>
                    </div>
                    <div class="property-card-detail">
                        <i class="fas fa-key"></i>
                        <span>${property.password || '미등록'}</span>
                    </div>
                </div>
                ${property.options && property.options.length > 0 ? `
                <div class="property-card-options">
                    <i class="fas fa-check-circle"></i>
                    <span>${property.options.join(', ')}</span>
                </div>
                ` : ''}
                <div class="property-card-footer">
                    <div>
                        <span class="status-badge ${getStatusClass(property.status)}">${property.status || '미정'}</span>
                        <span class="property-card-date"> · ${formatDate(property.createdAt)}</span>
                    </div>
                    <div class="property-card-actions">
                        <button class="btn btn-sm btn-primary" onclick="viewProperty(${property.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProperty(${property.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// 통계 렌더링
function renderStats() {
    if (properties.length === 0) {
        document.getElementById('summaryStats').innerHTML = '<p class="empty-message">데이터가 없습니다.</p>';
        document.getElementById('moveInChart').innerHTML = '<p class="empty-message">데이터가 없습니다.</p>';
        document.getElementById('statusChart').innerHTML = '<p class="empty-message">데이터가 없습니다.</p>';
        document.getElementById('detailStats').innerHTML = '<p class="empty-message">데이터가 없습니다.</p>';
        return;
    }

    // 요약 통계 렌더링
    renderSummaryStats();
    
    // 전입유무별 도넛 차트
    const moveInStats = {};
    properties.forEach(property => {
        moveInStats[property.moveIn] = (moveInStats[property.moveIn] || 0) + 1;
    });
    renderDonutChart('moveInChart', moveInStats, ['#667eea', '#764ba2', '#f093fb']);

    // 상태별 도넛 차트
    const statusStats = {};
    properties.forEach(property => {
        statusStats[property.status] = (statusStats[property.status] || 0) + 1;
    });
    renderDonutChart('statusChart', statusStats, ['#11998e', '#38ef7d', '#f5576c', '#faa64b']);

    // 상세 통계 렌더링
    renderDetailStats();
}

// 요약 통계 카드
function renderSummaryStats() {
    const total = properties.length;
    const avgDeposit = properties.reduce((sum, p) => sum + (p.deposit || 0), 0) / total;
    const avgRent = properties.reduce((sum, p) => sum + (p.monthlyRent || 0), 0) / total;
    const moveInCount = properties.filter(p => p.moveIn === '전입').length;

    const summaryStats = document.getElementById('summaryStats');
    summaryStats.innerHTML = `
        <div class="summary-stat-card">
            <div class="summary-stat-icon blue">
                <i class="fas fa-building"></i>
            </div>
            <div class="summary-stat-number">${total}</div>
            <div class="summary-stat-label">총 매물</div>
        </div>
        <div class="summary-stat-card">
            <div class="summary-stat-icon green">
                <i class="fas fa-won-sign"></i>
            </div>
            <div class="summary-stat-number">${Math.round(avgDeposit).toLocaleString()}만</div>
            <div class="summary-stat-label">평균 보증금</div>
        </div>
        <div class="summary-stat-card">
            <div class="summary-stat-icon orange">
                <i class="fas fa-credit-card"></i>
            </div>
            <div class="summary-stat-number">${Math.round(avgRent).toLocaleString()}만</div>
            <div class="summary-stat-label">평균 월세</div>
        </div>
        <div class="summary-stat-card">
            <div class="summary-stat-icon blue">
                <i class="fas fa-user-check"></i>
            </div>
            <div class="summary-stat-number">${moveInCount}</div>
            <div class="summary-stat-label">전입 완료</div>
        </div>
    `;
}

// 도넛 차트 렌더링
function renderDonutChart(containerId, data, colors) {
    const container = document.getElementById(containerId);
    if (Object.keys(data).length === 0) {
        container.innerHTML = '<p class="empty-message">데이터가 없습니다.</p>';
        return;
    }

    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    const strokeWidth = 30;

    let paths = '';
    Object.entries(data).forEach(([key, value], index) => {
        const percentage = (value / total) * 100;
        const angle = (value / total) * 360;
        const endAngle = currentAngle + angle;
        
        const startX = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
        const startY = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
        const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
        const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
        
        const largeArc = angle > 180 ? 1 : 0;
        
        paths += `
            <path d="M ${centerX},${centerY} L ${startX},${startY} A ${radius},${radius} 0 ${largeArc},1 ${endX},${endY} Z"
                  fill="${colors[index % colors.length]}"
                  opacity="0.9"/>
        `;
        
        currentAngle = endAngle;
    });

    const legends = Object.entries(data).map(([key, value], index) => {
        const percentage = ((value / total) * 100).toFixed(1);
        return `
            <div class="legend-item">
                <div class="legend-label">
                    <div class="legend-color" style="background-color: ${colors[index % colors.length]}"></div>
                    <span class="legend-name">${key}</span>
                </div>
                <div class="legend-value">
                    <span class="legend-count">${value}개</span>
                    <span class="legend-percent">${percentage}%</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="donut-chart">
            <svg viewBox="0 0 200 200" width="200" height="200">
                <circle cx="100" cy="100" r="${radius}" fill="none" stroke="${colors[0]}" stroke-width="${strokeWidth}" opacity="0.1"/>
                ${paths}
                <circle cx="100" cy="100" r="${radius - strokeWidth}" fill="var(--bg-card)"/>
            </svg>
            <div class="donut-center">
                <div class="donut-center-number">${total}</div>
                <div class="donut-center-label">전체</div>
            </div>
        </div>
        <div class="chart-legend">
            ${legends}
        </div>
    `;
}

// 상세 통계 렌더링
function renderDetailStats() {
    const detailStats = document.getElementById('detailStats');
    
    // 건물별 통계
    const buildingStats = {};
    properties.forEach(property => {
        const building = property.buildingName || '미등록';
        buildingStats[building] = (buildingStats[building] || 0) + 1;
    });

    const maxValue = Math.max(...Object.values(buildingStats));
    
    detailStats.innerHTML = `
        ${Object.entries(buildingStats).map(([building, count]) => {
            const percentage = (count / maxValue) * 100;
            return `
                <div class="detail-stat-row">
                    <div class="detail-stat-label">${building}</div>
                    <div class="detail-stat-bar">
                        <div class="detail-stat-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="detail-stat-value">${count}개 (${((count / properties.length) * 100).toFixed(1)}%)</div>
                </div>
            `;
        }).join('')}
    `;
}

// 매물 상세보기
function viewProperty(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return;

    const modal = document.getElementById('propertyModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <div class="modal-detail-grid">
            <div class="modal-detail-item">
                <span class="modal-detail-label">건물명:</span>
                <span class="modal-detail-value">${property.buildingName || '미등록'}</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">호수:</span>
                <span class="modal-detail-value">${property.roomNumber || '-'}호</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">보증금:</span>
                <span class="modal-detail-value">${(property.deposit || 0).toLocaleString()}만원</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">월세:</span>
                <span class="modal-detail-value">${(property.monthlyRent || 0).toLocaleString()}만원</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">비밀번호:</span>
                <span class="modal-detail-value">${property.password || '미등록'}</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">전입유무:</span>
                <span class="modal-detail-value">${property.moveIn || '-'}</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">상태:</span>
                <span class="modal-detail-value"><span class="status-badge ${getStatusClass(property.status)}">${property.status || '미정'}</span></span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">연락처:</span>
                <span class="modal-detail-value">${property.contact || '-'}</span>
            </div>
            <div class="modal-detail-item">
                <span class="modal-detail-label">등록일:</span>
                <span class="modal-detail-value">${formatDate(property.createdAt)}</span>
            </div>
            ${property.options && property.options.length > 0 ? `
            <div class="modal-detail-item" style="grid-column: 1 / -1;">
                <span class="modal-detail-label">옵션:</span>
                <span class="modal-detail-value">${property.options.join(', ')}</span>
            </div>
            ` : ''}
            ${property.notes ? `
            <div class="modal-detail-item" style="grid-column: 1 / -1;">
                <span class="modal-detail-label">특이사항:</span>
                <span class="modal-detail-value">${property.notes}</span>
            </div>
            ` : ''}
        </div>
    `;

    modal.classList.add('active');
}

// 모달 닫기
function closeModal() {
    const modal = document.getElementById('propertyModal');
    modal.classList.remove('active');
}

// 모달 외부 클릭시 닫기
window.addEventListener('click', function(e) {
    const modal = document.getElementById('propertyModal');
    if (e.target === modal) {
        closeModal();
    }
});

// 매물 삭제
function deleteProperty(id) {
    if (confirm('정말로 이 매물을 삭제하시겠습니까?')) {
        properties = properties.filter(p => p.id !== id);
        saveToStorage();
        updateDashboard();
        renderPropertiesList();
        renderStats();
        showNotification('매물이 삭제되었습니다.', 'error');
    }
}

// 알림 표시
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 30px;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 유틸리티 함수들
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getStatusClass(status) {
    switch (status) {
        case '공실': return 'active';
        case '계약대기': return 'reserved';
        case '임대중': return 'sold';
        default: return '';
    }
}

// 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
