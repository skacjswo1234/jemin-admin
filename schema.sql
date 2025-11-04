-- 관리자 계정 테이블 생성
DROP TABLE IF EXISTS admins;

CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 매물 관리 테이블 생성
DROP TABLE IF EXISTS properties;

CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buildingName TEXT NOT NULL,
    dongType TEXT NOT NULL,
    roomNumber TEXT NOT NULL,
    deposit INTEGER NOT NULL,
    monthlyRent INTEGER NOT NULL,
    password TEXT,
    moveIn TEXT NOT NULL,
    status TEXT NOT NULL,
    options TEXT, -- JSON 문자열로 저장
    notes TEXT,
    contact TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 계정 샘플 데이터 삽입 (비밀번호: 1234)
INSERT INTO admins (username, password, name) VALUES 
    ('admin_1', '1234', '관리자1'),
    ('admin_2', '1234', '관리자2'),
    ('admin_3', '1234', '관리자3'),
    ('admin_4', '1234', '관리자4'),
    ('admin_5', '1234', '관리자5'),
    ('admin_6', '1234', '관리자6'),
    ('admin_7', '1234', '관리자7'),
    ('admin_8', '1234', '관리자8'),
    ('admin_9', '1234', '관리자9'),
    ('admin_10', '1234', '관리자10');

-- 인덱스 생성
CREATE INDEX idx_username ON admins(username);
CREATE INDEX idx_buildingName ON properties(buildingName);
CREATE INDEX idx_status ON properties(status);
CREATE INDEX idx_createdAt ON properties(createdAt DESC);

-- 샘플 데이터 삽입
INSERT INTO properties (buildingName, dongType, roomNumber, deposit, monthlyRent, password, moveIn, status, options, notes, contact) 
VALUES 
    ('타워더모스트', 'A타입', '1503', 5000, 50, '1234#', '전입', '임대중', '["티비","쇼파"]', '깨끗하게 관리되고 있습니다. 역 근처 편리한 위치.', '010-1234-5678'),
    ('해링턴타워', '101동', '201', 3000, 40, '5678*', '미전입', '공실', '["블라인드","커튼"]', '햇빛 잘 드는 남향입니다.', '010-2345-6789'),
    ('KCC하버뷰', '원룸형(도생)', '305', 4000, 45, '9012#', '전입', '공실', '["티비","쇼파","블라인드","커튼"]', '전망이 좋습니다.', '010-3456-7890');

