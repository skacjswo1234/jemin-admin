/* 모바일 명함 관리 (최근 계약 / 추천 매물) — 기존 properties 로직과 분리 */

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function uploadCardImage(fileInput, folder) {
  const file = fileInput?.files?.[0];
  if (!file) return null;

  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  const res = await apiFetch('/api/card/upload', {
    method: 'POST',
    body: form
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '업로드 실패');
  return data.url;
}

function setPreview(previewEl, url) {
  if (!previewEl) return;
  if (url) {
    previewEl.innerHTML = `<img src="${escapeHtml(url)}" alt="preview">`;
  } else {
    previewEl.innerHTML = '';
  }
}

/* ---------- 최근 계약 ---------- */
function resetCardContractForm() {
  document.getElementById('cardContractId').value = '';
  document.getElementById('cardContractImage').value = '';
  document.getElementById('cardContractImageUrl').value = '';
  document.getElementById('cardContractArea').value = '';
  document.getElementById('cardContractName').value = '';
  document.getElementById('cardContractDealType').value = '';
  document.getElementById('cardContractSize').value = '';
  document.getElementById('cardContractMonth').value = '';
  document.getElementById('cardContractSort').value = '0';
  document.getElementById('cardContractFormTitle').textContent = '새 계약 등록';
  setPreview(document.getElementById('cardContractPreview'), '');
}

async function loadCardContracts() {
  const tbody = document.getElementById('cardContractTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="empty-message">불러오는 중...</td></tr>';

  try {
    const res = await apiFetch('/api/card/contracts');
    const rows = await res.json();
    if (!res.ok) throw new Error(rows.error || '목록 조회 실패');

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-message">등록된 계약이 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map((row) => {
        const img = row.image_url
          ? `<img class="card-thumb" src="${escapeHtml(row.image_url)}" alt="">`
          : '<span style="color:var(--text-secondary);font-size:12px;">없음</span>';
        return `<tr>
          <td>${img}</td>
          <td>${escapeHtml(row.area)}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.deal_type)}</td>
          <td>${escapeHtml(row.size)}</td>
          <td>${escapeHtml(row.contract_month)}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick='editCardContract(${JSON.stringify(row)})'><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteCardContract(${row.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`;
      })
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-message">${escapeHtml(err.message)}</td></tr>`;
  }
}

