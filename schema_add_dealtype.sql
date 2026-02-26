-- properties 테이블에 거래유형(월세/전세/매매) 및 매매가 컬럼 추가
-- 기존 데이터는 dealType = '월세', salePrice = NULL 로 간주

ALTER TABLE properties ADD COLUMN dealType TEXT DEFAULT '월세';
ALTER TABLE properties ADD COLUMN salePrice INTEGER;

-- 기존 행에 기본값 적용
UPDATE properties SET dealType = '월세' WHERE dealType IS NULL;
