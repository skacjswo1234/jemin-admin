-- properties 테이블에 수정일 컬럼 추가
-- 기존 데이터는 updatedAt이 NULL (수정 이력 없음으로 표시)

ALTER TABLE properties ADD COLUMN updatedAt DATETIME;

-- 수정 시 updatedAt 자동 갱신은 API(PUT)에서 처리
