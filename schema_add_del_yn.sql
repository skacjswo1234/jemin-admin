-- del_yn 컬럼 추가 스크립트
-- properties 테이블에 삭제 여부를 표시하는 컬럼 추가

-- 1. del_yn 컬럼 추가 (기본값 'N')
ALTER TABLE properties ADD COLUMN del_yn TEXT DEFAULT 'N' CHECK(del_yn IN ('Y', 'N'));

-- 2. 기존 데이터의 del_yn 값을 'N'으로 설정 (NULL 방지)
UPDATE properties SET del_yn = 'N' WHERE del_yn IS NULL;

-- 3. 인덱스 추가 (삭제되지 않은 매물 조회 성능 향상)
CREATE INDEX idx_del_yn ON properties(del_yn);

-- 4. 삭제되지 않은 매물 조회를 위한 복합 인덱스
CREATE INDEX idx_del_yn_status ON properties(del_yn, status);

-- 확인 쿼리
-- SELECT * FROM properties WHERE del_yn = 'N'; -- 활성 매물만 조회
-- SELECT * FROM properties WHERE del_yn = 'Y'; -- 삭제된 매물만 조회
