/**
 * Script seed data cho Schools và Classes
 * Chạy: node seed-data.js
 * Yêu cầu: Server đang chạy và có token authentication
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api/v1/system-admin';
let AUTH_TOKEN = ''; // Sẽ được lấy sau khi login

// Dữ liệu mẫu cho Schools
const schoolsData = [
  {
    name: 'Trường THPT Nguyễn Huệ',
    address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    phone_number: '0281234567',
    contact_email: 'thptnguynhue@edu.vn'
  },
  {
    name: 'Trường THCS Trần Hưng Đạo',
    address: '456 Đường Nguyễn Trãi, Quận 5, TP.HCM',
    phone_number: '0287654321',
    contact_email: 'thcstranhungdao@edu.vn'
  },
  {
    name: 'Trường Tiểu học Kim Đồng',
    address: '789 Đường Lý Thường Kiệt, Quận 10, TP.HCM',
    phone_number: '0289876543',
    contact_email: 'thkimdong@edu.vn'
  },
  {
    name: 'Trường THPT Lê Quý Đôn',
    address: '321 Đường Hai Bà Trưng, Quận 3, TP.HCM',
    phone_number: '0283456789',
    contact_email: 'thptlequydon@edu.vn'
  },
  {
    name: 'Trường THCS Lê Lợi',
    address: '654 Đường Võ Văn Tần, Quận Tân Bình, TP.HCM',
    phone_number: '0286543210',
    contact_email: 'thcsleloi@edu.vn'
  }
];

// Dữ liệu mẫu cho Classes (sẽ tạo sau khi có school_id)
const getClassesData = (schoolIds) => [
  // THPT Nguyễn Huệ - Lớp 10, 11, 12
  { name: 'Lớp 10A1', grade_level: 10, school_id: schoolIds[0] },
  { name: 'Lớp 10A2', grade_level: 10, school_id: schoolIds[0] },
  { name: 'Lớp 11A1', grade_level: 11, school_id: schoolIds[0] },
  { name: 'Lớp 11A2', grade_level: 11, school_id: schoolIds[0] },
  { name: 'Lớp 12A1', grade_level: 12, school_id: schoolIds[0] },
  { name: 'Lớp 12A2', grade_level: 12, school_id: schoolIds[0] },

  // THCS Trần Hưng Đạo - Lớp 6, 7, 8, 9
  { name: 'Lớp 6A', grade_level: 6, school_id: schoolIds[1] },
  { name: 'Lớp 6B', grade_level: 6, school_id: schoolIds[1] },
  { name: 'Lớp 7A', grade_level: 7, school_id: schoolIds[1] },
  { name: 'Lớp 8A', grade_level: 8, school_id: schoolIds[1] },
  { name: 'Lớp 9A', grade_level: 9, school_id: schoolIds[1] },

  // Tiểu học Kim Đồng - Lớp 1-5
  { name: 'Lớp 1A', grade_level: 1, school_id: schoolIds[2] },
  { name: 'Lớp 2A', grade_level: 2, school_id: schoolIds[2] },
  { name: 'Lớp 3A', grade_level: 3, school_id: schoolIds[2] },
  { name: 'Lớp 4A', grade_level: 4, school_id: schoolIds[2] },
  { name: 'Lớp 5A', grade_level: 5, school_id: schoolIds[2] },

  // THPT Lê Quý Đôn - Lớp 10-12
  { name: 'Lớp 10 Toán', grade_level: 10, school_id: schoolIds[3] },
  { name: 'Lớp 10 Lý', grade_level: 10, school_id: schoolIds[3] },
  { name: 'Lớp 11 Toán', grade_level: 11, school_id: schoolIds[3] },
  { name: 'Lớp 12 Toán', grade_level: 12, school_id: schoolIds[3] },

  // THCS Lê Lợi - Lớp 6-9
  { name: 'Lớp 6C', grade_level: 6, school_id: schoolIds[4] },
  { name: 'Lớp 7B', grade_level: 7, school_id: schoolIds[4] },
  { name: 'Lớp 8B', grade_level: 8, school_id: schoolIds[4] },
  { name: 'Lớp 9B', grade_level: 9, school_id: schoolIds[4] },
];

// Hàm login để lấy token
async function login() {
  try {
    const response = await axios.post('http://localhost:8080/api/v1/auth/login', {
      user_name: 'admin',
      password: 'password123'
    });

    if (response.data.success && response.data.data.access_token) {
      AUTH_TOKEN = response.data.data.access_token;
      console.log('✅ Login thành công!');
      return true;
    } else {
      console.error('❌ Login thất bại');
      return false;
    }
  } catch (error) {
    console.error('❌ Lỗi khi login:', error.response?.data?.message || error.message);
    console.log('\n💡 Hướng dẫn: Đảm bảo có tài khoản admin với username="admin" và password="123456"');
    return false;
  }
}

// Hàm tạo schools
async function createSchools() {
  console.log('\n📚 Bắt đầu tạo Schools...');
  const createdSchools = [];

  for (let i = 0; i < schoolsData.length; i++) {
    try {
      const response = await axios.post(
        `${BASE_URL}/schools`,
        schoolsData[i],
        {
          headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        }
      );

      if (response.data.success) {
        createdSchools.push(response.data.data);
        console.log(`✅ [${i + 1}/${schoolsData.length}] Đã tạo: ${schoolsData[i].name}`);
      }
    } catch (error) {
      console.error(`❌ [${i + 1}/${schoolsData.length}] Lỗi tạo ${schoolsData[i].name}:`, 
        error.response?.data?.message || error.message);
    }
  }

  console.log(`\n✅ Tạo thành công ${createdSchools.length}/${schoolsData.length} schools`);
  return createdSchools;
}

// Hàm tạo classes
async function createClasses(schoolIds) {
  console.log('\n📖 Bắt đầu tạo Classes...');
  const classesData = getClassesData(schoolIds);
  let successCount = 0;

  for (let i = 0; i < classesData.length; i++) {
    try {
      const response = await axios.post(
        `${BASE_URL}/classes`,
        classesData[i],
        {
          headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        }
      );

      if (response.data.success) {
        successCount++;
        console.log(`✅ [${i + 1}/${classesData.length}] Đã tạo: ${classesData[i].name}`);
      }
    } catch (error) {
      console.error(`❌ [${i + 1}/${classesData.length}] Lỗi tạo ${classesData[i].name}:`, 
        error.response?.data?.message || error.message);
    }
  }

  console.log(`\n✅ Tạo thành công ${successCount}/${classesData.length} classes`);
}

// Main function
async function main() {
  console.log('🚀 BẮT ĐẦU SEED DATA\n');
  console.log('='.repeat(50));

  // 1. Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Không thể tiếp tục. Vui lòng kiểm tra lại thông tin đăng nhập.');
    return;
  }

  // 2. Tạo Schools
  const schools = await createSchools();
  if (schools.length === 0) {
    console.log('\n❌ Không có school nào được tạo. Dừng lại.');
    return;
  }

  // 3. Tạo Classes
  const schoolIds = schools.map(school => school.id);
  await createClasses(schoolIds);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 HOÀN THÀNH SEED DATA!');
  console.log(`📊 Tổng kết: ${schools.length} schools và các classes đã được tạo`);
}

// Chạy script
main().catch(error => {
  console.error('\n💥 LỖI NGHIÊM TRỌNG:', error);
  process.exit(1);
});
