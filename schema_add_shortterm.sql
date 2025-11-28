-- properties 테이블에 단기가능여부 및 단기월세 컬럼 추가

-- 단기가능여부 컬럼 추가 (Y 또는 N, 기본값 N)
ALTER TABLE properties ADD COLUMN shortTermAvailable TEXT DEFAULT 'N';

-- 단기월세 컬럼 추가 (단기가능여부가 Y일 경우 입력)
ALTER TABLE properties ADD COLUMN shortTermRent TEXT;

