/* 모바일 명함 관리 (최근 계약 / 추천 매물) — 기존 properties 로직·테이블과 완전 분리 */

const cardAdminState = {
  contracts: [],
  recommendations: []
};

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

function setDropzonePreview(previewId, emptyId, url) {
  const preview = document.getElementById(previewId);
  const empty = document.getElementById(emptyId);
  if (!preview || !empty) return;

  if (url) {
    preview.hidden = false;
    empty.hidden = true;
    preview.innerHTML = `
      <img src="${escapeHtml(url)}" alt="미리보기">
      <button type="button" class="mcard-dropzone__change" onclick="event.stopPropagation();">
        <i class="fas fa-sync-alt"></i> 사진 바꾸기
      </button>
    `;
  } else {
    preview.hidden = true;
    empty.hidden = false;
    preview.innerHTML = '';
  }
}

function setSaving(btnId, saving) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = saving;
  btn.innerHTML = saving
    ? '<i class="fas fa-spinner fa-spin"></i> 저장 중...'
    : '<i class="fas fa-check"></i> 저장하기';
}

function bindDropzone({ zoneId, inputId, previewId, emptyId, urlFieldId }) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  const openPicker = () => input.click();

  zone.addEventListener('click', (e) => {
    if (e.target.closest('.mcard-dropzone__change') || e.target.closest('button')) {
      openPicker();
      return;
    }
    openPicker();
  });

  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  });

  ['dragenter', 'dragover'].forEach((ev) => {
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.add('is-dragover');
    });
  });
  ['dragleave', 'drop'].forEach((ev) => {
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.remove('is-dragover');
    });
  });

  zone.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일만 올릴 수 있습니다.');
      return;
    }
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    const localUrl = URL.createObjectURL(file);
    setDropzonePreview(previewId, emptyId, localUrl);
  });

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setDropzonePreview(previewId, emptyId, localUrl);
    if (urlFieldId) {
      // 새 파일 선택 시 저장 전까지는 기존 URL 유지, 미리보기만 갱신
    }
  });
}

/* ---------- 최근 계약 ---------- */
function resetCardContractForm() {
  document.getElementById('cardContractId').value = '';
  document.getElementById('cardContractImage').value = '';
  document.getElementById('cardContractImageUrl').value = '';
  document.getElementById('cardContractArea').value = '';
  document.getElementById('cardContractName').value = '';
  document.getElementById('cardContractDealType').value = '상가임대';
  document.getElementById('cardContractSize').value = '점포';
  document.getElementById('cardContractMonth').value = '';
  document.getElementById('cardContractSort').value = '0';
  document.getElementById('cardContractFormTitle').textContent = '새 계약 등록';
  const badge = document.getElementById('cardContractModeBadge');
  if (badge) {
    badge.textContent = '신규';
    badge.classList.remove('is-edit');
  }
  setDropzonePreview('cardContractPreview', 'cardContractDropEmpty', '');
}

function renderContractGrid(rows) {
  const grid = document.getElementById('cardContractGrid');
  const count = document.getElementById('cardContractCount');
  if (count) count.textContent = String(rows.length);
  if (!grid) return;

  if (!rows.length) {
    grid.innerHTML = `
      <div class="mcard-empty">
        <i class="fas fa-image"></i>
        <p>아직 등록된 계약이 없습니다.<br>왼쪽에서 사진과 상호만 입력해 저장하세요.</p>
      </div>`;
    return;
  }

  grid.innerHTML = rows
    .map((row) => {
      const img = row.image_url
        ? `<img src="${escapeHtml(row.image_url)}" alt="">`
        : `<div class="mcard-item__noimg"><i class="fas fa-image"></i></div>`;
      return `
        <article class="mcard-item">
          <div class="mcard-item__media">${img}</div>
          <div class="mcard-item__body">
            <p class="mcard-item__area">${escapeHtml(row.area || '')}</p>
            <h4 class="mcard-item__name">${escapeHtml(row.name || '')}</h4>
            <p class="mcard-item__meta">${escapeHtml([row.deal_type, row.size, row.contract_month].filter(Boolean).join(' · '))}</p>
          </div>
          <div class="mcard-item__actions">
            <button type="button" class="btn btn-sm btn-secondary" onclick="editCardContractById(${row.id})">
              <i class="fas fa-edit"></i> 수정
            </button>
            <button type="button" class="btn btn-sm btn-danger" onclick="deleteCardContract(${row.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </article>`;
    })
    .join('');
}

