# 배포 가이드

## 📋 사전 준비

```bash
# 1. Wrangler CLI 설치 (아직 설치하지 않은 경우)
npm install -g wrangler

# 2. Cloudflare 로그인
wrangler login
```

## 🚀 첫 배포 (최초 1회)

### 1단계: D1 데이터베이스 초기화

```bash
# D1 데이터베이스에 스키마 및 샘플 데이터 적용
wrangler d1 execute jemin-db --remote --file=./schema.sql
```

### 2단계: Cloudflare Pages 배포

**방법 A: Git 연동 배포 (권장)**

```bash
# Git 저장소 초기화 (아직 하지 않은 경우)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial deployment with login system"

# GitHub에 푸시 (원격 저장소 URL을 실제 주소로 변경)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

그 다음 Cloudflare Pages 대시보드에서:
1. **Pages** > **Create a project** > **Connect to Git**
2. GitHub 저장소 선택
3. **Build settings**:
   - Build command: (비워둠)
   - Build output directory: `/`
4. **Environment variables**: (필요 없음)
5. **Save and Deploy**

**방법 B: 직접 배포**

```bash
# 현재 디렉토리를 jemin-admin 프로젝트로 직접 배포
wrangler pages deploy . --project-name=jemin-admin
```

### 3단계: D1 바인딩 설정

Cloudflare Pages 대시보드에서:
1. 배포된 **프로젝트 선택**
2. **Settings** > **Functions** > **D1 database bindings**
3. **Add binding** 클릭:
   - Variable name: `DB`
   - D1 database: `jemin-db` 선택
4. **Save** 클릭

## 🔄 업데이트 배포 (코드 수정 후)

### 데이터베이스 스키마 변경이 없는 경우

**Git 연동인 경우:**
```bash
git add .
git commit -m "Update: your change description"
git push
```

**직접 배포인 경우:**
```bash
wrangler pages deploy . --project-name=jemin-admin
```

### 데이터베이스 스키마 변경이 있는 경우

```bash
# 1. 먼저 D1 데이터베이스 업데이트
wrangler d1 execute jemin-db --remote --file=./schema.sql

# 2. 코드 배포 (Git 또는 직접 배포)
git add .
git commit -m "Update with schema changes"
git push

# 또는
wrangler pages deploy . --project-name=jemin-admin
```

## 🧪 개발 및 테스트

원격 DB를 직접 사용하여 테스트:

```bash
# 배포 후 바로 테스트
# https://jemin-admin.pages.dev/login.html 접속

# 또는 Live Preview / Live Server로 HTML 파일 직접 열기
# (API는 배포된 Cloudflare Pages Functions 사용)
```

## 📊 D1 데이터베이스 관리

### 데이터 조회

```bash
# 전체 매물 조회
wrangler d1 execute jemin-db --remote --command "SELECT * FROM properties"

# 전체 계정 조회
wrangler d1 execute jemin-db --remote --command "SELECT * FROM admins"

# 특정 계정 조회
wrangler d1 execute jemin-db --remote --command "SELECT * FROM admins WHERE username='admin_1'"
```

### 데이터 백업

```bash
# 매물 데이터 백업
wrangler d1 execute jemin-db --remote --command "SELECT * FROM properties" > backup_properties.json

# 계정 데이터 백업
wrangler d1 execute jemin-db --remote --command "SELECT * FROM admins" > backup_admins.json
```

### 특정 SQL 실행

```bash
# 계정 비밀번호 리셋
wrangler d1 execute jemin-db --remote --command "UPDATE admins SET password='1234' WHERE username='admin_1'"

# 특정 매물 삭제
wrangler d1 execute jemin-db --remote --command "DELETE FROM properties WHERE id=1"
```

## 🔍 문제 해결

### D1 바인딩 오류
```bash
# wrangler.toml 파일 확인
cat wrangler.toml

# D1 바인딩이 올바른지 확인:
# [[d1_databases]]
# binding = "DB"
# database_name = "jemin-db"
# database_id = "2de50dc3-45d2-444a-bff6-d18d4e47c8e8"
```

### 배포 로그 확인
```bash
# Pages 배포 로그 확인
wrangler pages deployment list --project-name=jemin-admin

# 특정 배포 로그 확인
wrangler pages deployment tail --project-name=jemin-admin
```

### 캐시 문제
브라우저에서:
1. `Ctrl + Shift + R` (하드 리프레시)
2. 또는 개발자 도구 > 네트워크 탭 > "Disable cache" 체크

## 📱 접속 URL

배포 후 접속 URL:
- **프로덕션**: `https://jemin-admin.pages.dev/login.html`
- **또는 커스텀 도메인**: `https://your-custom-domain.com/login.html`

## 🔐 샘플 로그인 계정

| 아이디 | 비밀번호 | 성명 |
|--------|----------|------|
| admin_1 | 1234 | 관리자1 |
| admin_2 | 1234 | 관리자2 |
| admin_3 | 1234 | 관리자3 |
| admin_4 | 1234 | 관리자4 |
| admin_5 | 1234 | 관리자5 |
| admin_6 | 1234 | 관리자6 |
| admin_7 | 1234 | 관리자7 |
| admin_8 | 1234 | 관리자8 |
| admin_9 | 1234 | 관리자9 |
| admin_10 | 1234 | 관리자10 |

## 💡 빠른 배포 명령어 모음

```bash
# === 첫 배포 ===
wrangler d1 execute jemin-db --remote --file=./schema.sql
wrangler pages deploy . --project-name=jemin-admin

# === 코드 업데이트 (Git 사용) ===
git add .
git commit -m "Update"
git push

# === 코드 업데이트 (직접 배포) ===
wrangler pages deploy . --project-name=jemin-admin

# === DB 스키마 변경 + 코드 업데이트 ===
wrangler d1 execute jemin-db --remote --file=./schema.sql
wrangler pages deploy . --project-name=jemin-admin
```

## 🎯 체크리스트

배포 전 확인사항:
- [ ] `wrangler.toml` 파일에 D1 바인딩 정보가 정확한가?
- [ ] `schema.sql` 파일이 최신 버전인가?
- [ ] D1 데이터베이스가 생성되어 있는가?
- [ ] Cloudflare Pages에 D1 바인딩이 설정되어 있는가?

배포 후 확인사항:
- [ ] 로그인 페이지가 정상적으로 표시되는가?
- [ ] 샘플 계정으로 로그인이 되는가?
- [ ] 매물 등록/조회/수정/삭제가 정상 작동하는가?
- [ ] 계정 관리 기능이 정상 작동하는가?

