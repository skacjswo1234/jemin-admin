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

// 매물 옵션 목록
const propertyOptions = ['냉장고', '세탁기', '에어컨', '인덕션', '전자레인지', '책상', '침대', '옷장'];

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
        localStorage.removeItem('adminName');
        window.location.href = 'login.html';
    }
}

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (!checkLogin()) return;
    
    // 사용자 성명 표시
    const adminName = localStorage.getItem('adminName');
    const adminUser = localStorage.getItem('adminUser');
    document.getElementById('adminName').textContent = adminName || adminUser;
    
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
    const filterBuilding = document.getElementById('filterBuilding');
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

// 리스트 필터: 건물 선택 시 동/타입 필터 업데이트 (고정된 타입 목록 사용)
function onBuildingChange() {
    const filterBuilding = document.getElementById('filterBuilding');
    const filterDongType = document.getElementById('filterDongType');
    const selectedBuilding = filterBuilding.value;
    
    // 동/타입 필터 초기화
    filterDongType.innerHTML = '<option value="">전체 동/타입</option>';
    
    if (!selectedBuilding) {
        renderPropertiesList();
        return;
    }
    
    // 선택된 건물의 고정된 동/타입 목록 표시
    if (buildingDongTypes[selectedBuilding]) {
        buildingDongTypes[selectedBuilding].forEach(dongType => {
            const option = document.createElement('option');
            option.value = dongType;
            option.textContent = dongType;
            filterDongType.appendChild(option);
        });
    }
    
    renderPropertiesList();
}