function editCardContract(row) {
  document.getElementById('cardContractId').value = row.id;
  document.getElementById('cardContractImageUrl').value = row.image_url || '';
  document.getElementById('cardContractArea').value = row.area || '';
  document.getElementById('cardContractName').value = row.name || '';
  document.getElementById('cardContractDealType').value = row.deal_type || '';
  document.getElementById('cardContractSize').value = row.size || '';
  document.getElementById('cardContractMonth').value = row.contract_month || '';
  document.getElementById('cardContractSort').value = row.sort_order ?? 0;
  document.getElementById('cardContractFormTitle').textContent = '계약 수정';
  setPreview(document.getElementById('cardContractPreview'), row.image_url || '');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveCardContract() {
  try {
    const id = document.getElementById('cardContractId').value;
    let imageUrl = document.getElementById('cardContractImageUrl').value;
    const fileInput = document.getElementById('cardContractImage');
    if (fileInput.files?.[0]) {
      imageUrl = await uploadCardImage(fileInput, 'card-contracts');
      document.getElementById('cardContractImageUrl').value = imageUrl;
      setPreview(document.getElementById('cardContractPreview'), imageUrl);
    }

    const payload = {
      image_url: imageUrl || null,
      area: document.getElementById('cardContractArea').value.trim(),
      name: document.getElementById('cardContractName').value.trim(),
      deal_type: document.getElementById('cardContractDealType').value.trim(),
      size: document.getElementById('cardContractSize').value.trim(),
      contract_month: document.getElementById('cardContractMonth').value.trim(),
      sort_order: Number(document.getElementById('cardContractSort').value) || 0
    };

    if (!payload.area || !payload.name) {
      alert('지역과 아파트명은 필수입니다.');
      return;
    }

    const url = id ? `/api/card/contracts/${id}` : '/api/card/contracts';
    const method = id ? 'PUT' : 'POST';
    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');

    alert('저장되었습니다.');
    resetCardContractForm();
    loadCardContracts();
  } catch (err) {
    alert(err.message || '저장 중 오류');
  }
}

async function deleteCardContract(id) {
  if (!confirm('이 계약을 삭제할까요?')) return;
  try {
    const res = await apiFetch(`/api/card/contracts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '삭제 실패');
    loadCardContracts();
  } catch (err) {
    alert(err.message || '삭제 중 오류');
  }
}

/* ---------- 추천 매물 ---------- */
function resetCardRecommendForm() {
  document.getElementById('cardRecommendId').value = '';
  document.getElementById('cardRecommendImage').value = '';
  document.getElementById('cardRecommendImageUrl').value = '';
  document.getElementById('cardRecommendPrice').value = '';
  document.getElementById('cardRecommendArea').value = '';
  document.getElementById('cardRecommendName').value = '';
  document.getElementById('cardRecommendFeatures').value = '';
  document.getElementById('cardRecommendSort').value = '0';
  document.getElementById('cardRecommendFormTitle').textContent = '새 추천 매물 등록';
  setPreview(document.getElementById('cardRecommendPreview'), '');
}

async function loadCardRecommendations() {
  const tbody = document.getElementById('cardRecommendTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="empty-message">불러오는 중...</td></tr>';

  try {
    const res = await apiFetch('/api/card/recommendations');
    const rows = await res.json();
    if (!res.ok) throw new Error(rows.error || '목록 조회 실패');

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-message">등록된 추천 매물이 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map((row) => {
        const img = row.image_url
          ? `<img class="card-thumb" src="${escapeHtml(row.image_url)}" alt="">`
          : '<span style="color:var(--text-secondary);font-size:12px;">없음</span>';
        const features = Array.isArray(row.features) ? row.features.join(', ') : '';
        return `<tr>
          <td>${img}</td>
          <td>${escapeHtml(row.price)}</td>
          <td>${escapeHtml(row.area)}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(features)}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick='editCardRecommend(${JSON.stringify(row)})'><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteCardRecommend(${row.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`;
      })
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-message">${escapeHtml(err.message)}</td></tr>`;
  }
}

function editCardRecommend(row) {
  document.getElementById('cardRecommendId').value = row.id;
  document.getElementById('cardRecommendImageUrl').value = row.image_url || '';
  document.getElementById('cardRecommendPrice').value = row.price || '';
  document.getElementById('cardRecommendArea').value = row.area || '';
  document.getElementById('cardRecommendName').value = row.name || '';
  document.getElementById('cardRecommendFeatures').value = Array.isArray(row.features)
    ? row.features.join(', ')
    : '';
  document.getElementById('cardRecommendSort').value = row.sort_order ?? 0;
  document.getElementById('cardRecommendFormTitle').textContent = '추천 매물 수정';
  setPreview(document.getElementById('cardRecommendPreview'), row.image_url || '');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveCardRecommend() {
  try {
    const id = document.getElementById('cardRecommendId').value;
    let imageUrl = document.getElementById('cardRecommendImageUrl').value;
    const fileInput = document.getElementById('cardRecommendImage');
    if (fileInput.files?.[0]) {
      imageUrl = await uploadCardImage(fileInput, 'card-recommendations');
      document.getElementById('cardRecommendImageUrl').value = imageUrl;
      setPreview(document.getElementById('cardRecommendPreview'), imageUrl);
    }

    const featuresRaw = document.getElementById('cardRecommendFeatures').value;
    const features = featuresRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      image_url: imageUrl || null,
      price: document.getElementById('cardRecommendPrice').value.trim(),
      area: document.getElementById('cardRecommendArea').value.trim(),
      name: document.getElementById('cardRecommendName').value.trim(),
      features,
      sort_order: Number(document.getElementById('cardRecommendSort').value) || 0
    };

    if (!payload.area || !payload.name) {
      alert('지역과 매물명은 필수입니다.');
      return;
    }

    const url = id ? `/api/card/recommendations/${id}` : '/api/card/recommendations';
    const method = id ? 'PUT' : 'POST';
    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');

    alert('저장되었습니다.');
    resetCardRecommendForm();
    loadCardRecommendations();
  } catch (err) {
    alert(err.message || '저장 중 오류');
  }
}

async function deleteCardRecommend(id) {
  if (!confirm('이 추천 매물을 삭제할까요?')) return;
  try {
    const res = await apiFetch(`/api/card/recommendations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '삭제 실패');
    loadCardRecommendations();
  } catch (err) {
    alert(err.message || '삭제 중 오류');
  }
}

function initCardAdminNav() {
  document.querySelectorAll('.nav-group-toggle').forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggle.closest('.nav-group')?.classList.toggle('open');
    });
  });

  // 이미지 선택 즉시 미리보기
  document.getElementById('cardContractImage')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(document.getElementById('cardContractPreview'), url);
  });
  document.getElementById('cardRecommendImage')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(document.getElementById('cardRecommendPreview'), url);
  });
}

document.addEventListener('DOMContentLoaded', initCardAdminNav);
