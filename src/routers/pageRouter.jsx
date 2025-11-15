import {
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  ToolOutlined,
} from "@ant-design/icons";

// Define menu items based on features
const homeMenu = {
  key: "",
  icon: <HomeOutlined />,
  label: "Trang chủ",
};

const userManagementMenu = {
  key: "users",
  icon: <TeamOutlined />,
  label: "Quản lý người dùng",
};

const systemSettingsMenu = {
  key: "settings",
  icon: <SettingOutlined />,
  label: "Cài đặt hệ thống",
  children: [],
};

// Define router configurations for different roles
const adminRouter = [
  {
    key: "",
    icon: <HomeOutlined />,
    label: "Trang chủ",
  },

  {
    key: "system-admin",
    icon: <SettingOutlined />,
    label: "Quản trị hệ thống",
    children: [
      {
        key: "users",
        icon: <TeamOutlined />,
        label: "Quản lý người dùng",
      },
      {
        key: "refresh-tokens",
        icon: <FileTextOutlined />,
        label: "Danh sách refresh token",
      },
    ],
  },
  {
    key: "career-manage",
    icon: <DashboardOutlined />,
    label: "Quản lý nghề nghiệp",
    children: [
      {
        key: "careers",
        label: "Nghề nghiệp",
      },
    ],
  },
];

const modRouter = [homeMenu, userManagementMenu];

const testMenu = {
  key: "test",
  icon: <ToolOutlined />,
  label: "Test Zustand",
};

const userRouter = [homeMenu, testMenu];

// Function to filter router based on role/group_id
export const getRouterByRole = (role) => {
  // Handle both role string and group_id
  const userRole = typeof role === "string" ? role.toUpperCase() : "USER";

  // switch (userRole) {
  //   case "ADMIN":
  //   case "group-123": // Admin group ID from API
  //     return adminRouter;
  //   case "MOD":
  //   case "MODERATOR":
  //     return modRouter;
  //   case "USER":
  //   default:
  //     return userRouter;
  // }

  return adminRouter;
};