async function loadCardContracts() {
  const grid = document.getElementById('cardContractGrid');
  if (grid) grid.innerHTML = '<div class="mcard-empty">불러오는 중...</div>';

  try {
    const res = await apiFetch('/api/card/contracts');
    const rows = await res.json();
    if (!res.ok) throw new Error(rows.error || '목록 조회 실패');
    cardAdminState.contracts = Array.isArray(rows) ? rows : [];
    renderContractGrid(cardAdminState.contracts);
  } catch (err) {
    if (grid) {
      grid.innerHTML = `<div class="mcard-empty">${escapeHtml(err.message)}</div>`;
    }
  }
}

function editCardContractById(id) {
  const row = cardAdminState.contracts.find((r) => Number(r.id) === Number(id));
  if (!row) return;
  editCardContract(row);
}

function editCardContract(row) {
  document.getElementById('cardContractId').value = row.id;
  document.getElementById('cardContractImage').value = '';
  document.getElementById('cardContractImageUrl').value = row.image_url || '';
  document.getElementById('cardContractArea').value = row.area || '';
  document.getElementById('cardContractName').value = row.name || '';
  document.getElementById('cardContractDealType').value = row.deal_type || '';
  document.getElementById('cardContractSize').value = row.size || '';
  document.getElementById('cardContractMonth').value = row.contract_month || '';
  document.getElementById('cardContractSort').value = row.sort_order ?? 0;
  document.getElementById('cardContractFormTitle').textContent = '계약 수정';
  const badge = document.getElementById('cardContractModeBadge');
  if (badge) {
    badge.textContent = '수정';
    badge.classList.add('is-edit');
  }
  setDropzonePreview('cardContractPreview', 'cardContractDropEmpty', row.image_url || '');
  document.querySelector('#card-contracts .mcard-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveCardContract() {
  try {
    setSaving('cardContractSaveBtn', true);
    const id = document.getElementById('cardContractId').value;
    let imageUrl = document.getElementById('cardContractImageUrl').value;
    const fileInput = document.getElementById('cardContractImage');
    if (fileInput.files?.[0]) {
      imageUrl = await uploadCardImage(fileInput, 'card-contracts');
      document.getElementById('cardContractImageUrl').value = imageUrl;
      setDropzonePreview('cardContractPreview', 'cardContractDropEmpty', imageUrl);
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
      alert('지점/지역과 상호는 필수입니다.');
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

    alert('저장되었습니다. 모바일 명함에 곧 반영됩니다.');
    resetCardContractForm();
    loadCardContracts();
  } catch (err) {
    alert(err.message || '저장 중 오류');
  } finally {
    setSaving('cardContractSaveBtn', false);
  }
}

async function deleteCardContract(id) {
  if (!confirm('이 계약을 삭제할까요?')) return;
  try {
    const res = await apiFetch(`/api/card/contracts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '삭제 실패');
    if (String(document.getElementById('cardContractId').value) === String(id)) {
      resetCardContractForm();
    }
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
  const badge = document.getElementById('cardRecommendModeBadge');
  if (badge) {
    badge.textContent = '신규';
    badge.classList.remove('is-edit');
  }
  setDropzonePreview('cardRecommendPreview', 'cardRecommendDropEmpty', '');
}

function renderRecommendGrid(rows) {
  const grid = document.getElementById('cardRecommendGrid');
  const count = document.getElementById('cardRecommendCount');
  if (count) count.textContent = String(rows.length);
  if (!grid) return;

  if (!rows.length) {
    grid.innerHTML = `
      <div class="mcard-empty">
        <i class="fas fa-star"></i>
        <p>아직 등록된 추천 매물이 없습니다.<br>사진과 매물명만 넣어도 충분합니다.</p>
      </div>`;
    return;
  }

  grid.innerHTML = rows
    .map((row) => {
      const img = row.image_url
        ? `<img src="${escapeHtml(row.image_url)}" alt="">`
        : `<div class="mcard-item__noimg"><i class="fas fa-image"></i></div>`;
      const features = Array.isArray(row.features) ? row.features.join(' · ') : '';
      return `
        <article class="mcard-item">
          <div class="mcard-item__media">${img}</div>
          <div class="mcard-item__body">
            <p class="mcard-item__area">${escapeHtml(row.price || row.area || '')}</p>
            <h4 class="mcard-item__name">${escapeHtml(row.name || '')}</h4>
            <p class="mcard-item__meta">${escapeHtml([row.area, features].filter(Boolean).join(' · '))}</p>
          </div>
          <div class="mcard-item__actions">
            <button type="button" class="btn btn-sm btn-secondary" onclick="editCardRecommendById(${row.id})">
              <i class="fas fa-edit"></i> 수정
            </button>
            <button type="button" class="btn btn-sm btn-danger" onclick="deleteCardRecommend(${row.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </article>`;
    })
    .join('');
}

async function loadCardRecommendations() {
  const grid = document.getElementById('cardRecommendGrid');
  if (grid) grid.innerHTML = '<div class="mcard-empty">불러오는 중...</div>';

  try {
    const res = await apiFetch('/api/card/recommendations');
    const rows = await res.json();
    if (!res.ok) throw new Error(rows.error || '목록 조회 실패');
    cardAdminState.recommendations = Array.isArray(rows) ? rows : [];
    renderRecommendGrid(cardAdminState.recommendations);
  } catch (err) {
    if (grid) {
      grid.innerHTML = `<div class="mcard-empty">${escapeHtml(err.message)}</div>`;
    }
  }
}

function editCardRecommendById(id) {
  const row = cardAdminState.recommendations.find((r) => Number(r.id) === Number(id));
  if (!row) return;
  editCardRecommend(row);
}

function editCardRecommend(row) {
  document.getElementById('cardRecommendId').value = row.id;
  document.getElementById('cardRecommendImage').value = '';
  document.getElementById('cardRecommendImageUrl').value = row.image_url || '';
  document.getElementById('cardRecommendPrice').value = row.price || '';
  document.getElementById('cardRecommendArea').value = row.area || '';
  document.getElementById('cardRecommendName').value = row.name || '';
  document.getElementById('cardRecommendFeatures').value = Array.isArray(row.features)
    ? row.features.join(', ')
    : '';
  document.getElementById('cardRecommendSort').value = row.sort_order ?? 0;
  document.getElementById('cardRecommendFormTitle').textContent = '추천 매물 수정';
  const badge = document.getElementById('cardRecommendModeBadge');
  if (badge) {
    badge.textContent = '수정';
    badge.classList.add('is-edit');
  }
  setDropzonePreview('cardRecommendPreview', 'cardRecommendDropEmpty', row.image_url || '');
  document.querySelector('#card-recommend .mcard-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveCardRecommend() {
  try {
    setSaving('cardRecommendSaveBtn', true);
    const id = document.getElementById('cardRecommendId').value;
    let imageUrl = document.getElementById('cardRecommendImageUrl').value;
    const fileInput = document.getElementById('cardRecommendImage');
    if (fileInput.files?.[0]) {
      imageUrl = await uploadCardImage(fileInput, 'card-recommendations');
      document.getElementById('cardRecommendImageUrl').value = imageUrl;
      setDropzonePreview('cardRecommendPreview', 'cardRecommendDropEmpty', imageUrl);
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

    alert('저장되었습니다. 모바일 명함에 곧 반영됩니다.');
    resetCardRecommendForm();
    loadCardRecommendations();
  } catch (err) {
    alert(err.message || '저장 중 오류');
  } finally {
    setSaving('cardRecommendSaveBtn', false);
  }
}

async function deleteCardRecommend(id) {
  if (!confirm('이 추천 매물을 삭제할까요?')) return;
  try {
    const res = await apiFetch(`/api/card/recommendations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '삭제 실패');
    if (String(document.getElementById('cardRecommendId').value) === String(id)) {
      resetCardRecommendForm();
    }
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

  bindDropzone({
    zoneId: 'cardContractDropzone',
    inputId: 'cardContractImage',
    previewId: 'cardContractPreview',
    emptyId: 'cardContractDropEmpty',
    urlFieldId: 'cardContractImageUrl'
  });

  bindDropzone({
    zoneId: 'cardRecommendDropzone',
    inputId: 'cardRecommendImage',
    previewId: 'cardRecommendPreview',
    emptyId: 'cardRecommendDropEmpty',
    urlFieldId: 'cardRecommendImageUrl'
  });

  // 기본 거래유형 힌트
  const deal = document.getElementById('cardContractDealType');
  const size = document.getElementById('cardContractSize');
  if (deal && !deal.value) deal.value = '상가임대';
  if (size && !size.value) size.value = '점포';
}

document.addEventListener('DOMContentLoaded', initCardAdminNav);