// 건물 필터 업데이트 (고정된 건물 목록 사용)
function updateBuildingFilter() {
    const filterBuilding = document.getElementById('filterBuilding');
    const buildings = ['타워더모스트', '해링턴타워', 'KCC하버뷰'];
    
    filterBuilding.innerHTML = '<option value="">전체 건물</option>';
    buildings.forEach(building => {
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

    // 계정 관리 탭일 경우 계정 목록 로드 및 성명 초기화
    if (tabName === 'account') {
        loadAccounts();
        // 성명 필드에 현재 사용자 성명 채우기
        const adminName = localStorage.getItem('adminName');
        const nameField = document.getElementById('updateName');
        if (nameField && adminName) {
            nameField.value = adminName;
        }
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
        roomNumber: document.getElementById('roomNumber').value || '',
        deposit: parseInt(document.getElementById('deposit').value) || 0,
        monthlyRent: parseInt(document.getElementById('monthlyRent').value) || 0,
        password: document.getElementById('password').value || '',
        moveIn: document.getElementById('moveIn').value,
        status: document.getElementById('status').value,
        options: options,
        notes: document.getElementById('notes').value || '',
        contact: document.getElementById('contact').value || ''
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

// 매물 상세보기/수정
function viewProperty(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return;

    const modal = document.getElementById('propertyModal');
    const modalBody = document.getElementById('modalBody');
    
    // 동/타입 옵션 생성
    let dongTypeOptions = '<option value="">동/타입 선택</option>';
    if (property.buildingName && buildingDongTypes[property.buildingName]) {
        buildingDongTypes[property.buildingName].forEach(dongType => {
            const selected = dongType === property.dongType ? 'selected' : '';
            dongTypeOptions += `<option value="${dongType}" ${selected}>${dongType}</option>`;
        });
    }
    
    // 옵션 체크박스 생성
    const currentOptions = property.options || [];
    const optionsHtml = propertyOptions.map(opt => {
        const checked = currentOptions.includes(opt) ? 'checked' : '';
        return `
            <label class="checkbox-label">
                <input type="checkbox" name="modalOption" value="${opt}" ${checked}>
                ${opt}
            </label>
        `;
    }).join('');

    modalBody.innerHTML = `
        <form id="editPropertyForm" class="modal-edit-form">
            <div class="form-grid">
                <div class="form-group">
                    <label for="modalBuildingName">건물명</label>
                    <select id="modalBuildingName" onchange="updateModalDongType()" required>
                        <option value="">건물 선택</option>
                        <option value="타워더모스트" ${property.buildingName === '타워더모스트' ? 'selected' : ''}>타워더모스트</option>
                        <option value="해링턴타워" ${property.buildingName === '해링턴타워' ? 'selected' : ''}>해링턴타워</option>
                        <option value="KCC하버뷰" ${property.buildingName === 'KCC하버뷰' ? 'selected' : ''}>KCC하버뷰</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="modalDongType">동/타입</label>
                    <select id="modalDongType" required>
                        ${dongTypeOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="modalRoomNumber">호수</label>
                    <input type="text" id="modalRoomNumber" value="${property.roomNumber || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="modalDeposit">보증금 (만원)</label>
                    <input type="number" id="modalDeposit" value="${property.deposit || 0}" required>
                </div>
                
                <div class="form-group">
                    <label for="modalMonthlyRent">월세 (만원)</label>
                    <input type="number" id="modalMonthlyRent" value="${property.monthlyRent || 0}" required>
                </div>
                
                <div class="form-group">
                    <label for="modalPassword">비밀번호</label>
                    <input type="text" id="modalPassword" value="${property.password || ''}">
                </div>
                
                <div class="form-group">
                    <label for="modalMoveIn">전입유무</label>
                    <select id="modalMoveIn" required>
                        <option value="전입" ${property.moveIn === '전입' ? 'selected' : ''}>전입</option>
                        <option value="미전입" ${property.moveIn === '미전입' ? 'selected' : ''}>미전입</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="modalStatus">상태</label>
                    <select id="modalStatus" required>
                        <option value="공실" ${property.status === '공실' ? 'selected' : ''}>공실</option>
                        <option value="임대중" ${property.status === '임대중' ? 'selected' : ''}>임대중</option>
                        <option value="계약대기" ${property.status === '계약대기' ? 'selected' : ''}>계약대기</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="modalContact">연락처</label>
                    <input type="text" id="modalContact" value="${property.contact || ''}" required>
                </div>
                
                <div class="form-group full-width">
                    <label>옵션</label>
                    <div class="checkbox-group">
                        ${optionsHtml}
                    </div>
                </div>
                
                <div class="form-group full-width">
                    <label for="modalNotes">특이사항</label>
                    <textarea id="modalNotes" rows="3">${property.notes || ''}</textarea>
                </div>
                
                <div class="form-group full-width" style="color: var(--text-secondary); font-size: 13px;">
                    등록일: ${formatDate(property.createdAt)}
                </div>
            </div>
            
            <div class="form-actions" style="margin-top: 20px;">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> 수정 저장
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    <i class="fas fa-times"></i> 취소
                </button>
            </div>
        </form>
    `;

    // 폼 제출 이벤트
    document.getElementById('editPropertyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateProperty(property.id);
    });

    modal.classList.add('active');
}

// 모달 내 동/타입 업데이트
function updateModalDongType() {
    const buildingSelect = document.getElementById('modalBuildingName');
    const dongTypeSelect = document.getElementById('modalDongType');
    const selectedBuilding = buildingSelect.value;
    
    dongTypeSelect.innerHTML = '<option value="">동/타입 선택</option>';
    
    if (selectedBuilding && buildingDongTypes[selectedBuilding]) {
        buildingDongTypes[selectedBuilding].forEach(dongType => {
            const option = document.createElement('option');
            option.value = dongType;
            option.textContent = dongType;
            dongTypeSelect.appendChild(option);
        });
    }
}

// 매물 수정
async function updateProperty(id) {
    const optionCheckboxes = document.querySelectorAll('input[name="modalOption"]:checked');
    const options = Array.from(optionCheckboxes).map(cb => cb.value);

    const updatedProperty = {
        buildingName: document.getElementById('modalBuildingName').value,
        dongType: document.getElementById('modalDongType').value,
        roomNumber: document.getElementById('modalRoomNumber').value,
        deposit: parseInt(document.getElementById('modalDeposit').value),
        monthlyRent: parseInt(document.getElementById('modalMonthlyRent').value),
        password: document.getElementById('modalPassword').value,
        moveIn: document.getElementById('modalMoveIn').value,
        status: document.getElementById('modalStatus').value,
        options: options,
        notes: document.getElementById('modalNotes').value,
        contact: document.getElementById('modalContact').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProperty)
        });

        if (!response.ok) throw new Error('매물 수정 실패');

        showNotification('매물이 성공적으로 수정되었습니다!', 'success');
        closeModal();
        
        // 데이터 다시 로드
        await loadFromAPI();
        
    } catch (error) {
        console.error('매물 수정 오류:', error);
        showNotification('매물 수정에 실패했습니다.', 'error');
    }
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
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '매물 삭제 실패');
        }

        // 성공 메시지
        showNotification('매물이 삭제되었습니다.', 'success');
        
        // 로컬 배열에서 즉시 제거 (낙관적 업데이트)
        properties = properties.filter(p => p.id !== id);
        
        // UI 즉시 업데이트
        updateDashboard();
        renderPropertiesList();
        
        // 서버에서 최신 데이터 다시 로드 (백그라운드)
        setTimeout(() => {
            loadFromAPI();
        }, 100);
        
    } catch (error) {
        console.error('매물 삭제 오류:', error);
        showNotification(error.message || '매물 삭제에 실패했습니다.', 'error');
        
        // 에러 발생시 데이터 다시 로드
        await loadFromAPI();
    }
}

