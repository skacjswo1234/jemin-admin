// 전역 변수
let properties = [];

// API 기본 URL (로컬 개발시: 빈 문자열, 프로덕션: Cloudflare Pages URL)
const API_BASE_URL = '';

// 건물별 동/타입 정의
const buildingDongTypes = {
    '타워더모스트': ['A타입', 'B타입', 'C타입', 'D타입'],
    '해링턴타워': ['101동', '102동', '103동'],
    'KCC하버뷰': ['101동', '102동', '원룸형(도생)', '원룸형(오피)']
};

// API에서 데이터 로드
async function loadFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/properties`);
        if (!response.ok) throw new Error('데이터 로드 실패');
        properties = await response.json();
        updateDashboard();
        updateBuildingFilter();
        renderPropertiesList();
        renderStats();
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        showNotification('데이터를 불러오는데 실패했습니다.', 'error');
    }
}

// 로컬 스토리지에서 데이터 로드 (백업용)
function loadFromStorage() {
    const stored = localStorage.getItem('properties');
    if (stored) {
        properties = JSON.parse(stored);
    }
    updateDashboard();
    updateBuildingFilter();
    renderPropertiesList();
    renderStats();
}

// 로컬 스토리지에 저장 (백업용)
function saveToStorage() {
    localStorage.setItem('properties', JSON.stringify(properties));
}

// 로그인 체크
function checkLogin() {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 로그아웃
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    }
}

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (!checkLogin()) return;
    
    // 사용자 이름 표시
    const adminUser = localStorage.getItem('adminUser');
    document.querySelector('.user-profile span').textContent = adminUser;
    
    loadFromAPI();
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

    // 비밀번호 변경 폼
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }

    // 계정 추가 폼
    const addAccountForm = document.getElementById('addAccountForm');
    if (addAccountForm) {
        addAccountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addAccount();
        });
    }

    // 검색
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function() {
        renderPropertiesList();
    });

    // 필터
    const filterMoveIn = document.getElementById('filterMoveIn');
    const filterStatus = document.getElementById('filterStatus');
    const filterDongType = document.getElementById('filterDongType');
    filterMoveIn.addEventListener('change', renderPropertiesList);
    filterStatus.addEventListener('change', renderPropertiesList);
    filterDongType.addEventListener('change', renderPropertiesList);
}

// 풀옵션 토글 함수
function toggleFullOption() {
    const fullOptionCheckbox = document.getElementById('fullOption');
    const optionCheckboxes = document.querySelectorAll('input[name="option"]');
    
    optionCheckboxes.forEach(checkbox => {
        checkbox.checked = fullOptionCheckbox.checked;
    });
}

// 등록 폼: 건물 선택 시 동/타입 옵션 업데이트
function updateDongTypeOptions() {
    const buildingSelect = document.getElementById('buildingName');
    const dongTypeSelect = document.getElementById('dongType');
    const selectedBuilding = buildingSelect.value;
    
    dongTypeSelect.innerHTML = '<option value="">동/타입 선택</option>';
    
    if (selectedBuilding && buildingDongTypes[selectedBuilding]) {
        dongTypeSelect.disabled = false;
        buildingDongTypes[selectedBuilding].forEach(dongType => {
            const option = document.createElement('option');
            option.value = dongType;
            option.textContent = dongType;
            dongTypeSelect.appendChild(option);
        });
    } else {
        dongTypeSelect.disabled = true;
        dongTypeSelect.innerHTML = '<option value="">건물을 먼저 선택하세요</option>';
    }
}

// 리스트 필터: 건물 선택 시 동/타입 필터 업데이트
function onBuildingChange() {
    const filterBuilding = document.getElementById('filterBuilding');
    const filterDongType = document.getElementById('filterDongType');
    const selectedBuilding = filterBuilding.value;
    
    filterDongType.innerHTML = '<option value="">전체 동/타입</option>';
    
    if (!selectedBuilding) {
        filterDongType.style.display = 'none';
        renderPropertiesList();
        return;
    }
    
    // 선택된 건물의 실제 등록된 동/타입만 표시
    const dongTypes = new Set();
    properties.forEach(property => {
        if (property.buildingName === selectedBuilding && property.dongType) {
            dongTypes.add(property.dongType);
        }
    });
    
    if (dongTypes.size > 0) {
        filterDongType.style.display = 'block';
        Array.from(dongTypes).sort().forEach(dongType => {
            const option = document.createElement('option');
            option.value = dongType;
            option.textContent = dongType;
            filterDongType.appendChild(option);
        });
    } else {
        filterDongType.style.display = 'none';
    }
    
    renderPropertiesList();
}

// 건물 필터 업데이트
function updateBuildingFilter() {
    const filterBuilding = document.getElementById('filterBuilding');
    const buildings = new Set();
    
    properties.forEach(property => {
        if (property.buildingName) {
            buildings.add(property.buildingName);
        }
    });
    
    filterBuilding.innerHTML = '<option value="">전체 건물</option>';
    Array.from(buildings).sort().forEach(building => {
        const option = document.createElement('option');
        option.value = building;
        option.textContent = building;
        filterBuilding.appendChild(option);
    });
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

    // 계정 관리 탭일 경우 계정 목록 로드
    if (tabName === 'account') {
        loadAccounts();
    }
}

// 매물 추가
async function addProperty() {
    // 옵션 체크박스 값 가져오기
    const optionCheckboxes = document.querySelectorAll('input[name="option"]:checked');
    const options = Array.from(optionCheckboxes).map(cb => cb.value);

    const property = {
        buildingName: document.getElementById('buildingName').value,
        dongType: document.getElementById('dongType').value,
        roomNumber: document.getElementById('roomNumber').value,
        deposit: parseInt(document.getElementById('deposit').value),
        monthlyRent: parseInt(document.getElementById('monthlyRent').value),
        password: document.getElementById('password').value,
        moveIn: document.getElementById('moveIn').value,
        status: document.getElementById('status').value,
        options: options,
        notes: document.getElementById('notes').value,
        contact: document.getElementById('contact').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/properties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(property)
        });

        if (!response.ok) throw new Error('매물 등록 실패');

        // 폼 초기화
        document.getElementById('propertyForm').reset();
        document.getElementById('dongType').disabled = true;
        document.getElementById('dongType').innerHTML = '<option value="">건물을 먼저 선택하세요</option>';
        
        showNotification('매물이 성공적으로 등록되었습니다!', 'success');
        
        // 데이터 다시 로드
        await loadFromAPI();
        
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
    } catch (error) {
        console.error('매물 등록 오류:', error);
        showNotification('매물 등록에 실패했습니다.', 'error');
    }
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
    const filterBuilding = document.getElementById('filterBuilding');
    const filterDongType = document.getElementById('filterDongType');
    const filterMoveIn = document.getElementById('filterMoveIn');
    const filterStatus = document.getElementById('filterStatus');
    
    if (!searchInput || !filterMoveIn || !filterStatus) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filterBuildingValue = filterBuilding.value;
    const filterDongTypeValue = filterDongType.value;
    const filterMoveInValue = filterMoveIn.value;
    const filterStatusValue = filterStatus.value;

    let filtered = properties.filter(property => {
        const buildingName = property.buildingName || '';
        const roomNumber = property.roomNumber || '';
        const dongType = property.dongType || '';
        
        const matchesSearch = buildingName.toLowerCase().includes(searchTerm) ||
                            roomNumber.toLowerCase().includes(searchTerm) ||
                            dongType.toLowerCase().includes(searchTerm);
        
        const matchesBuilding = !filterBuildingValue || property.buildingName === filterBuildingValue;
        const matchesDongType = !filterDongTypeValue || property.dongType === filterDongTypeValue;
        const matchesMoveIn = !filterMoveInValue || property.moveIn === filterMoveInValue;
        const matchesStatus = !filterStatusValue || property.status === filterStatusValue;

        return matchesSearch && matchesBuilding && matchesDongType && matchesMoveIn && matchesStatus;
    });

    // 데스크톱 테이블 뷰 렌더링
    const tbody = document.getElementById('propertiesTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty-row">매물이 없습니다.</td></tr>';
    } else {
        tbody.innerHTML = filtered.map((property, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${property.buildingName || '미등록'}</td>
                <td>${property.dongType || '-'}</td>
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
                        <h4>${property.buildingName || '미등록'} ${property.dongType || ''} ${property.roomNumber || ''}호</h4>
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
                <span class="modal-detail-label">동/타입:</span>
                <span class="modal-detail-value">${property.dongType || '-'}</span>
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
async function deleteProperty(id) {
    if (!confirm('정말로 이 매물을 삭제하시겠습니까?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('매물 삭제 실패');

        showNotification('매물이 삭제되었습니다.', 'error');
        
        // 데이터 다시 로드
        await loadFromAPI();
    } catch (error) {
        console.error('매물 삭제 오류:', error);
        showNotification('매물 삭제에 실패했습니다.', 'error');
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

// 비밀번호 변경
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const adminUser = localStorage.getItem('adminUser');

    if (newPassword !== confirmPassword) {
        showNotification('새 비밀번호가 일치하지 않습니다.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: adminUser,
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '비밀번호 변경에 실패했습니다.');
        }

        showNotification('비밀번호가 성공적으로 변경되었습니다.', 'success');
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        showNotification(error.message, 'error');
    }
}

// 계정 추가
async function addAccount() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newAccountPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '계정 추가에 실패했습니다.');
        }

        showNotification('계정이 성공적으로 추가되었습니다.', 'success');
        document.getElementById('addAccountForm').reset();
        loadAccounts();
    } catch (error) {
        console.error('계정 추가 오류:', error);
        showNotification(error.message, 'error');
    }
}

// 계정 목록 로드
async function loadAccounts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/accounts`);
        if (!response.ok) throw new Error('계정 목록 로드 실패');
        
        const accounts = await response.json();
        const tbody = document.getElementById('accountsTableBody');
        const currentUser = localStorage.getItem('adminUser');

        if (accounts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-row">등록된 계정이 없습니다.</td></tr>';
            return;
        }

        tbody.innerHTML = accounts.map((account, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${account.username}${account.username === currentUser ? ' <span style="color: var(--primary-color);">(현재 로그인)</span>' : ''}</td>
                <td>${formatDate(account.createdAt)}</td>
                <td>
                    ${account.username !== currentUser ? `
                    <button class="action-btn delete" onclick="deleteAccount('${account.username}')" title="삭제">
                        <i class="fas fa-trash"></i> 삭제
                    </button>
                    ` : '<span style="color: var(--text-secondary);">-</span>'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('계정 목록 로드 오류:', error);
        showNotification('계정 목록을 불러오는데 실패했습니다.', 'error');
    }
}

// 계정 삭제
async function deleteAccount(username) {
    if (!confirm(`계정 "${username}"을(를) 삭제하시겠습니까?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/accounts?username=${encodeURIComponent(username)}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '계정 삭제에 실패했습니다.');
        }

        showNotification('계정이 삭제되었습니다.', 'success');
        loadAccounts();
    } catch (error) {
        console.error('계정 삭제 오류:', error);
        showNotification(error.message, 'error');
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
