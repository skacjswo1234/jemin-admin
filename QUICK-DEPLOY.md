# ⚡ 빠른 배포 가이드 (원격 DB 전용)

## 🎯 처음 배포 (최초 1회)

```bash
# 1. Wrangler 로그인
wrangler login

# 2. D1 데이터베이스 초기화
wrangler d1 execute jemin-db --remote --file=./schema.sql

# 3. 배포
wrangler pages deploy . --project-name=jemin-admin
```

## ⚙️ D1 바인딩 설정 (최초 1회만!)

**중요: 이 설정을 안 하면 API가 작동 안 됩니다!**

1. https://dash.cloudflare.com 접속
2. **Workers & Pages** → **jemin-admin** 선택
3. **Settings** → **Functions** → **D1 database bindings**
4. **Add binding** 클릭:
   - Variable name: `DB`
   - D1 database: `jemin-db`
5. **Save** 클릭

## 🔄 코드 수정 후 재배포

```bash
# 코드만 수정한 경우
wrangler pages deploy . --project-name=jemin-admin

# DB 스키마도 변경한 경우
wrangler d1 execute jemin-db --remote --file=./schema.sql
wrangler pages deploy . --project-name=jemin-admin
```

## 🌐 배포 후 접속

```
https://jemin-admin.pages.dev/login.html
```

**샘플 계정:** admin_1 ~ admin_10 / 비밀번호: 1234

## 📊 원격 DB 관리

```bash
# 모든 계정 조회
wrangler d1 execute jemin-db --remote --command "SELECT * FROM admins"

# 모든 매물 조회
wrangler d1 execute jemin-db --remote --command "SELECT * FROM properties"

# 특정 계정 비밀번호 리셋
wrangler d1 execute jemin-db --remote --command "UPDATE admins SET password='1234' WHERE username='admin_1'"

# DB 초기화 (전체 삭제 후 재생성)
wrangler d1 execute jemin-db --remote --file=./schema.sql
```

## 🐛 문제 해결

### API 오류 발생 시
1. Cloudflare Pages에서 D1 바인딩 확인
2. 배포 로그 확인: `wrangler pages deployment tail --project-name=jemin-admin`
3. 브라우저 캐시 삭제: Ctrl + Shift + R

### DB 데이터 확인
```bash
# 계정 수 확인
wrangler d1 execute jemin-db --remote --command "SELECT COUNT(*) FROM admins"

# 매물 수 확인
wrangler d1 execute jemin-db --remote --command "SELECT COUNT(*) FROM properties"
```

## 💡 Git 사용하는 경우

```bash
# GitHub에 푸시하면 자동 배포됨
git add .
git commit -m "Update"
git push

# Cloudflare Pages가 자동으로 배포
```

---

**빠른 명령어:**
```bash
# 배포
wrangler pages deploy . --project-name=jemin-admin

# DB 초기화 + 배포
wrangler d1 execute jemin-db --remote --file=./schema.sql && wrangler pages deploy . --project-name=jemin-admin
```