// 알림 표시
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.textContent = message;
    
    // 모바일 여부 확인
    const isMobile = window.innerWidth <= 768;
    
    notification.style.cssText = `
        position: fixed;
        top: ${isMobile ? '80px' : '90px'};
        ${isMobile ? 'left: 50%; transform: translateX(-50%);' : 'right: 30px;'}
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
        color: white;
        padding: ${isMobile ? '12px 20px' : '15px 25px'};
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        max-width: ${isMobile ? 'calc(100vw - 30px)' : '400px'};
        width: ${isMobile ? 'auto' : 'auto'};
        text-align: center;
        font-size: ${isMobile ? '14px' : '15px'};
        animation: ${isMobile ? 'slideInDown' : 'slideIn'} 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = `${isMobile ? 'slideOutUp' : 'slideOut'} 0.3s ease`;
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

// 정보 변경 (비밀번호 및 성명)
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const name = document.getElementById('updateName').value;
    const adminUser = localStorage.getItem('adminUser');

    // 새 비밀번호가 입력된 경우에만 확인 체크
    if (newPassword && newPassword !== confirmPassword) {
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
                newPassword: newPassword || null,
                name: name || null
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '정보 변경에 실패했습니다.');
        }

        // 성명이 변경된 경우 로컬스토리지 및 UI 업데이트
        if (data.name) {
            localStorage.setItem('adminName', data.name);
            document.getElementById('adminName').textContent = data.name;
        }

        showNotification('정보가 성공적으로 변경되었습니다.', 'success');
        document.getElementById('changePasswordForm').reset();
        
        // 성명 필드는 현재 값으로 다시 채움
        document.getElementById('updateName').value = data.name;
    } catch (error) {
        console.error('정보 변경 오류:', error);
        showNotification(error.message, 'error');
    }
}

// 계정 추가
async function addAccount() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newAccountPassword').value;
    const name = document.getElementById('newAccountName').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, name })
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
            tbody.innerHTML = '<tr><td colspan="5" class="empty-row">등록된 계정이 없습니다.</td></tr>';
            return;
        }

        tbody.innerHTML = accounts.map((account, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${account.username}${account.username === currentUser ? ' <span style="color: var(--primary-color);">(현재 로그인)</span>' : ''}</td>
                <td>${account.name || '-'}</td>
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

// 엑셀 샘플 파일 다운로드
function downloadExcelSample() {
    const sampleData = [
        ['✅ 필수입력', '✅ 필수입력', '선택입력', '선택입력', '선택입력', '선택입력', '선택입력', '선택입력', '선택입력', '선택입력', '선택입력'],
        ['건물명', '동/타입', '호수', '보증금(만원)', '월세(만원)', '비밀번호', '전입유무', '상태', '연락처', '옵션', '특이사항'],
        ['⬇️ 정확히 입력', '⬇️ 정확히 입력', '', '', '', '', '전입/미전입', '공실/임대중/계약대기', '', '⬇️ 쉼표로 구분', ''],
        ['타워더모스트', 'A타입', '1503', '5000', '50', '1234*', '전입', '공실', '010-1234-5678', '냉장고, 세탁기, 에어컨', '남향, 신축'],
        ['', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', ''],
        ['📌 건물별 동/타입 목록 (반드시 아래 목록에서 선택)', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', ''],
        ['타워더모스트', '➡️ A타입, B타입, C타입, D타입', '', '', '', '', '', '', '', '', ''],
        ['해링턴타워', '➡️ 101동, 102동, 103동', '', '', '', '', '', '', '', '', ''],
        ['KCC하버뷰', '➡️ 101동, 102동, 원룸형(도생), 원룸형(오피)', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', ''],
        ['💡 작성 가이드', '', '', '', '', '', '', '', '', '', ''],
        ['- 건물명과 동/타입은 반드시 입력해야 합니다', '', '', '', '', '', '', '', '', '', ''],
        ['- 나머지 항목은 선택입력이며 비워둘 수 있습니다', '', '', '', '', '', '', '', '', '', ''],
        ['- 전입유무: 전입 또는 미전입 (비우면 기본값 미전입)', '', '', '', '', '', '', '', '', '', ''],
        ['- 상태: 공실, 임대중, 계약대기 중 선택 (비우면 기본값 공실)', '', '', '', '', '', '', '', '', '', ''],
        ['- 옵션: 냉장고, 세탁기, 에어컨, 인덕션, 전자레인지, 책상, 침대, 옷장 중 선택 (여러개는 쉼표로 구분)', '', '', '', '', '', '', '', '', '', '']
    ];

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // 열 너비 설정
    ws['!cols'] = [
        { wch: 15 },  // 건물명
        { wch: 15 },  // 동/타입
        { wch: 8 },   // 호수
        { wch: 15 },  // 보증금
        { wch: 15 },  // 월세
        { wch: 12 },  // 비밀번호
        { wch: 10 },  // 전입유무
        { wch: 10 },  // 상태
        { wch: 15 },  // 연락처
        { wch: 30 },  // 옵션
        { wch: 30 }   // 특이사항
    ];

    // 워크시트 추가
    XLSX.utils.book_append_sheet(wb, ws, '매물등록샘플');

    // 파일 다운로드
    const filename = '매물등록_샘플.xlsx';
    
    // 모바일 여부 확인
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    } else {
        XLSX.writeFile(wb, filename);
    }
    
    showNotification('샘플 파일이 다운로드되었습니다.', 'success');
}

// 엑셀 파일 업로드 처리
function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = document.getElementById('fileName');
    const uploadResult = document.getElementById('uploadResult');
    
    fileName.textContent = `선택된 파일: ${file.name}`;
    uploadResult.innerHTML = '<p style="color: var(--warning-color);"><i class="fas fa-spinner fa-spin"></i> 파일을 읽는 중...</p>';

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 첫 번째 시트 읽기
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // 헤더와 설명 행 제외하고 데이터만 추출 (3행부터 시작)
            const rows = jsonData.slice(3).filter(row => {
                // 빈 행이나 설명 행 제외 (첫 번째 셀에 이모지나 특수문자가 있는 경우)
                if (!row || row.length === 0 || !row[0]) return false;
                const firstCell = String(row[0]).trim();
                if (firstCell.startsWith('✅') || firstCell.startsWith('📌') || firstCell.startsWith('⬇️')) return false;
                return true;
            });
            
            if (rows.length === 0) {
                uploadResult.innerHTML = '<p style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> 등록할 데이터가 없습니다.</p>';
                return;
            }
            
            // 데이터 검증 및 변환
            const validBuildings = Object.keys(buildingDongTypes);
            const validMoveIn = ['전입', '미전입'];
            const validStatus = ['공실', '임대중', '계약대기'];
            
            const properties = rows.map((row, index) => {
                const [buildingName, dongType, roomNumber, deposit, monthlyRent, password, moveIn, status, contact, options, notes] = row;
                const rowNum = index + 4; // 엑셀 행 번호 (헤더 3행 포함)
                
                // 필수 필드 검증 (건물명, 동/타입만 필수)
                if (!buildingName || !dongType) {
                    throw new Error(`${rowNum}번째 행: 건물명과 동/타입은 필수입니다.`);
                }
                
                const trimmedBuilding = String(buildingName).trim();
                const trimmedDongType = String(dongType).trim();
                
                // 건물명 검증
                if (!validBuildings.includes(trimmedBuilding)) {
                    throw new Error(`${rowNum}번째 행: 건물명이 올바르지 않습니다. (${trimmedBuilding})\n허용된 건물: ${validBuildings.join(', ')}`);
                }
                
                // 동/타입 검증
                if (!buildingDongTypes[trimmedBuilding].includes(trimmedDongType)) {
                    throw new Error(`${rowNum}번째 행: '${trimmedBuilding}'의 동/타입이 올바르지 않습니다. (${trimmedDongType})\n허용된 타입: ${buildingDongTypes[trimmedBuilding].join(', ')}`);
                }
                
                // 선택 필드 처리 (입력값이 있을 경우에만 검증)
                const trimmedMoveIn = moveIn ? String(moveIn).trim() : '미전입';
                const trimmedStatus = status ? String(status).trim() : '공실';
                
                // 전입유무 검증 (입력된 경우)
                if (moveIn && !validMoveIn.includes(trimmedMoveIn)) {
                    throw new Error(`${rowNum}번째 행: 전입유무가 올바르지 않습니다. (${trimmedMoveIn})\n허용된 값: ${validMoveIn.join(', ')}`);
                }
                
                // 상태 검증 (입력된 경우)
                if (status && !validStatus.includes(trimmedStatus)) {
                    throw new Error(`${rowNum}번째 행: 상태가 올바르지 않습니다. (${trimmedStatus})\n허용된 값: ${validStatus.join(', ')}`);
                }
                
                // 보증금, 월세 처리 (숫자가 아니면 0)
                const depositNum = deposit ? parseInt(deposit) : 0;
                const monthlyRentNum = monthlyRent ? parseInt(monthlyRent) : 0;
                
                if (deposit && (isNaN(depositNum) || depositNum < 0)) {
                    throw new Error(`${rowNum}번째 행: 보증금은 0 이상의 숫자여야 합니다. (${deposit})`);
                }
                if (monthlyRent && (isNaN(monthlyRentNum) || monthlyRentNum < 0)) {
                    throw new Error(`${rowNum}번째 행: 월세는 0 이상의 숫자여야 합니다. (${monthlyRent})`);
                }
                
                // 옵션 처리
                const optionsArray = options ? options.split(',').map(opt => opt.trim()).filter(opt => opt) : [];
                
                return {
                    buildingName: trimmedBuilding,
                    dongType: trimmedDongType,
                    roomNumber: roomNumber ? String(roomNumber).trim() : '',
                    deposit: depositNum,
                    monthlyRent: monthlyRentNum,
                    password: password ? String(password).trim() : '',
                    moveIn: trimmedMoveIn,
                    status: trimmedStatus,
                    contact: contact ? String(contact).trim() : '',
                    options: optionsArray,
                    notes: notes ? String(notes).trim() : ''
                };
            });
            
            // 전역 변수에 저장
            window.pendingProperties = properties;
            
            // 확인 메시지
            uploadResult.innerHTML = `
                <div style="padding: 15px; background-color: var(--bg-tertiary); border-radius: 8px;">
                    <p style="color: var(--success-color); margin-bottom: 10px;">
                        <i class="fas fa-check-circle"></i> ${properties.length}개의 매물 데이터를 확인했습니다.
                    </p>
                    <button type="button" class="btn btn-primary" onclick="bulkUploadProperties()">
                        <i class="fas fa-upload"></i> ${properties.length}개 매물 일괄 등록
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="cancelUpload()">
                        <i class="fas fa-times"></i> 취소
                    </button>
                </div>
            `;
            
        } catch (error) {
            console.error('엑셀 파일 읽기 오류:', error);
            uploadResult.innerHTML = `<p style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> ${error.message}</p>`;
        }
    };
    
    reader.onerror = function() {
        uploadResult.innerHTML = '<p style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> 파일을 읽을 수 없습니다.</p>';
    };
    
    reader.readAsArrayBuffer(file);
}

// 대량 등록 실행
async function bulkUploadProperties() {
    const properties = window.pendingProperties;
    if (!properties || properties.length === 0) {
        showNotification('등록할 데이터가 없습니다.', 'error');
        return;
    }
    const uploadResult = document.getElementById('uploadResult');
    
    uploadResult.innerHTML = '<p style="color: var(--primary-color);"><i class="fas fa-spinner fa-spin"></i> 매물을 등록하는 중...</p>';
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    for (let i = 0; i < properties.length; i++) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/properties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(properties[i])
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '등록 실패');
            }
            
            successCount++;
        } catch (error) {
            failCount++;
            errors.push(`${i + 1}번째 매물: ${error.message}`);
        }
    }
    
    // 결과 표시
    uploadResult.innerHTML = `
        <div style="padding: 15px; background-color: var(--bg-tertiary); border-radius: 8px;">
            <p style="color: var(--success-color); margin-bottom: 5px;">
                <i class="fas fa-check-circle"></i> 성공: ${successCount}개
            </p>
            ${failCount > 0 ? `
                <p style="color: var(--danger-color); margin-bottom: 10px;">
                    <i class="fas fa-exclamation-circle"></i> 실패: ${failCount}개
                </p>
                <details style="margin-top: 10px;">
                    <summary style="cursor: pointer; color: var(--text-secondary);">오류 상세보기</summary>
                    <ul style="margin: 10px 0 0 20px; color: var(--danger-color); font-size: 13px;">
                        ${errors.map(err => `<li>${err}</li>`).join('')}
                    </ul>
                </details>
            ` : ''}
        </div>
    `;
    
    showNotification(`${successCount}개 매물이 등록되었습니다.`, 'success');
    
    // 파일 입력 초기화
    document.getElementById('excelFileInput').value = '';
    document.getElementById('fileName').textContent = '';
    
    // 데이터 다시 로드
    await loadFromAPI();
}

// 업로드 취소
function cancelUpload() {
    document.getElementById('excelFileInput').value = '';
    document.getElementById('fileName').textContent = '';
    document.getElementById('uploadResult').innerHTML = '';
    window.pendingProperties = null;
}

// 엑셀 다운로드 기능 (XLSX)
function exportToExcel() {
    // 현재 필터링된 매물 가져오기
    const searchInput = document.getElementById('searchInput');
    const filterBuilding = document.getElementById('filterBuilding');
    const filterDongType = document.getElementById('filterDongType');
    const filterMoveIn = document.getElementById('filterMoveIn');
    const filterStatus = document.getElementById('filterStatus');
    
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

    if (filtered.length === 0) {
        showNotification('다운로드할 매물이 없습니다.', 'error');
        return;
    }

    // 엑셀 데이터 준비
    const excelData = [];
    
    // 헤더 행
    excelData.push([
        '번호', '건물명', '동/타입', '호수', 
        '보증금(만원)', '월세(만원)', '비밀번호', 
        '전입유무', '상태', '연락처', '옵션', '특이사항', '등록일'
    ]);

    // 데이터 행
    filtered.forEach((property, index) => {
        excelData.push([
            index + 1,
            property.buildingName || '',
            property.dongType || '',
            property.roomNumber || '',
            property.deposit || 0,
            property.monthlyRent || 0,
            property.password || '',
            property.moveIn || '',
            property.status || '',
            property.contact || '',
            property.options ? property.options.join(', ') : '',
            property.notes || '',
            formatDate(property.createdAt)
        ]);
    });

    // 워크북 및 워크시트 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // 열 너비 설정
    ws['!cols'] = [
        { wch: 6 },   // 번호
        { wch: 15 },  // 건물명
        { wch: 12 },  // 동/타입
        { wch: 8 },   // 호수
        { wch: 12 },  // 보증금
        { wch: 12 },  // 월세
        { wch: 12 },  // 비밀번호
        { wch: 10 },  // 전입유무
        { wch: 10 },  // 상태
        { wch: 15 },  // 연락처
        { wch: 20 },  // 옵션
        { wch: 30 },  // 특이사항
        { wch: 12 }   // 등록일
    ];

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(wb, ws, '매물리스트');

    // 파일명 생성
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const filename = `매물리스트_${dateStr}.xlsx`;
    
    // 모바일 여부 확인
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // 모바일: Blob 방식으로 다운로드
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    } else {
        // 데스크톱: 기본 방식
        XLSX.writeFile(wb, filename);
    }
    
    showNotification(`${filtered.length}개 매물이 다운로드되었습니다.`, 'success');
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
    @keyframes slideInDown {
        from {
            transform: translate(-50%, -20px);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    @keyframes slideOutUp {
        from {
            transform: translate(-50%, 0);
            opacity: 1;
        }
        to {
            transform: translate(-50%, -20px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
