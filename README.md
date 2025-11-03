# Jemin Admin - 매물 관리 시스템

Cloudflare Pages + D1 Database + Pages Functions를 사용한 매물 관리 시스템

## 🚀 배포 방법

### 1. D1 데이터베이스 설정

```bash
# Wrangler CLI 설치 (아직 설치하지 않은 경우)
npm install -g wrangler

# Cloudflare 로그인
wrangler login

# D1 데이터베이스에 스키마 적용
wrangler d1 execute jemin-db --remote --file=./schema.sql
```

### 2. Cloudflare Pages 설정

1. Cloudflare 대시보드에서 Pages 프로젝트 생성 또는 기존 프로젝트 선택
2. **Settings** > **Functions** > **D1 database bindings** 설정:
   - Variable name: `DB`
   - D1 database: `jemin-db`

또는 Pages 프로젝트 설정에서:
- **Settings** > **Functions** > **D1 database bindings** 섹션에서:
  - Binding name: `DB`
  - Database: `jemin-db` 선택

### 3. 프로젝트 배포

#### Git 연동 배포 (권장)

```bash
# Git 레포지토리 초기화 (아직 하지 않은 경우)
git init
git add .
git commit -m "Initial commit"

# GitHub에 푸시
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

Cloudflare Pages에서 GitHub 레포지토리 연결

#### 직접 배포

```bash
# Pages 프로젝트에 직접 배포
wrangler pages deploy . --project-name=jemin-admin
```

### 4. 환경 변수 및 바인딩 확인

Cloudflare Pages 대시보드에서:
- **Settings** > **Functions** > **D1 database bindings**
  - `DB` = `jemin-db` 확인

## 📁 프로젝트 구조

```
jemin-admin/
├── functions/
│   └── api/
│       ├── properties/
│       │   ├── index.js      # GET 전체조회, POST 생성
│       │   └── [id].js       # GET 단일조회, PUT 수정, DELETE 삭제
│       └── stats.js          # GET 통계
├── css/
│   └── style.css
├── js/
│   └── script.js             # API 연동 로직
├── images/
├── index.html
├── schema.sql                # D1 데이터베이스 스키마
├── wrangler.toml             # Cloudflare 설정
├── _routes.json              # Pages Functions 라우팅
└── README.md
```

## 🔌 API 엔드포인트

### 매물 관리

- `GET /api/properties` - 매물 목록 조회
  - Query Parameters:
    - `buildingName`: 건물명 필터
    - `dongType`: 동/타입 필터
    - `moveIn`: 전입유무 필터
    - `status`: 상태 필터
    - `search`: 검색어

- `POST /api/properties` - 매물 등록
- `GET /api/properties/:id` - 매물 상세 조회
- `PUT /api/properties/:id` - 매물 수정
- `DELETE /api/properties/:id` - 매물 삭제

### 통계

- `GET /api/stats` - 통계 데이터 조회

## 🗄️ 데이터베이스 스키마

```sql
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buildingName TEXT NOT NULL,        -- 건물명
    dongType TEXT NOT NULL,            -- 동/타입
    roomNumber TEXT NOT NULL,          -- 호수
    deposit INTEGER NOT NULL,          -- 보증금 (만원)
    monthlyRent INTEGER NOT NULL,      -- 월세 (만원)
    password TEXT,                     -- 비밀번호
    moveIn TEXT NOT NULL,              -- 전입유무
    status TEXT NOT NULL,              -- 상태
    options TEXT,                      -- 옵션 (JSON)
    notes TEXT,                        -- 특이사항
    contact TEXT NOT NULL,             -- 연락처
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠️ 로컬 개발

```bash
# 로컬 D1 데이터베이스 초기화
wrangler d1 execute jemin-db --local --file=./schema.sql

# 로컬 개발 서버 실행
wrangler pages dev . --d1=DB=jemin-db

# 브라우저에서 http://localhost:8788 접속
```

## 📝 건물 및 타입

### 타워더모스트
- A타입, B타입, C타입, D타입

### 해링턴타워
- 101동, 102동, 103동

### KCC하버뷰
- 101동, 102동, 원룸형(도생), 원룸형(오피)

## 🎯 주요 기능

- ✅ 매물 등록/조회/수정/삭제
- ✅ 건물별 동/타입 자동 매칭
- ✅ 옵션 관리 (티비, 쇼파, 블라인드, 커튼, 풀옵션)
- ✅ 필터링 및 검색
- ✅ 대시보드 통계
- ✅ 반응형 디자인 (모바일/데스크톱)

## 📱 옵션

- 티비
- 쇼파
- 블라인드
- 커튼
- 풀옵션 (모든 옵션 일괄 선택)

## 🔧 문제 해결

### D1 바인딩 오류
- Cloudflare Pages 설정에서 D1 바인딩이 올바르게 설정되었는지 확인
- 바인딩 이름이 `DB`인지 확인

### API 호출 실패
- 브라우저 개발자 도구 콘솔에서 에러 확인
- CORS 설정 확인

### 데이터가 표시되지 않음
- D1 데이터베이스에 schema.sql이 제대로 실행되었는지 확인
- `wrangler d1 execute jemin-db --remote --command "SELECT * FROM properties"`로 데이터 확인

## 📄 라이선스

MIT License

